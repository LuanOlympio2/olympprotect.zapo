// creditos Olympio
const aliases = ['promover', 'promote', 'admin'];
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
            return await conn.sendMessage(from, { text: 'Preciso ser administrador para promover membros!' }, { quoted: msg });
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
                text: `Como usar:\n• Marque uma mensagem do usuário\n• Ou mencione: ${config.prefix}promover @usuario` 
            }, { quoted: msg });
        }
        if (compareIds(targetJid, botId)) {
            return await conn.sendMessage(from, { text: 'Eu já sou administrador!' }, { quoted: msg });
        }
        const targetParticipant = findParticipant(participants, targetJid);
        if (targetParticipant && ['admin', 'superadmin'].includes(targetParticipant.admin)) {
            return await conn.sendMessage(from, { text: 'Este usuário já é administrador!' }, { quoted: msg });
        }
        const { buildActionCard } = require('../../funções/layout');
        await conn.groupParticipantsUpdate(from, [targetJid], 'promote');

        const targetNum = targetJid.split('@')[0].split(':')[0];
        const adminNum = sender.split('@')[0].split(':')[0];
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

        await conn.sendMessage(from, { 
            text: card,
            mentions: [targetJid, sender]
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
