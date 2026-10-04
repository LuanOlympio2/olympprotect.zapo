// creditos Olympio
const aliases = ['grupo', 'group', 'gp', 'fechar', 'abrir', 'fechargrupo', 'abrirgrupo', 'close', 'open'];
const { findParticipant, isUserAdmin, isBotAdmin } = require('../../funções/normalizarid');
async function run(conn, msg, config, args, sender, senderName) {
    const from = msg.key.remoteJid;
    const isGroup = from.endsWith('@g.us');
    if (!isGroup) {
        return await conn.sendMessage(from, { text: 'Este comando só funciona em grupos!' }, { quoted: msg });
    }
    const prefix = config.prefix || '!';
    const body = msg.message?.conversation || msg.message?.extendedTextMessage?.text || msg.message?.imageMessage?.caption || msg.message?.videoMessage?.caption || '';
    const invoked = body.startsWith(prefix) ? body.slice(prefix.length).trim().split(/ +/)[0].toLowerCase() : '';

    let action = (args[0] || '').toLowerCase();
    if (!action) {
        if (['fechar', 'fechargrupo', 'close', 'fechado'].includes(invoked)) {
            action = 'fechar';
        } else if (['abrir', 'abrirgrupo', 'open', 'aberto'].includes(invoked)) {
            action = 'abrir';
        }
    }

    if (!action || !['a', 'f', 'abrir', 'fechar', 'close', 'open', 'aberto', 'fechado'].includes(action)) {
        return await conn.sendMessage(from, { 
            text: `Como usar:\n• ${prefix}fechar ou ${prefix}grupo f - Fechar grupo (apenas admins)\n• ${prefix}abrir ou ${prefix}grupo a - Abrir grupo (todos podem enviar)` 
        }, { quoted: msg });
    }
    try {
        const groupMetadata = await conn.groupMetadata(from).catch(() => null);
        if (!groupMetadata) {
            return await conn.sendMessage(from, { text: '❌ Erro ao obter dados do grupo.' }, { quoted: msg });
        }
        const rawSender = msg.key?.participant || sender;
        const isAdmin = isUserAdmin(groupMetadata, sender, conn) || isUserAdmin(groupMetadata, rawSender, conn);
        if (!isAdmin) {
            return await conn.sendMessage(from, { text: 'Apenas administradores podem usar este comando!' }, { quoted: msg });
        }
        if (!isBotAdmin(groupMetadata, conn)) {
            return await conn.sendMessage(from, { text: 'Preciso ser administrador para alterar as configurações do grupo!' }, { quoted: msg });
        }
        const { buildActionCard } = require('../../funções/layout');
        const shouldOpen = ['a', 'abrir', 'open', 'aberto'].includes(action);
        await conn.groupSettingUpdate(from, shouldOpen ? 'not_announcement' : 'announcement');

        const senderTag = sender.split('@')[0].split(':')[0];
        const card = buildActionCard({
            header: 'GESTÃO DO GRUPO',
            headerIcon: '👥',
            title: shouldOpen ? 'GRUPO ABERTO' : 'GRUPO FECHADO',
            icon: shouldOpen ? '🔓' : '🔒',
            lines: [
                `📢 *Status:* ${shouldOpen ? 'Aberto para todos' : 'Fechado (Apenas Admins)'}`,
                `👥 *Grupo:* ${groupMetadata.subject || 'Grupo'}`,
                `👮 *Modificado por:* @${senderTag}`
            ],
            tip: shouldOpen 
                ? 'Todos os participantes podem enviar mensagens novamente.'
                : 'Apenas administradores podem enviar mensagens neste momento.'
        });

        await conn.sendMessage(from, { 
            text: card,
            mentions: [sender, rawSender].filter(Boolean)
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
