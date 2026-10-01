// creditos Olympio
const fs = require('fs');
const path = require('path');
const pino = require('pino');

const MAX_LOG_SIZE = 10 * 1024 * 1024;
const BURST_WINDOW_MS = 4000;
const BURST_THRESHOLD = 3;

const packetWindows = new Map();
const groupNamesCache = new Map();
let currentSockInstance = null;

setInterval(() => {
    const now = Date.now();
    for (const [key, timestamps] of packetWindows.entries()) {
        const active = timestamps.filter(t => now - t < BURST_WINDOW_MS);
        if (active.length === 0) {
            packetWindows.delete(key);
        } else {
            packetWindows.set(key, active);
        }
    }
}, 15000);

function resolveGroupName(groupJid) {
    if (!groupJid || !groupJid.endsWith('@g.us')) return groupJid || 'PV';
    if (groupNamesCache.has(groupJid)) {
        return groupNamesCache.get(groupJid);
    }

    try {
        const groupMetadataManager = require('./groupMetadataManager');
        const meta = groupMetadataManager.get(groupJid);
        if (meta && meta.subject) {
            groupNamesCache.set(groupJid, meta.subject);
            return meta.subject;
        }
    } catch (_) {}

    try {
        const cacheFile = path.resolve(__dirname, '../../dados/cache_grupos.json');
        if (fs.existsSync(cacheFile)) {
            const data = JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
            if (data[groupJid] && data[groupJid].subject) {
                const name = data[groupJid].subject;
                groupNamesCache.set(groupJid, name);
                return name;
            }
        }
    } catch (_) {}

    if (currentSockInstance && typeof currentSockInstance.groupMetadata === 'function') {
        currentSockInstance.groupMetadata(groupJid).then((meta) => {
            if (meta?.subject) {
                groupNamesCache.set(groupJid, meta.subject);
            }
        }).catch(() => {});
    }

    return groupJid;
}

function rotateLogIfNeeded(filePath) {
    try {
        if (!fs.existsSync(filePath)) return;
        const stats = fs.statSync(filePath);
        if (stats.size >= MAX_LOG_SIZE) {
            const backupPath = `${filePath}.1`;
            if (fs.existsSync(backupPath)) {
                fs.unlinkSync(backupPath);
            }
            fs.renameSync(filePath, backupPath);
        }
    } catch (_) {}
}

