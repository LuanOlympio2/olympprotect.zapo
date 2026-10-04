// creditos Olympio
const aliases = ['unmute', 'desmutar', 'dessilenciar', 'desmute'];
const { normalizeId, findParticipant, isUserAdmin } = require('../../funções/normalizarid');
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
        const rawSender = msg.key?.participant || sender;
        if (!isUserAdmin(groupMetadata, sender, conn) && !isUserAdmin(groupMetadata, rawSender, conn)) {
            return await conn.sendMessage(from, { text: 'Apenas administradores podem usar este comando!' }, { quoted: msg });
        }
        const quoted = msg.message.extendedTextMessage?.contextInfo;
        let targetJid = null;
        if (quoted && quoted.participant) {
            targetJid = quoted.participant;
        } else if (quoted && quoted.mentionedJid && quoted.mentionedJid.length > 0) {
            targetJid = quoted.mentionedJid[0];
        } else if (msg.message.extendedTextMessage?.contextInfo?.mentionedJid?.length > 0) {
            targetJid = msg.message.extendedTextMessage.contextInfo.mentionedJid[0];
        } else if (args[0]) {
            const cleanArg = args[0].replace(/[^0-9]/g, '');
            if (cleanArg.length >= 7) {
                targetJid = `${cleanArg}@s.whatsapp.net`;
            }
        }
        if (!targetJid) {
            return await conn.sendMessage(from, {
                text: `Como usar:\n• Marque uma mensagem do usuário\n• Mencione: ${config.prefix}unmute @usuario\n• Ou envie o número: ${config.prefix}unmute 551199999999`
            }, { quoted: msg });
        }
        const { compareIds } = require('../../funções/normalizarid');
        const normalizedTarget = normalizeId(targetJid);
        if (!global.mutedUsers || !global.mutedUsers[from]) {
            return await conn.sendMessage(from, { text: 'Este usuário não está silenciado!' }, { quoted: msg });
        }
        const isMuted = global.mutedUsers[from].some(jid => normalizeId(jid) === normalizedTarget || compareIds(jid, targetJid));
        if (!isMuted) {
            return await conn.sendMessage(from, { text: 'Este usuário não está silenciado!' }, { quoted: msg });
        }
        const { buildActionCard } = require('../../funções/layout');
        global.mutedUsers[from] = global.mutedUsers[from].filter(jid => normalizeId(jid) !== normalizedTarget && !compareIds(jid, targetJid));

        const participants = groupMetadata.participants || [];
        const targetParticipant = findParticipant(participants, targetJid);
        const targetPhone = targetParticipant?.phoneNumber || (!String(targetJid).includes('@lid') ? targetJid : null);
        const targetNum = (targetPhone || targetJid).split('@')[0].split(':')[0];
        const adminNum = sender.split('@')[0].split(':')[0];
        const card = buildActionCard({
            header: 'MODERAÇÃO DO GRUPO',
            headerIcon: '🛡️',
            title: 'MEMBRO DESMUTADO',
            icon: '🔊',
            lines: [
                `👤 *Membro:* @${targetNum}`,
                `👮 *Por:* @${adminNum}`,
                `🏛️ *Grupo:* ${groupMetadata.subject || 'Grupo'}`,
                `✅ *Status:* Permissão para falar restaurada`
            ],
            tip: 'O usuário agora pode enviar mensagens normalmente no grupo.'
        });

        await conn.sendMessage(from, {
            text: card,
            mentions: [targetJid, sender]
        }, { quoted: msg });
    } catch (e) {
        console.error("Erro no comando unmute:", e);
        await conn.sendMessage(from, { text: '❌ Erro ao remover o silenciamento.' }, { quoted: msg });
    }
}
module.exports = {
    run,
    aliases
};
