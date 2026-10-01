// creditos Olympio
const aliases = ['rebaixar', 'demote', 'deadmin'];
const { compareIds, findParticipant, isUserAdmin, isBotAdmin } = require('../../funções/normalizarid');
async function run(conn, msg, config, args, sender, senderName) {
    const from = msg.key.remoteJid;
    const isGroup = from.endsWith('@g.us');
    if (!isGroup) {
        return await conn.sendMessage(from, { text: 'Este comando só funciona em grupos!' }, { quoted: msg });
    }
    try {
        const groupMetadata = await conn.groupMetadata(from);
        const participants = groupMetadata.participants;
        const botId = conn.user.id;
        if (!isUserAdmin(groupMetadata, sender, conn)) {
            return await conn.sendMessage(from, { text: 'Apenas administradores podem usar este comando!' }, { quoted: msg });
        }
        if (!isBotAdmin(groupMetadata, botId)) {
            return await conn.sendMessage(from, { text: 'Preciso ser administrador para rebaixar membros!' }, { quoted: msg });
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
                text: `Como usar:\n• Marque uma mensagem do usuário\n• Ou mencione: ${config.prefix}rebaixar @usuario` 
            }, { quoted: msg });
        }
        if (compareIds(targetJid, sender)) {
            return await conn.sendMessage(from, { text: 'Você não pode rebaixar a si mesmo!' }, { quoted: msg });
        }
        if (compareIds(targetJid, botId)) {
            return await conn.sendMessage(from, { text: 'Não posso me rebaixar!' }, { quoted: msg });
        }
        const targetParticipant = findParticipant(participants, targetJid);
        if (!targetParticipant || !['admin', 'superadmin'].includes(targetParticipant.admin)) {
            return await conn.sendMessage(from, { text: 'Este usuário não é administrador!' }, { quoted: msg });
        }
        const { buildActionCard } = require('../../funções/layout');
        await conn.groupParticipantsUpdate(from, [targetJid], 'demote');

        const targetNum = targetJid.split('@')[0].split(':')[0];
        const adminNum = sender.split('@')[0].split(':')[0];
        const card = buildActionCard({
            header: 'GESTÃO DE CARGOS',
            headerIcon: '🛡️',
            title: 'ADMIN REBAIXADO',
            icon: '⬇️',
            lines: [
                `👤 *Rebaixado:* @${targetNum}`,
                `👮 *Por:* @${adminNum}`,
                `🏛️ *Grupo:* ${groupMetadata.subject || 'Grupo'}`,
                `📌 *Novo Status:* Membro Comum`
            ],
            tip: 'O membro não possui mais permissões administrativas neste grupo.'
        });

        await conn.sendMessage(from, { 
            text: card,
            mentions: [targetJid, sender]
        }, { quoted: msg });
    } catch (e) {
        console.error("Erro no comando rebaixar:", e);
        await conn.sendMessage(from, { text: '❌ Erro ao rebaixar o usuário. Verifique se o bot possui permissão de administrador.' }, { quoted: msg });
    }
}
module.exports = {
    run,
    aliases
};