function writeLog(filePath, category, data) {
    try {
        const dir = path.dirname(filePath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        rotateLogIfNeeded(filePath);
        const timestamp = new Date().toISOString();
        const line = `[${timestamp}] [${category}] ${typeof data === 'string' ? data : JSON.stringify(data)}\n`;
        fs.appendFileSync(filePath, line, 'utf8');
    } catch (_) {}
}

function extractNodeDetails(node) {
    if (!node || typeof node !== 'object') return null;
    const tag = node.tag || 'unknown';
    const attrs = node.attrs || {};
    const id = attrs.id || 'sem_id';
    const from = attrs.from || 'desconhecido';
    const participant = attrs.participant || attrs.recipient || from;
    const type = attrs.type || null;

    let encDetails = null;
    let unavailableDetails = null;

    if (Array.isArray(node.content)) {
        for (const child of node.content) {
            if (child && typeof child === 'object') {
                if (child.tag === 'enc') {
                    const encAttrs = child.attrs || {};
                    const bufLen = child.content instanceof Uint8Array || Buffer.isBuffer(child.content) ? child.content.length : null;
                    encDetails = {
                        type: encAttrs.type || 'unknown',
                        v: encAttrs.v || null,
                        media_type: encAttrs.mediatype || null,
                        bytes: bufLen
                    };
                } else if (child.tag === 'unavailable') {
                    unavailableDetails = child.attrs || {};
                }
            }
        }
    }

    return {
        tag,
        id,
        from,
        participant,
        type,
        enc: encDetails,
        unavailable: unavailableDetails,
        attrs
    };
}

function describePacketType(details) {
    if (!details) return { categoria: 'Desconhecido', tipo: 'Desconhecido', natureza: 'Pacote bruto' };
    const tag = details.tag;
    const attrs = details.attrs || {};

    if (tag === 'receipt') {
        const receiptType = attrs.type === 'read' ? 'Leitura de Mensagem (Read Receipt / Blue Tick)'
            : attrs.type === 'played' ? 'Reprodução de Áudio'
            : attrs.type === 'sender' ? 'Confirmação do Remetente'
            : 'Confirmação de Entrega (Delivery)';
        return {
            isTechnical: true,
            categoria: 'Pacote Técnico de Confirmação (<receipt>)',
            tipo: receiptType,
            natureza: 'Pacote técnico gerado automaticamente pelo WhatsApp quando um usuário abre/lê o chat. NÃO é mensagem de texto nem comando.'
        };
    }

    if (tag === 'message') {
        if (details.enc) {
            const encType = details.enc.type === 'skmsg' ? 'SenderKey (Mensagem Criptografada de Grupo)'
                : details.enc.type === 'pkmsg' ? 'PreKey (Início de Sessão Criptografada)'
                : details.enc.type === 'msmsg' ? 'Media Secret (Mensagem de Mídia Criptografada)'
                : details.enc.type === 'msg' ? 'Whisper (Mensagem Criptografada Direta)'
                : `Criptografia ${details.enc.type}`;
            const sizeStr = details.enc.bytes ? `${details.enc.bytes} bytes` : 'tamanho não informado';
            return {
                isTechnical: false,
                categoria: 'Mensagem de Conversa (<message>)',
                tipo: `Pacote Criptografado Signal (${encType} | ${sizeStr})`,
                natureza: 'Mensagem real enviada para o grupo (em formato criptografado).'
            };
        }
        if (details.unavailable) {
            return {
                isTechnical: true,
                categoria: 'Mensagem Indisponível (<unavailable>)',
                tipo: `Placeholder de Reenvio (${details.unavailable.type || 'fanout'})`,
                natureza: 'Aparelho solicitou reenvio de chaves ao remetente.'
            };
        }
        return {
            isTechnical: false,
            categoria: 'Mensagem de Conversa (<message>)',
            tipo: `Mensagem (${details.type || 'conteúdo padrão'})`,
            natureza: 'Mensagem enviada no grupo.'
        };
    }

    if (tag === 'notification') {
        return {
            isTechnical: true,
            categoria: 'Notificação do Sistema (<notification>)',
            tipo: `Evento do WhatsApp (${attrs.type || 'geral'})`,
            natureza: 'Aviso emitido pelo servidor do WhatsApp (mudança de config, membros, etc).'
        };
    }

    if (tag === 'call') {
        return {
            isTechnical: true,
            categoria: 'Pacote de Chamada (<call>)',
            tipo: `Sinalização de Ligação (${attrs.type || 'áudio/vídeo'})`,
            natureza: 'Pacote técnico de chamada.'
        };
    }

    return {
        isTechnical: true,
        categoria: `Estrofe <${tag}>`,
        tipo: attrs.type || 'sem subtipo',
        natureza: 'Pacote de rede WhatsApp.'
    };
}

function trackBurst(groupJid, sender, details, logFilePath) {
    if (!groupJid || !groupJid.endsWith('@g.us') || !sender) return;
    if (details.tag === 'iq' || details.tag === 'ib' || details.tag === 'ack') return;
    const cleanSender = String(sender).split(':')[0].split('@')[0];
    const groupNum = groupJid.split('@')[0];
    if (cleanSender === groupNum) return;
    const key = `${groupJid}_${cleanSender}_${details.tag}`;
    const now = Date.now();

    let list = packetWindows.get(key) || [];
    list = list.filter(t => now - t < BURST_WINDOW_MS);
    list.push(now);
    packetWindows.set(key, list);

    if (list.length >= BURST_THRESHOLD) {
        const durationSec = ((now - list[0]) / 1000).toFixed(2);
        const groupName = resolveGroupName(groupJid);
        const description = describePacketType(details);

        const alertData = {
            groupJid,
            groupName,
            sender: cleanSender,
            packetCount: list.length,
            withinSeconds: durationSec,
            categoria: description.categoria,
            tipo: description.tipo,
            natureza: description.natureza,
            latestPacket: details
        };

        if (description.isTechnical && details.tag === 'receipt') {
            writeLog(logFilePath, 'RECEIPT_BURST', alertData);
            console.log(`\x1b[36m[INSPECTOR - TRÁFEGO RECIBOS]\x1b[0m ℹ️ @${cleanSender} gerou ${list.length} confirmações em ${durationSec}s no grupo "${groupName}" (${groupJid})
↳ Categoria: ${description.categoria}
↳ Tipo Específico: ${description.tipo}
↳ Natureza: ${description.natureza}`);
        } else {
            writeLog(logFilePath, 'BURST_ALERT', alertData);
            console.log(`\x1b[33m[INSPECTOR - ALERTA RAJADA]\x1b[0m 🚨 @${cleanSender} enviou ${list.length} pacotes em ${durationSec}s no grupo "${groupName}" (${groupJid})!
↳ Categoria: ${description.categoria}
↳ Tipo Específico: ${description.tipo}
↳ ID: ${details.id}
↳ Natureza: ${description.natureza}`);
        }
    }
}

function createInspectorLogger(logFilePath) {
    const customStream = {
        write(chunk) {
            try {
                const str = chunk.toString();
                let parsed = null;
                try {
                    parsed = JSON.parse(str);
                } catch (_) {
                    parsed = { msg: str };
                }

                const msgText = String(parsed.msg || parsed.message || '');
                const errText = parsed.err ? JSON.stringify(parsed.err) : '';
                const combined = (msgText + ' ' + errText).toLowerCase();

                const isSuspicious =
                    combined.includes('failed to decrypt') ||
                    combined.includes('decrypt') ||
                    combined.includes('ciphertext') ||
                    combined.includes('bad mac') ||
                    combined.includes('session') ||
                    combined.includes('unhandled') ||
                    combined.includes('retry') ||
                    combined.includes('missing') ||
                    combined.includes('unavailable') ||
                    parsed.level >= 40;

                if (isSuspicious) {
                    writeLog(logFilePath, 'BAILEYS_INTERNAL', parsed);
                    if (combined.includes('failed to decrypt') || combined.includes('ciphertext') || combined.includes('bad mac')) {
                        const targetGroup = parsed.remoteJid || parsed.key?.remoteJid || parsed.attrs?.from || '';
                        const groupDisplay = targetGroup ? `no grupo "${resolveGroupName(targetGroup)}" (${targetGroup})` : 'em conversa';
                        console.log(`\x1b[31m[INSPECTOR - FALHA CRIPTOGRAFIA]\x1b[0m ⚠️ Falha de descriptografia ${groupDisplay}
↳ Motivo: ${msgText}
↳ Contexto: ${JSON.stringify(parsed.errorContext || parsed.key || parsed.attrs || {})}`);
                    }
                }
            } catch (_) {}
        }
    };

    return pino({ level: 'debug' }, customStream);
}

function attachTrafficInspector(sock, logFilePath) {
    if (!sock) return;
    currentSockInstance = sock;

    if (sock.ev && typeof sock.ev.on === 'function') {
        sock.ev.on('groups.update', (updates) => {
            try {
                if (Array.isArray(updates)) {
                    for (const u of updates) {
                        if (u.id && u.subject) {
                            groupNamesCache.set(u.id, u.subject);
                        }
                    }
                }
            } catch (_) {}
        });
    }

    if (!sock.ws) return;

    sock.ws.on('frame', (frame) => {
        try {
            if (!(frame instanceof Uint8Array)) {
                const details = extractNodeDetails(frame);
                if (details) {
                    if (details.from?.endsWith('@g.us') && (details.tag === 'message' || details.tag === 'receipt')) {
                        trackBurst(details.from, details.participant, details, logFilePath);
                    }
                    if (details.enc || details.unavailable || details.tag === 'message') {
                        writeLog(logFilePath, 'RAW_FRAME', {
                            ...details,
                            groupName: resolveGroupName(details.from)
                        });
                    }
                }
            }
        } catch (_) {}
    });

    sock.ws.on('CB:message', (node) => {
        try {
            const details = extractNodeDetails(node);
            if (details) {
                writeLog(logFilePath, 'CB_MESSAGE', {
                    ...details,
                    groupName: resolveGroupName(details.from)
                });
            }
        } catch (_) {}
    });

    sock.ws.on('CB:notification', (node) => {
        try {
            const details = extractNodeDetails(node);
            if (details) {
                writeLog(logFilePath, 'CB_NOTIFICATION', {
                    ...details,
                    groupName: resolveGroupName(details.from)
                });
            }
        } catch (_) {}
    });

    sock.ws.on('CB:ack,class:message', (node) => {
        try {
            const details = extractNodeDetails(node);
            if (details) {
                const groupName = resolveGroupName(details.from);
                writeLog(logFilePath, 'CB_BAD_ACK', {
                    ...details,
                    groupName
                });
                console.log(`\x1b[35m[INSPECTOR - NACK RECEBIDO]\x1b[0m ⚠️ Ack negativo / erro no pacote ID: ${details.id} de ${details.from} no grupo "${groupName}"`);
            }
        } catch (_) {}
    });
}

function resolveMessagePayloadType(message) {
    if (!message || typeof message !== 'object') return 'Sem corpo';
    const keys = Object.keys(message);
    if (keys.includes('conversation')) return 'Texto simples (conversation)';
    if (keys.includes('extendedTextMessage')) return 'Texto formatado (extendedTextMessage)';
    if (keys.includes('imageMessage')) return 'Imagem (imageMessage)';
    if (keys.includes('videoMessage')) return 'Vídeo (videoMessage)';
    if (keys.includes('audioMessage')) return 'Áudio / Mensagem de voz (audioMessage)';
    if (keys.includes('stickerMessage')) return 'Figurinha (stickerMessage)';
    if (keys.includes('documentMessage')) return 'Documento (documentMessage)';
    if (keys.includes('requestPaymentMessage')) return '⚠️ Solicitação de Pagamento (requestPaymentMessage)';
    if (keys.includes('sendPaymentMessage')) return '⚠️ Envio de Pagamento (sendPaymentMessage)';
    if (keys.includes('interactiveMessage')) return 'Mensagem Interativa com Botões (interactiveMessage)';
    if (keys.includes('ephemeralMessage')) return `Mensagem Temporária -> [${resolveMessagePayloadType(message.ephemeralMessage?.message)}]`;
    if (keys.includes('viewOnceMessage')) return `Visualização Única -> [${resolveMessagePayloadType(message.viewOnceMessage?.message)}]`;
    if (keys.includes('viewOnceMessageV2')) return `Visualização Única V2 -> [${resolveMessagePayloadType(message.viewOnceMessageV2?.message)}]`;
    return keys.join(', ');
}

function inspectUpsert(m, logFilePath) {
    if (!m || !Array.isArray(m.messages)) return;

    for (const msg of m.messages) {
        try {
            const key = msg.key || {};
            const from = key.remoteJid || 'desconhecido';
            const participant = key.participant || msg.participant || from;
            const cleanSender = String(participant).split(':')[0].split('@')[0];
            const msgId = key.id || 'sem_id';
            const groupName = resolveGroupName(from);

            if (!msg.message) {
                const stubType = msg.messageStubType;
                const stubParams = msg.messageStubParameters || [];
                const stubName = stubType === 2 ? 'CIPHERTEXT (Falha ao descriptografar pacote Signal)'
                    : stubType === 1 ? 'REVOKE (Mensagem apagada para todos)'
                    : `Stub ${stubType}`;

                const data = {
                    id: msgId,
                    from,
                    groupName,
                    participant: cleanSender,
                    messageStubType: stubType,
                    stubName,
                    messageStubParameters: stubParams,
                    category: msg.category || null,
                    type: m.type
                };
                writeLog(logFilePath, 'EMPTY_OR_STUB_MESSAGE', data);
                console.log(`\x1b[36m[INSPECTOR - STUB / MENSAGEM SEM CORPO]\x1b[0m ID: ${msgId} no grupo "${groupName}" (${from})
↳ Remetente: @${cleanSender}
↳ Tipo: ${stubName}
↳ Parâmetros: ${JSON.stringify(stubParams)}
↳ Natureza: Pacote que chegou pelo WhatsApp sem corpo decodificado (potencial falha/trava).`);
                continue;
            }

            const rawText =
                msg.message.conversation ||
                msg.message.extendedTextMessage?.text ||
                msg.message.imageMessage?.caption ||
                msg.message.videoMessage?.caption ||
                '';

            const invisibleRegex = /[\u200B\u200C\u200D\uFEFF\u202E\u2066\u2067\u2068\u2069]/g;
            const invisibleMatches = rawText.match(invisibleRegex);
            const mentions = msg.message.extendedTextMessage?.contextInfo?.mentionedJid || [];
            const payloadType = resolveMessagePayloadType(msg.message);

            if (invisibleMatches && invisibleMatches.length > 5) {
                const alertData = {
                    id: msgId,
                    from,
                    groupName,
                    participant: cleanSender,
                    invisibleCharsCount: invisibleMatches.length,
                    payloadType,
                    textLength: rawText.length,
                    textPreview: rawText.slice(0, 100)
                };
                writeLog(logFilePath, 'INVISIBLE_CHAR_DETECTED', alertData);
                console.log(`\x1b[33m[INSPECTOR - CARACTERES INVISÍVEIS]\x1b[0m 👁️ @${cleanSender} enviou ${invisibleMatches.length} caracteres invisíveis no grupo "${groupName}"
↳ Tipo de Mensagem: ${payloadType}
↳ ID: ${msgId}`);
            }

            if (mentions.length >= 10 && rawText.trim().length === 0) {
                const mentionData = {
                    id: msgId,
                    from,
                    groupName,
                    participant: cleanSender,
                    mentionedCount: mentions.length,
                    payloadType
                };
                writeLog(logFilePath, 'GHOST_MENTION_BOMB', mentionData);
                console.log(`\x1b[33m[INSPECTOR - BOMBA DE MENÇÃO FANTASMA]\x1b[0m 💣 @${cleanSender} mencionou ${mentions.length} membros sem texto visível no grupo "${groupName}"
↳ ID: ${msgId}`);
            }

            writeLog(logFilePath, 'UPSERT_MESSAGE', {
                id: msgId,
                from,
                groupName,
                participant: cleanSender,
                type: m.type,
                payloadType,
                messageTypes: Object.keys(msg.message)
            });
        } catch (_) {}
    }
}

module.exports = {
    createInspectorLogger,
    attachTrafficInspector,
    inspectUpsert,
    resolveGroupName,
    writeLog
};
