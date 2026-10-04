const { isUserAdmin, isBotAdmin } = require('../../funções/normalizarid');
const groupCache = require('../../funções/groupCache');
module.exports = {
    name: 'setname',
    aliases: ['setname', 'setnome'],
    category: 'adm',
    description: 'Troca o nome do grupo.',
    run: async (conn, msg, config, args, sender) => {
        const from = msg.key.remoteJid;
        if (!from.endsWith('@g.us')) {
            return conn.sendMessage(from, { text: '❌ Esse comando só funciona em grupos.' }, { quoted: msg });
        }
        try {
            const metadata = await conn.groupMetadata(from).catch(() => null);
            if (!metadata) {
                return conn.sendMessage(from, { text: '❌ Erro ao obter dados do grupo.' }, { quoted: msg });
            }
            const rawSender = msg.key?.participant || sender;
            if (!isUserAdmin(metadata, sender, conn) && !isUserAdmin(metadata, rawSender, conn)) {
                return conn.sendMessage(from, { text: '❌ Apenas administradores podem trocar o nome do grupo.' }, { quoted: msg });
            }
            if (!isBotAdmin(metadata, conn)) {
                return conn.sendMessage(from, { text: '❌ Eu preciso ser admin para trocar o nome do grupo.' }, { quoted: msg });
            }
            const newName = args.join(' ').trim();
            if (!newName) {
                return conn.sendMessage(from, { text: `❌ Use: ${config.prefix}setname Novo nome do grupo` }, { quoted: msg });
            }
            await conn.groupUpdateSubject(from, newName);
            groupCache.del(from);
            await conn.sendMessage(from, { text: `✅ Nome do grupo atualizado para *${newName}*.` }, { quoted: msg });
        } catch (e) {
            console.error('Erro no comando setname:', e);
            await conn.sendMessage(from, { text: '❌ Erro ao trocar o nome do grupo.' }, { quoted: msg });
        }
    }
};
