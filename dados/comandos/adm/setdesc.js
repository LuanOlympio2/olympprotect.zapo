const { isUserAdmin, isBotAdmin } = require('../../funções/normalizarid');
const groupCache = require('../../funções/groupCache');
module.exports = {
    name: 'setdesc',
    aliases: ['setdesc', 'setdescricao', 'setdescgp'],
    category: 'adm',
    description: 'Troca a descrição do grupo.',
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
                return conn.sendMessage(from, { text: '❌ Apenas administradores podem trocar a descrição do grupo.' }, { quoted: msg });
            }
            if (!isBotAdmin(metadata, conn)) {
                return conn.sendMessage(from, { text: '❌ Eu preciso ser admin para trocar a descrição do grupo.' }, { quoted: msg });
            }
            const newDesc = args.join(' ').trim();
            if (!newDesc) {
                return conn.sendMessage(from, { text: `❌ Use: ${config.prefix}setdesc Nova descrição do grupo` }, { quoted: msg });
            }
            await conn.groupUpdateDescription(from, newDesc);
            groupCache.del(from);
            await conn.sendMessage(from, { text: '✅ Descrição do grupo atualizada.' }, { quoted: msg });
        } catch (e) {
            console.error('Erro no comando setdesc:', e);
            await conn.sendMessage(from, { text: '❌ Erro ao trocar a descrição do grupo.' }, { quoted: msg });
        }
    }
};
