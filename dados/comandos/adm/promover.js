const aliases = ['promover', 'promote', 'admin'];
const { compareIds, findParticipant, isUserAdmin, isBotAdmin, isParticipantAdmin, isBotNumber, resolveToPhoneJid, getMentionJids } = require('../../funções/normalizarid');
const { buildActionCard } = require('../../funções/layout');
const groupCache = require('../../funções/groupCache');
async function run(conn, msg, config, args, sender, senderName) {
    const from = msg.key.remoteJid;
    const isGroup = from.endsWith('@g.us');
    if (!isGroup) {
        return await conn.sendMessage(from, { text: 'Este comando só funciona em grupos!' }, { quoted: msg });
    }
    try {
        const groupMetadata = await conn.groupMetadata(from).catch(() => null);
        if (!groupMetadata) {
            return await conn.sendMessage(from, { text: '❌ Erro ao obter dados do grupo.' }, { quoted: msg });
        }
        const participants = groupMetadata.participants || [];
        const rawSender = msg.key?.participant || sender;
        if (!isUserAdmin(groupMetadata, sender, conn) && !isUserAdmin(groupMetadata, rawSender, conn)) {
            return await conn.sendMessage(from, { text: 'Apenas administradores podem usar este comando!' }, { quoted: msg });
        }
        if (!isBotAdmin(groupMetadata, conn)) {
            return await conn.sendMessage(from, { text: 'Preciso ser administrador para promover membros!' }, { quoted: msg });
        }
        const quoted = msg.message?.extendedTextMessage?.contextInfo;
        let targetJid = null;
        if (quoted && quoted.participant) {
            targetJid = quoted.participant;
        } else if (quoted && quoted.mentionedJid && quoted.mentionedJid.length > 0) {
            targetJid = quoted.mentionedJid[0];
        } else if (msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length > 0) {
            targetJid = msg.message.extendedTextMessage.contextInfo.mentionedJid[0];
        } else if (args && args[0]) {
            const rawNumber = args[0].replace(/[^0-9]/g, '');
            if (rawNumber.length >= 8) {
                const found = findParticipant(participants, rawNumber);
                if (found) {
                    targetJid = found.id || found.jid || `${rawNumber}@s.whatsapp.net`;
                } else {
                    targetJid = `${rawNumber}@s.whatsapp.net`;
                }
            }
        }
        if (!targetJid) {
            return await conn.sendMessage(from, { 
                text: `Como usar:\n• Marque uma mensagem do usuário\n• Mencione: ${config.prefix}promover @usuario\n• Ou use: ${config.prefix}promover [numero]` 
            }, { quoted: msg });
        }
        if (isBotNumber(targetJid, conn)) {
            return await conn.sendMessage(from, { text: 'Eu já sou administrador!' }, { quoted: msg });
        }
        if (isParticipantAdmin(groupMetadata, targetJid)) {
            return await conn.sendMessage(from, { text: 'Este usuário já é administrador!' }, { quoted: msg });
        }
        await conn.groupParticipantsUpdate(from, [targetJid], 'promote');
        groupCache.del(from);

        const phoneJid = resolveToPhoneJid(targetJid, participants);
        const targetNum = phoneJid.split('@')[0].split(':')[0];
        const adminPhone = resolveToPhoneJid(sender, participants);
        const adminNum = adminPhone.split('@')[0].split(':')[0];
        const card = buildActionCard({
            header: 'GESTÃO DE CARGOS',
            headerIcon: '🛡️',
            title: 'NOVO ADMINISTRADOR',
            icon: '👑',
            lines: [
                `👤 *Promovido:* @${targetNum}`,
                `👮 *Por:* @${adminNum}`,
                `🏛️ *Grupo:* ${groupMetadata.subject || 'Grupo'}`,
                `🎖️ *Cargo:* Administrador do Grupo`
            ],
            tip: 'O membro agora possui todas as permissões administrativas do grupo.'
        });

        const mentions = Array.from(new Set([
            ...getMentionJids(targetJid, participants),
            ...getMentionJids(sender, participants)
        ]));

        await conn.sendMessage(from, { 
            text: card,
            mentions: mentions
        }, { quoted: msg });
    } catch (e) {
        console.error("Erro no comando promover:", e);
        await conn.sendMessage(from, { text: '❌ Erro ao promover o usuário. Verifique se o bot possui permissão de administrador.' }, { quoted: msg });
    }
}
module.exports = {
    run,
    aliases
};
