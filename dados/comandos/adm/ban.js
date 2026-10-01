// creditos Olympio
const { compareIds, findParticipant, isUserAdmin, isBotAdmin } = require('../../funções/normalizarid');
const { buildActionCard } = require('../../funções/layout');
const aliases = ['ban', 'banir', 'kick'];
async function run(conn, msg, config, args, sender, senderName) {
    const from = msg.key.remoteJid;
    const isGroup = from.endsWith('@g.us');
    if (!isGroup) {
        return await conn.sendMessage(from, { text: '⚠️ Este comando só funciona em grupos!' }, { quoted: msg });
    }
    try {
        const groupMetadata = await conn.groupMetadata(from);
        const participants = groupMetadata.participants;
        const botId = conn.user.id;
        if (!isUserAdmin(groupMetadata, sender, conn)) {
            return await conn.sendMessage(from, { text: '❌ Apenas administradores podem usar este comando!' }, { quoted: msg });
        }
        if (!isBotAdmin(groupMetadata, botId)) {
            return await conn.sendMessage(from, { text: '❌ Preciso ser administrador para remover membros do grupo!' }, { quoted: msg });
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
                text: `⚠️ *Como usar:*\n• Responda à mensagem de quem deseja banir\n• Ou use: *${config.prefix}ban @usuario*` 
            }, { quoted: msg });
        }
        if (compareIds(targetJid, sender)) {
            return await conn.sendMessage(from, { text: '❌ Você não pode remover a si mesmo!' }, { quoted: msg });
        }
        if (compareIds(targetJid, botId)) {
            return await conn.sendMessage(from, { text: '❌ Não posso me remover do grupo!' }, { quoted: msg });
        }
        const targetParticipant = findParticipant(participants, targetJid);
        if (targetParticipant && ['admin', 'superadmin'].includes(targetParticipant.admin)) {
            return await conn.sendMessage(from, { text: '❌ Não posso remover outros administradores do grupo!' }, { quoted: msg });
        }
        await conn.groupParticipantsUpdate(from, [targetJid], 'remove');

        const targetNum = targetJid.split('@')[0].split(':')[0];
        const adminNum = sender.split('@')[0].split(':')[0];
        const card = buildActionCard({
            header: 'MODERAÇÃO DO GRUPO',
            headerIcon: '🛡️',
            title: 'MEMBRO BANIDO',
            icon: '🔨',
            lines: [
                `👤 *Infrator:* @${targetNum}`,
                `👮 *Administrador:* @${adminNum}`,
                `🏛️ *Grupo:* ${groupMetadata.subject || 'Grupo'}`,
                `⚖️ *Ação:* Remoção imediata efetuada`
            ],
            tip: 'Membro removido do grupo conforme diretrizes de moderação.'
        });

        await conn.sendMessage(from, { 
            text: card,
            mentions: [targetJid, sender]
        }, { quoted: msg });
    } catch (e) {
        console.error("Erro no comando ban:", e);
        await conn.sendMessage(from, { text: '❌ Erro ao remover o usuário. Verifique se o bot possui permissão de administrador.' }, { quoted: msg });
    }
}
module.exports = {
    run,
    aliases
};
