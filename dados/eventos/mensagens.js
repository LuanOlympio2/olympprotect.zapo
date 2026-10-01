// creditos Olympio
const fs = require('fs');
const path = require('path');
const moment = require('moment-timezone');
const { getContentType } = require('baileys');
const Usuario = require('../modelos/Usuario.js');
const Grupo = require('../modelos/grupos');
const BotConfig = require('../modelos/BotConfig');
const { normalizeId, isUserAdmin, isBotAdmin, findParticipant, compareIds, cleanDeviceJid, resolveToPhoneJid, formatUserTag, getMentionJids } = require('../funções/normalizarid');
const { isOwnerSender } = require('../funções/ownerAuth');
const groupCache = require('../funções/groupCache');
const groupMetadataManager = require('../funções/groupMetadataManager');
const lidCache = require('../funções/lidCache');
const tictactoe = require('../funções/tictactoe');
const akinatorManager = require('../funções/akinatorManager');
const quizManager = require('../funções/rpg/quizManager');
const { getSimilarity } = require('../funções/similaridade');
const { handleAutoDownload } = require('../funções/autodl');
const { hasPaymentMessage, handleAntiPgMessage, antiPgRecentBans } = require('../funções/antipg_sistema');
const { handleAntiSpamMessage } = require('../funções/antispam_sistema');
const { handleAntiDeleteX9, handleViewOnceX9 } = require('../funções/x9_sistema');
const { buildSimilarityCard, buildPrefixCard, safeSendMenu, buildPlayCard, toSmallCaps } = require('../funções/layout');
if (typeof global.botOnline === 'undefined') global.botOnline = true;
if (!global.messageFloodMap) global.messageFloodMap = new Map();
if (!global.commandCooldowns) global.commandCooldowns = new Map();
if (!global.messagesCache) global.messagesCache = new Map();
const comandos = {};
const pastaComandos = '../comandos/';
const pastaComandosAbsoluta = path.resolve(__dirname, pastaComandos);
const lerComandos = (dir) => {
    try {
        const files = fs.readdirSync(dir);
        for (const file of files) {
            const fullPath = path.join(dir, file);
            const stat = fs.statSync(fullPath);
            if (stat.isDirectory()) {
                lerComandos(fullPath);
                continue;
            }
            if (!file.endsWith('.js')) continue;
            try {
                const commandModule = require(fullPath);
                const commandName = file.split('.')[0];
                const commandAliases = commandModule.aliases || [commandName];
                const folderName = path.basename(path.dirname(fullPath));
                commandModule.category = folderName;
                for (const alias of commandAliases) {
                    comandos[alias] = commandModule;
                }
            } catch (e) {
                console.error(`Erro ao carregar ${file}: ${e.message}`);
            }
        }
    } catch (e) {
        console.log(`Erro ao ler comandos: ${e.message}`);
    }
};
if (fs.existsSync(pastaComandosAbsoluta)) {
    lerComandos(pastaComandosAbsoluta);
}
function cleanLid(id) {
    return cleanDeviceJid(id);
}

let cachedBotConfig = null;
let lastBotConfigFetch = 0;
async function getCachedBotConfig() {
    const now = Date.now();
    if (!cachedBotConfig || now - lastBotConfigFetch > 60000) {
        cachedBotConfig = await BotConfig.findOne().catch(() => null);
        lastBotConfigFetch = now;
    }
    return cachedBotConfig;
}

