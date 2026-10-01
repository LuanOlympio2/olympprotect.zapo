// creditos Olympio
const aliases = ['mute', 'mutar', 'silenciar'];
const { compareIds, findParticipant, normalizeId, isUserAdmin } = require('../../funções/normalizarid');
async function run(conn, msg, config, args, sender, senderName) {
    const from = msg.key.remoteJid;
    const isGroup = from.endsWith('@g.us');
    if (!isGroup) {
        return await conn.sendMessage(from, { text: 'Este comando só funciona em grupos!' }, { quoted: msg });
    }
    try {
        const groupMetadata = await conn.groupMetadata(from);
        if (!isUserAdmin(groupMetadata, sender, conn)) {
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
        }
        if (!targetJid) {
            return await conn.sendMessage(from, { 
                text: `Como usar:\n• Marque uma mensagem do usuário\n• Ou mencione: ${config.prefix}mute @usuario` 
            }, { quoted: msg });
        }
        if (compareIds(targetJid, sender)) {
            return await conn.sendMessage(from, { text: 'Você não pode silenciar a si mesmo!' }, { quoted: msg });
        }
        const targetParticipant = findParticipant(participants, targetJid);
        if (targetParticipant && ['admin', 'superadmin'].includes(targetParticipant.admin)) {
            return await conn.sendMessage(from, { text: 'Não posso silenciar outros administradores!' }, { quoted: msg });
        }
        if (!global.mutedUsers) global.mutedUsers = {};
        if (!global.mutedUsers[from]) global.mutedUsers[from] = [];
        const normalizedTarget = normalizeId(targetJid);
        const isAlreadyMuted = global.mutedUsers[from].some(jid => normalizeId(jid) === normalizedTarget);
        if (isAlreadyMuted) {
            return await conn.sendMessage(from, { text: 'Este usuário já está silenciado!' }, { quoted: msg });
        }
        const { buildActionCard } = require('../../funções/layout');
        global.mutedUsers[from].push(targetJid);

        const targetNum = targetJid.split('@')[0].split(':')[0];
        const adminNum = sender.split('@')[0].split(':')[0];
        const card = buildActionCard({
            header: 'MODERAÇÃO DO GRUPO',
            headerIcon: '🛡️',
            title: 'MEMBRO MUTADO',
            icon: '🔇',
            lines: [
                `👤 *Silenciado:* @${targetNum}`,
                `👮 *Por:* @${adminNum}`,
                `🏛️ *Grupo:* ${groupMetadata.subject || 'Grupo'}`,
                `🚫 *Efeito:* Mensagens apagadas automaticamente`
            ],
            tip: 'Use *!unmute @usuario* para permitir que o membro volte a falar.'
        });

        await conn.sendMessage(from, { 
            text: card,
            mentions: [targetJid, sender]
        }, { quoted: msg });
    } catch (e) {
        console.error("Erro no comando mute:", e);
        await conn.sendMessage(from, { text: '❌ Erro ao silenciar o usuário.' }, { quoted: msg });
    }
}
module.exports = {
    run,
    aliases
};
