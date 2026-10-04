const { isUserAdmin, resolveToPhoneJid, getMentionJids } = require('../../funções/normalizarid');
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
            const groupMetadata = await conn.groupMetadata(from).catch(() => null);
            if (!groupMetadata) {
                return conn.sendMessage(from, { text: '❌ Erro ao obter dados do grupo.' }, { quoted: msg });
            }
            const rawSender = msg.key?.participant || sender;
            if (!isUserAdmin(groupMetadata, sender, conn) && !isUserAdmin(groupMetadata, rawSender, conn)) {
                return conn.sendMessage(from, { text: '❌ Apenas administradores podem convocar a staff.' }, { quoted: msg });
            }
            const participants = groupMetadata.participants || [];
            const admins = participants.filter((p) => p.admin === 'admin' || p.admin === 'superadmin' || p.isAdmin === true || p.isSuperAdmin === true);
            if (!admins.length) {
                return conn.sendMessage(from, { text: '⚠️ Nenhum administrador encontrado.' }, { quoted: msg });
            }
            const motivo = args.join(' ').trim() || 'Chamado da administração';
            let text = `📣 *${motivo}*\n\n`;
            const mentionsSet = new Set();
            admins.forEach((admin) => {
                const pId = admin.id || admin.jid;
                const phoneJid = resolveToPhoneJid(pId, participants);
                const num = phoneJid.split('@')[0].split(':')[0];
                text += `@${num}\n`;
                getMentionJids(pId, participants).forEach((m) => mentionsSet.add(m));
            });
            await conn.sendMessage(from, { text, mentions: Array.from(mentionsSet) }, { quoted: msg });
        } catch (e) {
            console.error('Erro no comando adm:', e);
            await conn.sendMessage(from, { text: '❌ Erro ao marcar os administradores.' }, { quoted: msg });
        }
    }
};