async function ensureUsuarioLocal(senderNumber, senderName, msg) {
    let usuario = await Usuario.findOne({ userId: senderNumber }).catch(() => null);
    if (!usuario) {
        usuario = new Usuario({
            userId: senderNumber,
            nome: senderName
        });
    }
    usuario.nome = senderName;
    usuario.ultimaMensagem = Date.now();
    usuario.mensagensEnviadas = (usuario.mensagensEnviadas || 0) + 1;
    if (getContentType(msg.message) === 'stickerMessage') {
        usuario.figurinhasEnviadas = (usuario.figurinhasEnviadas || 0) + 1;
    }
    usuario.save().catch(() => {});
    return usuario;
}
function updateGroupMemberActivity(grupoConfig, senderNumber) {
    if (!grupoConfig) return false;
    if (!Array.isArray(grupoConfig.memberActivity)) {
        grupoConfig.memberActivity = [];
    }
    let entry = grupoConfig.memberActivity.find((item) => item.userId === senderNumber);
    if (!entry) {
        entry = {
            userId: senderNumber,
            messages: 0,
            lastMessageAt: Date.now()
        };
        grupoConfig.memberActivity.push(entry);
    }
    entry.messages += 1;
    entry.lastMessageAt = Date.now();
    return true;
}
function formatDuration(ms) {
    if (!ms || ms <= 0) return 'alguns segundos';
    const totalSeconds = Math.floor(ms / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const parts = [];
    if (days > 0) parts.push(`${days} ${days === 1 ? 'dia' : 'dias'}`);
    if (hours > 0) parts.push(`${hours} ${hours === 1 ? 'hora' : 'horas'}`);
    if (minutes > 0) parts.push(`${minutes} ${minutes === 1 ? 'minuto' : 'minutos'}`);
    if (seconds > 0 || parts.length === 0) parts.push(`${seconds} ${seconds === 1 ? 'segundo' : 'segundos'}`);

    if (parts.length === 1) return parts[0];
    if (parts.length === 2) return `${parts[0]} e ${parts[1]}`;
    return `${parts.slice(0, -1).join(', ')} e ${parts[parts.length - 1]}`;
}

async function handleAfkMentions(conn, from, msg, senderNumber, senderName) {
    const contextInfo = msg.message?.extendedTextMessage?.contextInfo;
    const mentionedJid = contextInfo?.mentionedJid || [];
    const quotedParticipant = contextInfo?.participant ? [contextInfo.participant] : [];
    const targets = [...new Set([...mentionedJid, ...quotedParticipant].map((id) => normalizeId(id)).filter(Boolean))];
    for (const targetId of targets) {
        if (targetId === senderNumber) continue;
        const usuario = await Usuario.findOne({ userId: targetId });
        if (!usuario?.afkSince) continue;
        const horario = moment(usuario.afkSince).tz('America/Sao_Paulo').format('HH:mm:ss');
        const temMotivo = usuario.afkReason && usuario.afkReason.trim();
        const infoLines = [
            `👤 *${toSmallCaps('membro')}:* @${targetId}`,
            `🕒 *${toSmallCaps('desde')}:* ${horario} (Brasília)`
        ];
        if (temMotivo) {
            infoLines.push(`📝 *${toSmallCaps('motivo')}:* ${usuario.afkReason.trim()}`);
        }
        const card = buildPlayCard({
            title: 'MEMBRO AUSENTE (AFK)',
            subtitle: 'Notificação de Status',
            icon: '💤',
            infoLines,
            result: temMotivo
                ? `@${targetId} está ausente pelo motivo: "${usuario.afkReason.trim()}". Por favor, aguarde o retorno!`
                : `@${targetId} está ausente no momento. Por favor, aguarde o retorno!`
        });
        await conn.sendMessage(from, {
            text: card,
            mentions: [`${targetId}@s.whatsapp.net`, `${senderNumber}@s.whatsapp.net`]
        }, { quoted: msg });
    }
}
function registerFlood(groupId, senderNumber, maxMessages, intervalSeconds) {
    const key = `${groupId}:${senderNumber}`;
    const now = Date.now();
    const windowMs = intervalSeconds * 1000;
    const entries = (global.messageFloodMap.get(key) || []).filter((timestamp) => now - timestamp <= windowMs);
    entries.push(now);
    global.messageFloodMap.set(key, entries);
    return entries.length > maxMessages;
}
async function mensagensHandler(conn, m, config) {
    try {
        const type = m.type;
        if (type !== 'notify') return;
        const msg = m.messages[0];
        if (!msg.message || msg.key.remoteJid === 'status@broadcast') return;
        const prefix = config.prefix || '!';
        const from = msg.key.remoteJid;
        if (!from) return;
        if (msg.key?.id && msg.message) {
            global.messagesCache.set(msg.key.id, msg.message);
        }
        const isGroup = from.endsWith('@g.us');
        const botJid = conn.user?.id ? `${conn.user.id.split(':')[0]}@s.whatsapp.net` : null;
        const rawSender = isGroup ? (msg.key.participant || (msg.key.fromMe ? botJid : from)) : (msg.key.fromMe ? botJid : from);
        let sender = cleanLid(rawSender);
        const senderName = msg.pushName || 'Usuario';
        if (sender.includes('@lid')) {
            let cachedSender = lidCache.getJid(sender);
            if (!cachedSender && conn.store && conn.store.contacts) {
                for (const [jid, contact] of Object.entries(conn.store.contacts)) {
                    if (jid.endsWith('@s.whatsapp.net')) {
                        const cNotify = contact.notify || '';
                        const cName = contact.name || '';
                        if (senderName && senderName !== 'Usuario' && (cNotify === senderName || cName === senderName)) {
                            lidCache.set(jid, sender);
                            cachedSender = jid;
                            break;
                        }
                    }
                }
            }
            if (cachedSender) sender = cachedSender;
        }
        const botId = normalizeId(conn.user.id);
        let senderNumber = normalizeId(sender);
        let isOwner = isOwnerSender(config, sender, msg, conn) || isOwnerSender(config, rawSender, msg, conn);
        const body =
            msg.message.conversation ||
            msg.message.extendedTextMessage?.text ||
            msg.message.imageMessage?.caption ||
            msg.message.videoMessage?.caption ||
            '';
        const fullText = body;
        const cleanBodyLower = body.trim().toLowerCase();
        const isPrefixlessCu = !body.startsWith(prefix) && (cleanBodyLower === 'cu' || cleanBodyLower === 'cú' || cleanBodyLower.startsWith('cu ') || cleanBodyLower.startsWith('cú '));
        const isCommand = (body.startsWith(prefix) && body.slice(prefix.length).trim().length > 0) || isPrefixlessCu;

        if (msg.key.fromMe && !isCommand) return;

        if (fullText.trim() === prefix) {
            return;
        }
        const command = isPrefixlessCu ? 'cu' : (isCommand ? body.slice(prefix.length).trim().split(/ +/)[0].toLowerCase() : '');
        const args = isPrefixlessCu ? body.trim().split(/ +/).slice(1) : (isCommand ? body.trim().split(/ +/).slice(1) : []);
        let groupMetadata = null;
        let groupName = '';
        let isBotAd = false;
        let isUserAd = false;
        let grupoConfig = null;
        if (isGroup) {
            try {
                let cachedData = groupCache.get(from);
                if (cachedData && cachedData.config && cachedData.metadata) {
                    groupMetadata = cachedData.metadata;
                    grupoConfig = cachedData.config;
                } else {
                    grupoConfig = await Grupo.findOne({ groupId: from });
                    if (!grupoConfig) {
                        grupoConfig = new Grupo({ groupId: from });
                        await grupoConfig.save().catch(() => {});
                    }
                    groupMetadata = groupMetadataManager.get(from);
                    if (!groupMetadata) {
                        try {
                            const metaPromise = conn.groupMetadata(from);
                            const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 3500));
                            groupMetadata = await Promise.race([metaPromise, timeoutPromise]).catch(() => null);
                            if (groupMetadata) {
                                groupMetadataManager.set(from, groupMetadata);
                            }
                        } catch (_) {
                            groupMetadata = null;
                        }
                    }
                    if (!groupMetadata) {
                        groupMetadata = { id: from, subject: '', participants: [] };
                    }
                    groupCache.set(from, {
                        metadata: groupMetadata,
                        config: grupoConfig
                    });
                }
                groupName = groupMetadata?.subject || '';
                if (groupMetadata?.participants) {
                    groupMetadata.participants.forEach((p) => {
                        if (!p) return;
                        const phone = p.phoneNumber || (!p.id?.includes('@lid') ? p.id : null);
                        const lid = p.lid || (p.id?.includes('@lid') ? p.id : null);
                        if (phone && lid) {
                            const cleanPhone = phone.includes('@') ? cleanDeviceJid(phone) : `${phone.split(':')[0]}@s.whatsapp.net`;
                            const cleanLid = cleanDeviceJid(lid);
                            lidCache.set(cleanPhone, cleanLid);
                        }
                    });
                    sender = resolveToPhoneJid(sender, groupMetadata.participants);
                    senderNumber = normalizeId(sender);
                    isOwner = isOwner || isOwnerSender(config, sender, msg, conn);
                }
                isBotAd = isBotAdmin(groupMetadata, conn.user.id);
                isUserAd = isUserAdmin(groupMetadata, sender, conn) || isUserAdmin(groupMetadata, rawSender, conn);
            } catch (e) {
                console.error('Erro ao carregar dados do grupo:', e);
            }
        }
        let usuarioDB = null;
        if (!msg.key.fromMe) {
            try {
                usuarioDB = await ensureUsuarioLocal(senderNumber, senderName, msg);
            } catch (userError) {
                console.error('Erro ao atualizar usuario local:', userError);
            }
        }
        const botConfig = await getCachedBotConfig();
        if (botConfig?.blockedUsers?.includes(senderNumber) && !isOwner) {
            return;
        }
        if (usuarioDB?.afkSince && fullText.trim()) {
            const afkDurationMs = Date.now() - usuarioDB.afkSince;
            const tempoFormatado = formatDuration(afkDurationMs);
            usuarioDB.afkSince = null;
            usuarioDB.afkReason = '';
            usuarioDB.save().catch(() => {});

            const card = buildPlayCard({
                title: 'RETORNO DO AFK',
                subtitle: 'Status Atualizado',
                icon: '👋',
                infoLines: [
                    `👤 *${toSmallCaps('usuario')}:* @${senderNumber}`,
                    `⏱️ *${toSmallCaps('tempo ausente')}:* ${tempoFormatado}`
                ],
                result: `Bem-vindo(a) de volta, @${senderNumber}! Você esteve ausente por *${tempoFormatado}*.`
            });

            await conn.sendMessage(from, {
                text: card,
                mentions: [`${senderNumber}@s.whatsapp.net`]
            }, { quoted: msg });
        }
        await handleAfkMentions(conn, from, msg, senderNumber, senderName);
        const time = moment().tz('America/Sao_Paulo').format('HH:mm:ss');
        const logType = isCommand ? 'COMANDO' : 'MENSAGEM';
        const logColor = isCommand ? '\x1b[32m' : '\x1b[36m';
        const resetColor = '\x1b[0m';
        console.log(`${logColor}╔════════════════════════════════════════${resetColor}`);
        console.log(`${logColor}║ [${time}] [${logType}]${resetColor}`);
        console.log(`${logColor}║ 👤 De: ${senderName} (${senderNumber})${resetColor}`);
        if (isGroup) console.log(`${logColor}║ 👥 Grupo: ${groupName || from}${resetColor}`);
        console.log(`${logColor}║ 💬 Conteúdo: ${fullText.slice(0, 50)}${fullText.length > 50 ? '...' : ''}${resetColor}`);
        console.log(`${logColor}╚════════════════════════════════════════${resetColor}`);
        if (!isGroup) {
            try {
                if (botConfig?.antipv) {
                    const usuario = await Usuario.findOne({ userId: senderNumber });
                    const isVip = !!usuario?.vip;
                    if (!isVip && !isOwner) {
                        return;
                    }
                }
            } catch (e) {
                console.error('Erro no Anti-PV:', e);
            }
        }
        if (isGroup && grupoConfig && !msg.key.fromMe) {
            if (updateGroupMemberActivity(grupoConfig, senderNumber)) {
                grupoConfig.save().catch(() => {});
            }
            if (
                grupoConfig.antiflood?.enabled &&
                !isUserAd &&
                !isOwner &&
                registerFlood(from, senderNumber, grupoConfig.antiflood.maxMessages, grupoConfig.antiflood.intervalSeconds)
            ) {
                if (isBotAd) {
                    try {
                        await conn.sendMessage(from, { delete: msg.key });
                    } catch (_) {}
                }
                await conn.sendMessage(from, {
                    text: `⚠️ @${senderNumber}, desacelera. O antiflood está ativo neste grupo.`,
                    mentions: [`${senderNumber}@s.whatsapp.net`]
                }, { quoted: msg });
                return;
            }
            if (msg.message?.protocolMessage && grupoConfig?.x9) {
                await handleAntiDeleteX9(conn, msg, from, grupoConfig, groupMetadata, global.messagesCache);
            }
            const isVisuU = !!msg.message?.viewOnceMessage;
            const isVisuU2 = !!msg.message?.viewOnceMessageV2;
            if ((isVisuU || isVisuU2) && (grupoConfig?.x9 || grupoConfig?.antivisu)) {
                await handleViewOnceX9(conn, msg, from, grupoConfig, groupMetadata, sender, isVisuU, isVisuU2);
            }
            const isRealGroupCreator = groupMetadata?.owner && normalizeId(sender) === normalizeId(groupMetadata.owner);
            if (grupoConfig.antipg && !isOwner && !isRealGroupCreator) {
                const handled = await handleAntiPgMessage(conn, msg, from, isGroup, isOwner, isRealGroupCreator, isBotAd, grupoConfig.antipg, sender);
                if (handled) return;
            }
            if (grupoConfig.antispam && !isUserAd && !isOwner) {
                const handledSpam = await handleAntiSpamMessage(conn, msg, from, isGroup, isUserAd, isOwner, isBotAd, grupoConfig.antispam, sender);
                if (handledSpam) return;
            }
            if (grupoConfig.antifake && !isUserAd && !senderNumber.startsWith('55')) {
                if (isBotAd) {
                    try { await conn.sendMessage(from, { delete: msg.key }); } catch (_) {}
                    await conn.sendMessage(from, { text: '🚫 *Anti Fake:* números estrangeiros não são permitidos neste grupo.' });
                    await conn.groupParticipantsUpdate(from, [sender], 'remove');
                    return;
                }
            }
            if (grupoConfig.antilink && !isUserAd) {
                const groupLinkRegex = /(?:chat\.whatsapp\.com\/|wa\.me\/channel\/|whatsapp\.com\/channel\/)[a-zA-Z0-9]{15,}/i;
                if (groupLinkRegex.test(fullText)) {
                    if (isBotAd) {
                        await conn.sendMessage(from, { delete: msg.key });
                        await conn.groupParticipantsUpdate(from, [sender], 'remove');
                        await conn.sendMessage(from, { text: '🚫 *Anti Link de Grupo:* convite detectado e membro removido.' });
                        return;
                    }
                    await conn.sendMessage(from, { text: '⚠️ *Anti Link de Grupo:* detectei um convite, mas preciso de admin para remover.' });
                }
            }
            if (grupoConfig.antilinkNormal && !isUserAd) {
                const groupLinkRegex = /(?:chat\.whatsapp\.com\/|wa\.me\/channel\/|whatsapp\.com\/channel\/)[a-zA-Z0-9]{15,}/i;
                const normalLinkRegex = /(?:https?:\/\/|http:\/\/|www\.)[^\s]+|(?:[a-zA-Z0-9-]+\.)+(?:com|br|net|org|io|me|app|xyz|site|online|tech|info|dev)(?:\/[^\s]*)?/i;
                if (!groupLinkRegex.test(fullText) && normalLinkRegex.test(fullText)) {
                    if (isBotAd) {
                        await conn.sendMessage(from, { delete: msg.key });
                        await conn.groupParticipantsUpdate(from, [sender], 'remove');
                        await conn.sendMessage(from, { text: '🚫 *Anti Link:* URL detectada e membro removido.' });
                        return;
                    }
                    await conn.sendMessage(from, { text: '⚠️ *Anti Link:* detectei uma URL, mas preciso de admin para remover.' });
                }
            }
            if (grupoConfig.antimarcacao && !isUserAd) {
                const msgType = getContentType(msg.message);
                const contextInfo = msg.message?.[msgType]?.contextInfo;
                const mentions = contextInfo?.mentionedJid || [];
                const tagKeywords = /@todos|@marcar|@everyone|@all/i.test(fullText);
                if (mentions.length >= 3 || tagKeywords) {
                    if (isBotAd) {
                        await conn.sendMessage(from, { delete: msg.key });
                        await conn.sendMessage(from, { text: `🚫 *@${senderNumber}*, não é permitido marcar múltiplos membros neste grupo.`, mentions: [sender] });
                        return;
                    }
                }
            }
            const checks = [
                { config: 'antiaudio', type: 'audioMessage' },
                { config: 'antifig', type: 'stickerMessage' },
                { config: 'antidoc', type: 'documentMessage' },
                { config: 'antiloc', type: 'locationMessage' },
                { config: 'antifoto', type: 'imageMessage' },
                { config: 'antivideo', type: 'videoMessage' },
                { config: 'anticatalogo', type: 'productMessage' },
                { config: 'anticard', type: 'contactMessage' }
            ];
            for (const check of checks) {
                if (grupoConfig[check.config] && !isUserAd && msg.message[check.type] && isBotAd) {
                    await conn.sendMessage(from, { delete: msg.key });
                }
            }
            if (grupoConfig.autotranscrever && msg.message.audioMessage && !isCommand) {
                try {
                    const { downloadContentFromMessage } = require('baileys');
                    const { transcreverAudioBuffer } = require('../funções/transcricao');
                    const stream = await downloadContentFromMessage(msg.message.audioMessage, 'audio');
                    let buffer = Buffer.from([]);
                    for await (const chunk of stream) {
                        buffer = Buffer.concat([buffer, chunk]);
                    }
                    const mimeType = msg.message.audioMessage.mimetype || 'audio/ogg';
                    const texto = await transcreverAudioBuffer(buffer, mimeType);
                    if (texto) {
                        await conn.sendMessage(from, {
                            text: `📝 *Auto Transcrição:*\n\n${texto}`
                        }, { quoted: msg });
                    }
                } catch (eAuto) {
                    console.error('Erro na auto transcrição:', eAuto?.message || eAuto);
                }
            }
            if (grupoConfig.autofig && !isCommand && (msg.message.imageMessage || msg.message.videoMessage)) {
                try {
                    const { extractMediaSource, mediaToStickerBuffer } = require('../funções/autofigUtils');
                    const source = extractMediaSource(msg);
                    if (source && (!source.isVideo || Number(source.media.seconds || 0) <= 9.9)) {
                        const stickerBuffer = await mediaToStickerBuffer(source.media, source.mediaType, {
                            packName: '',
                            authorName: '「 Olymp.Protect - bot 」'
                        });
                        await conn.sendMessage(from, { sticker: stickerBuffer, isAnimated: !!stickerBuffer.isAnimated || source.isVideo }, { quoted: msg });
                    }
                } catch (eAutoFig) {
                    console.error('Erro na auto figurinha:', eAutoFig?.message || eAutoFig);
                }
            }
        }

        if (!isCommand) {
            const cleanBody = (fullText || '').trim().toLowerCase();

            if (isGroup && (!grupoConfig || grupoConfig.modobrincadeira)) {
                if (tictactoe.hasPendingInvitation(from)) {
                    const invite = tictactoe.getPendingInvitation(from);
                    if (invite && compareIds(invite.invitee, sender) && ['s', 'sim', 'n', 'nao', 'não'].includes(cleanBody)) {
                        const res = tictactoe.processInvitationResponse(from, sender, cleanBody);
                        if (res && res.message) {
                            await conn.sendMessage(from, {
                                text: res.message,
                                mentions: res.mentions || []
                            }, { quoted: msg });
                            return;
                        }
                    }
                }
                if (tictactoe.hasActiveGame(from) && /^[1-9]$/.test(cleanBody)) {
                    const activeGame = tictactoe.getActiveGame(from);
                    if (activeGame) {
                        const expectedPlayer = activeGame.players[activeGame.currentTurn];
                        if (compareIds(sender, expectedPlayer)) {
                            const res = tictactoe.makeMove(from, sender, cleanBody);
                            if (res && res.message) {
                                await conn.sendMessage(from, {
                                    text: res.message,
                                    mentions: res.mentions || []
                                }, { quoted: msg });
                                return;
                            }
                        }
                    }
                }
            }

            if (akinatorManager.hasSession(from) && (!isGroup || !grupoConfig || grupoConfig.modobrincadeira)) {
                const akiRes = await akinatorManager.handleInput(from, sender, cleanBody);
                if (akiRes && akiRes.message) {
                    if (akiRes.image) {
                        try {
                            await conn.sendMessage(from, {
                                image: { url: akiRes.image },
                                caption: akiRes.message,
                                mentions: akiRes.mentions || []
                            }, { quoted: msg });
                        } catch (imgErr) {
                            await conn.sendMessage(from, {
                                text: akiRes.message,
                                mentions: akiRes.mentions || []
                            }, { quoted: msg });
                        }
                    } else {
                        await conn.sendMessage(from, {
                            text: akiRes.message,
                            mentions: akiRes.mentions || []
                        }, { quoted: msg });
                    }
                    return;
                }
            }

            if (quizManager.hasActiveQuiz(from)) {
                const quizRes = quizManager.checkAnswer(from, fullText, sender);
                if (quizRes && quizRes.correct) {
                    const winnerNumber = sender.replace(/[^0-9]/g, '');
                    const { getOrCriaPlayer } = require('../funções/rpg/rpgHelper');
                    try {
                        const player = await getOrCriaPlayer(winnerNumber, senderName);
                        if (player) {
                            player.ouro = (player.ouro || 0) + quizRes.rewardCoins;
                            player.ganharXP(quizRes.rewardXp);
                            await player.save();
                        }
                    } catch (eEco) {
                        console.error('Erro ao premiar quiz rpg:', eEco);
                    }
                    const textVencedor = `🎉 *RESPOSTA CORRETA! VITÓRIA NO QUIZ!* 🎉\n\n` +
                        `👤 *Ganhador:* @${winnerNumber}\n` +
                        `💡 *Resposta:* *${quizRes.question.answers[0]}*\n` +
                        `📂 *Categoria:* *${quizRes.categoryName}*\n\n` +
                        `💰 *Recompensa:* +${quizRes.rewardCoins} Moedas de Ouro\n` +
                        `⭐ *XP Ganho:* +${quizRes.rewardXp} XP\n\n` +
                        `Parabéns aventureiro(a)! Use *${prefix}quiz* para a próxima rodada!`;
                    await conn.sendMessage(from, {
                        text: textVencedor,
                        mentions: [sender]
                    }, { quoted: msg });
                    return;
                }
            }
        }

        if (isGroup && grupoConfig?.soadm && !isUserAd && !isOwner) {
            return;
        }

        if (isCommand) {
            const cmd = comandos[command];
            if (cmd) {
                if (isGroup && grupoConfig?.bangp && !isOwner) {
                    return;
                }
                if (isGroup && Array.isArray(grupoConfig?.blockedCommands) && grupoConfig.blockedCommands.includes(command) && cmd.category !== 'dono' && !isOwner) {
                    return conn.sendMessage(from, {
                        text: `⚠️ O comando *${prefix}${command}* está bloqueado neste grupo.`
                    }, { quoted: msg });
                }
                const isBrincadeiraCmd = cmd.category === 'brincadeiras' || command === 'menubrincadeira';
                if (isGroup && isBrincadeiraCmd && !grupoConfig?.modobrincadeira && !isOwner) {
                    return conn.sendMessage(from, {
                        text: `⚠️ *Modo Brincadeira desativado neste grupo!*\n\nUm administrador precisa ativar as brincadeiras usando o comando *${prefix}modobrincadeira*.`
                    }, { quoted: msg });
                }
                if (isGroup && command === 'menurpg' && !grupoConfig?.modorpg && !isOwner) {
                    return conn.sendMessage(from, {
                        text: `⚠️ *Modo RPG desativado neste grupo!*\n\nUm administrador precisa ativar o RPG usando o comando *${prefix}modorpg*.`
                    }, { quoted: msg });
                }
                const now = Date.now();
                const cooldownTime = 2000;
                const cooldownKey = `${from}:${senderNumber || sender}`;
                const userCooldown = global.commandCooldowns.get(cooldownKey);
                if (userCooldown && now - userCooldown < cooldownTime) {
                    return;
                }
                global.commandCooldowns.set(cooldownKey, now);
                try {
                    if (cmd.category === 'adm' && isGroup && !isUserAd && !isOwner) {
                        try {
                            const freshMetadata = groupMetadataManager.get(from) || await conn.groupMetadata(from).catch(() => null);
                            if (freshMetadata) {
                                groupMetadataManager.set(from, freshMetadata);
                                isUserAd = isUserAdmin(freshMetadata, sender, conn);
                                if (isUserAd) {
                                    groupCache.set(from, {
                                        metadata: freshMetadata,
                                        config: grupoConfig
                                    });
                                }
                            }
                        } catch (err) {
                            console.error('Erro no fallback de admin:', err);
                        }
                        if (!isUserAd && !isOwner) {
                            return conn.sendMessage(from, { text: '❌ Apenas admins.' }, { quoted: msg });
                        }
                    }
                    console.log(`[EXEC] Executando comando ${prefix}${command} para ${senderName}`);
                    await cmd.run(conn, msg, config, args, sender, senderName);
                    if (usuarioDB) {
                        usuarioDB.comandosUsados = (usuarioDB.comandosUsados || 0) + 1;
                        usuarioDB.save().catch(() => {});
                    }
                } catch (e) {
                    console.error(`Erro ao executar comando ${command}:`, e);
                    try {
                        await conn.sendMessage(from, { text: '❌ Erro ao executar o comando.' }, { quoted: msg });
                    } catch (_) {
                        await conn.sendMessage(from, { text: '❌ Erro ao executar o comando.' }).catch(() => {});
                    }
                }
            } else {
                let bestMatch = null;
                let highestSimilarity = 0;
                for (const key of Object.keys(comandos)) {
                    const similarity = getSimilarity(command, key);
                    if (similarity > highestSimilarity) {
                        highestSimilarity = similarity;
                        bestMatch = key;
                    }
                }
                const suggestion = (highestSimilarity >= 0.5 && bestMatch) ? bestMatch : null;
                const card = buildSimilarityCard({ command, suggestion, prefix });
                await safeSendMenu(conn, from, card, msg, []);
            }
        } else if (!isCommand && /^(?:prefixo[?!.]*|qual\s+(?:é\s+|e\s+)?(?:o\s+)?prefixo[?!.]*)$/i.test(fullText.trim())) {
            const card = buildPrefixCard(prefix, config.botName || 'OlympProtect');
            await safeSendMenu(conn, from, card, msg, []);
        }
        if (isGroup && !isCommand && fullText && grupoConfig?.autobaixar) {
            await handleAutoDownload(conn, from, fullText, msg);
        }
    } catch (e) {
        console.error('[ERRO FATAL] Mensagens Handler:', e);
    }
}
module.exports = mensagensHandler;
