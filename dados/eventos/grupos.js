// creditos Olympio
const Grupo = require('../modelos/grupos');
const { normalizeId, isBotAdmin, resolveToPhoneJid, getMentionJids, cleanDeviceJid } = require('../funções/normalizarid');
const lidCache = require('../funções/lidCache');
const groupCache = require('../funções/groupCache');
const fs = require('fs-extra');

function hydrateLidCache(participants = []) {
    participants.forEach((participant) => {
        if (!participant) return;
        const phone = participant.phoneNumber || (!participant.id?.includes('@lid') ? participant.id : null);
        const lid = participant.lid || (participant.id?.includes('@lid') ? participant.id : null);
        if (phone && lid) {
            const cleanPhone = phone.includes('@') ? phone : `${phone}@s.whatsapp.net`;
            lidCache.set(cleanPhone, lid);
        }
    });
}

function resolveParticipantJid(participantId, groupParticipants = []) {
    if (!participantId) return null;
    return resolveToPhoneJid(participantId, groupParticipants) || participantId;
}

function getAdminMentions(groupParticipants = []) {
    return groupParticipants
        .filter((participant) => participant.admin === 'admin' || participant.admin === 'superadmin')
        .map((participant) => participant.id);
}

async function gruposHandler(conn, event, config) {
    try {
        const { id, participants, action, author } = event;
        groupCache.del(id);

        if (action === 'promote' || action === 'demote') {
            const grupoConfig = await Grupo.findOne({ groupId: id });
            if (!grupoConfig || (!grupoConfig.antinuke && !grupoConfig.x9)) return;

            const groupMetadata = await conn.groupMetadata(id);
            const groupParticipants = groupMetadata.participants || [];
            hydrateLidCache(groupParticipants);

            const actorJid = resolveParticipantJid(author, groupParticipants);
            if (!actorJid) return;
            const actorNumber = normalizeId(actorJid);
            const botNumber = normalizeId(conn.user.id);

            if (actorNumber === botNumber || actorJid.includes(conn.user.id.split(':')[0])) {
                return;
            }

            const targets = participants
                .map((participant) => resolveParticipantJid(participant, groupParticipants))
                .filter(Boolean);

            if (grupoConfig.antinuke && isBotAdmin(groupMetadata, conn.user.id)) {
                const botOwnerNumber = normalizeId(config.ownerNumber);
                const realGroupOwner = normalizeId(groupMetadata.owner || '');
                const allowedOwners = (grupoConfig.donos || []).map((owner) => normalizeId(owner));

                const isImmune =
                    actorNumber === botOwnerNumber ||
                    actorNumber === realGroupOwner ||
                    allowedOwners.includes(actorNumber);

                if (!isImmune) {
                    if (action === 'demote') {
                        if (targets.length > 0) {
                            await conn.groupParticipantsUpdate(id, targets, 'promote').catch(() => {});
                        }
                        await conn.groupParticipantsUpdate(id, [actorJid], 'demote').catch(() => {});
                        await conn.sendMessage(id, {
                            text: `🚨 *Anti Nuke:* @${actorNumber} tentou rebaixar administradores sem autorização, os cargos foram restaurados e o usuário foi rebaixado.`,
                            mentions: [actorJid, ...targets]
                        });
                        return;
                    }

                    if (action === 'promote') {
                        if (targets.length > 0) {
                            await conn.groupParticipantsUpdate(id, targets, 'demote').catch(() => {});
                        }
                        await conn.groupParticipantsUpdate(id, [actorJid], 'demote').catch(() => {});
                        await conn.sendMessage(id, {
                            text: `🚨 *Anti Nuke:* @${actorNumber} tentou promover membros sem autorização, a promoção foi revogada e o usuário foi rebaixado.`,
                            mentions: [actorJid, ...targets]
                        });
                        return;
                    }
                }
            }

            if (grupoConfig.x9) {
                const actionText = action === 'promote' ? 'promoveu' : 'rebaixou';
                const emoji = action === 'promote' ? '⬆️' : '⬇️';
                const adminMentions = getAdminMentions(groupParticipants);
                const adminTags = adminMentions.map((jid) => `@${normalizeId(jid)}`).join(' ');
                const lines = targets.map((targetJid) => `${emoji} @${actorNumber} ${actionText} @${normalizeId(targetJid)}`);
                const notificationText = [
                    '🕵️ *X9 DO OLYMP EM CAMPO*',
                    '',
                    ...lines,
                    '',
                    `Admins alertados: ${adminTags}`,
                    '',
                    'Atenção administração: alteração detectada no quadro de comandos.'
                ].join('\n');

                await conn.sendMessage(id, {
                    text: notificationText,
                    mentions: [...adminMentions, ...targets, actorJid]
                });
            }
        }

        if (action === 'add') {
            const grupoConfig = await Grupo.findOne({ groupId: id });
            if (!grupoConfig) return;
            const groupMetadata = await conn.groupMetadata(id);
            const groupParticipants = groupMetadata.participants || [];
            hydrateLidCache(groupParticipants);

            if (grupoConfig.listaNegra?.length && isBotAdmin(groupMetadata, conn.user.id)) {
                for (const participant of participants) {
                    const userJid = resolveParticipantJid(participant, groupParticipants);
                    const userNumber = normalizeId(userJid || participant);
                    if (grupoConfig.listaNegra.includes(userNumber)) {
                        const mentions = Array.from(new Set([
                            ...getMentionJids(participant, groupParticipants),
                            ...getMentionJids(userJid, groupParticipants)
                        ])).filter(Boolean);
                        await conn.sendMessage(id, {
                            text: `🚫 *LISTA NEGRA ACIONADA*\n\nO número +${userNumber} está banido deste grupo e foi removido automaticamente.`,
                            mentions
                        });
                        await conn.groupParticipantsUpdate(id, mentions, 'remove');
                        continue;
                    }
                }
            }

            if (grupoConfig.antifake && isBotAdmin(groupMetadata, conn.user.id)) {
                for (const participant of participants) {
                    const userJid = resolveParticipantJid(participant, groupParticipants);
                    const userNumber = normalizeId(userJid || participant);
                    if (normalizeId(conn.user.id) === userNumber) continue;
                    if (!userNumber.startsWith('55')) {
                        const mentions = Array.from(new Set([
                            ...getMentionJids(participant, groupParticipants),
                            ...getMentionJids(userJid, groupParticipants)
                        ])).filter(Boolean);
                        await conn.sendMessage(id, {
                            text: `🛡️ *Anti Fake Detectado:* O número +${userNumber} foi removido automaticamente por ser estrangeiro.`,
                            mentions
                        });
                        await conn.groupParticipantsUpdate(id, mentions, 'remove');
                        continue;
                    }
                }
            }

            if (grupoConfig.bemVindoAtivo) {
                const groupName = groupMetadata.subject;
                for (const participant of participants) {
                    let userJid = resolveParticipantJid(participant, groupParticipants);
                    if (userJid && userJid.includes('@lid') && conn?.signalRepository?.lidMapping?.getPNForLID) {
                        try {
                            const cleanL = cleanDeviceJid(userJid);
                            const pn = await conn.signalRepository.lidMapping.getPNForLID(cleanL);
                            if (pn) {
                                const cleanPn = (typeof pn === 'string' ? pn : pn.pn || pn.id || '').split(':')[0].split('@')[0];
                                if (cleanPn) {
                                    userJid = cleanPn + '@s.whatsapp.net';
                                    lidCache.set(userJid, cleanL);
                                }
                            }
                        } catch (e) {}
                    }
                    const userNumber = normalizeId(userJid || participant);
                    if (!userNumber.startsWith('55') && grupoConfig.antifake) continue;
                    if (grupoConfig.listaNegra?.includes(userNumber)) continue;
                    const userTag = `@${userNumber}`;
                    let mensagemFinal = grupoConfig.legendaBemVindo || 'Bem vindo ao grupo #grupo#!';
                    mensagemFinal = mensagemFinal
                        .replaceAll('#numerodele#', userTag)
                        .replaceAll('#numero#', userTag)
                        .replaceAll('#user#', userTag)
                        .replaceAll('#nomedogp#', groupName)
                        .replaceAll('#grupo#', groupName)
                        .replaceAll('#desc#', groupMetadata.desc || '')
                        .replaceAll('#membros#', String(groupParticipants.length || ''));

                    const mentions = Array.from(new Set([
                        ...getMentionJids(participant, groupParticipants),
                        ...getMentionJids(userJid, groupParticipants)
                    ])).filter(Boolean);

                    const fundoPath = grupoConfig.fundoBv;
                    if (fundoPath && fs.existsSync(fundoPath)) {
                        await conn.sendMessage(id, {
                            image: await fs.readFile(fundoPath),
                            caption: mensagemFinal,
                            mentions
                        });
                    } else {
                        await conn.sendMessage(id, {
                            text: mensagemFinal,
                            mentions
                        });
                    }
                }
            }
        }

        if (action === 'remove') {
            const grupoConfig = await Grupo.findOne({ groupId: id });
            if (!grupoConfig || !grupoConfig.saidaAtivo) return;
            const groupMetadata = await conn.groupMetadata(id);
            const groupParticipants = groupMetadata.participants || [];
            hydrateLidCache(groupParticipants);
            const groupName = groupMetadata.subject;

            for (const participant of participants) {
                let userJid = resolveParticipantJid(participant, groupParticipants);
                if (userJid && userJid.includes('@lid') && conn?.signalRepository?.lidMapping?.getPNForLID) {
                    try {
                        const cleanL = cleanDeviceJid(userJid);
                        const pn = await conn.signalRepository.lidMapping.getPNForLID(cleanL);
                        if (pn) {
                            const cleanPn = (typeof pn === 'string' ? pn : pn.pn || pn.id || '').split(':')[0].split('@')[0];
                            if (cleanPn) {
                                userJid = cleanPn + '@s.whatsapp.net';
                                lidCache.set(userJid, cleanL);
                            }
                        }
                    } catch (e) {}
                }
                const userNumber = normalizeId(userJid || participant);
                if (normalizeId(conn.user.id) === userNumber) continue;
                const userTag = `@${userNumber}`;
                let mensagemFinal = grupoConfig.legendaSaida || 'Adeus #numero#, você saiu do grupo #grupo#!';
                mensagemFinal = mensagemFinal
                    .replaceAll('#numerodele#', userTag)
                    .replaceAll('#numero#', userTag)
                    .replaceAll('#user#', userTag)
                    .replaceAll('#nomedogp#', groupName)
                    .replaceAll('#grupo#', groupName)
                    .replaceAll('#desc#', groupMetadata.desc || '')
                    .replaceAll('#membros#', String(groupParticipants.length || ''));

                const mentions = Array.from(new Set([
                    ...getMentionJids(participant, groupParticipants),
                    ...getMentionJids(userJid, groupParticipants)
                ])).filter(Boolean);

                const fundoPath = grupoConfig.fundoSaida;
                if (fundoPath && fs.existsSync(fundoPath)) {
                    await conn.sendMessage(id, {
                        image: await fs.readFile(fundoPath),
                        caption: mensagemFinal,
                        mentions
                    });
                } else {
                    await conn.sendMessage(id, {
                        text: mensagemFinal,
                        mentions
                    });
                }
            }
        }
    } catch (e) {
        console.error('[ERRO] Falha no evento de grupos:', e);
    }
}

module.exports = gruposHandler;
