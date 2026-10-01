// creditos Olympio
const aliases = ['grupo', 'group'];
const { findParticipant, isUserAdmin, isBotAdmin } = require('../../funções/normalizarid');
async function run(conn, msg, config, args, sender, senderName) {
    const from = msg.key.remoteJid;
    const isGroup = from.endsWith('@g.us');
    if (!isGroup) {
        return await conn.sendMessage(from, { text: 'Este comando só funciona em grupos!' }, { quoted: msg });
    }
    const action = args[0]?.toLowerCase();
    if (!action || !['a', 'f', 'abrir', 'fechar'].includes(action)) {
        return await conn.sendMessage(from, { 
            text: `Como usar:\n• ${config.prefix}grupo a - Abrir grupo (todos podem enviar)\n• ${config.prefix}grupo f - Fechar grupo (apenas admins)` 
        }, { quoted: msg });
    }
    try {
        const groupMetadata = await conn.groupMetadata(from);
        const botId = conn.user.id;
        if (!isUserAdmin(groupMetadata, sender, conn)) {
            return await conn.sendMessage(from, { text: 'Apenas administradores podem usar este comando!' }, { quoted: msg });
        }
        if (!isBotAdmin(groupMetadata, botId)) {
            return await conn.sendMessage(from, { text: 'Preciso ser administrador para alterar as configurações do grupo!' }, { quoted: msg });
        }
        const { buildActionCard } = require('../../funções/layout');
        const shouldOpen = ['a', 'abrir'].includes(action);
        await conn.groupSettingUpdate(from, shouldOpen ? 'not_announcement' : 'announcement');

        const card = buildActionCard({
            header: 'GESTÃO DO GRUPO',
            headerIcon: '👥',
            title: shouldOpen ? 'GRUPO ABERTO' : 'GRUPO FECHADO',
            icon: shouldOpen ? '🔓' : '🔒',
            lines: [
                `📢 *Status:* ${shouldOpen ? 'Aberto para todos' : 'Fechado (Apenas Admins)'}`,
                `👥 *Grupo:* ${groupMetadata.subject || 'Grupo'}`,
                `👮 *Modificado por:* @${sender.split('@')[0].split(':')[0]}`
            ],
            tip: shouldOpen 
                ? 'Todos os participantes podem enviar mensagens novamente.'
                : 'Apenas administradores podem enviar mensagens neste momento.'
        });

        await conn.sendMessage(from, { 
            text: card,
            mentions: [sender]
        }, { quoted: msg });
    } catch (e) {
        console.error("Erro no comando grupo:", e);
        await conn.sendMessage(from, { text: '❌ Erro ao alterar as configurações do grupo.' }, { quoted: msg });
    }
}
module.exports = {
    run,
    aliases
};
