// creditos Olympio
const { isUserAdmin } = require('../../funções/normalizarid');
module.exports = {
    name: 'adm',
    aliases: ['adm', 'adms'],
    category: 'adm',
    description: 'Marca apenas os administradores do grupo.',
    run: async (conn, msg, config, args, sender) => {
        const from = msg.key.remoteJid;
        if (!from.endsWith('@g.us')) {
            return conn.sendMessage(from, { text: '❌ Esse comando só funciona em grupos.' }, { quoted: msg });
        }
        try {
            const groupMetadata = await conn.groupMetadata(from);
            if (!isUserAdmin(groupMetadata, sender)) {
                return conn.sendMessage(from, { text: '❌ Apenas administradores podem convocar a staff.' }, { quoted: msg });
            }
            const admins = groupMetadata.participants.filter((participant) => participant.admin === 'admin' || participant.admin === 'superadmin');
            const mentions = admins.map((participant) => participant.id);
            const motivo = args.join(' ').trim() || 'Chamado da administração';
            let text = `📣 *${motivo}*\n\n`;
            admins.forEach((admin) => {
                text += `@${admin.id.split('@')[0]}\n`;
            });
            await conn.sendMessage(from, { text, mentions }, { quoted: msg });
        } catch (e) {
            console.error('Erro no comando adm:', e);
            await conn.sendMessage(from, { text: '❌ Erro ao marcar os administradores.' }, { quoted: msg });
        }
    }
};
