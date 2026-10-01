// creditos Olympio
const { isUserAdmin, isBotAdmin } = require('../../funções/normalizarid');
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
            const metadata = await conn.groupMetadata(from);
            if (!isUserAdmin(metadata, sender)) {
                return conn.sendMessage(from, { text: '❌ Apenas administradores podem trocar a descrição do grupo.' }, { quoted: msg });
            }
            if (!isBotAdmin(metadata, conn.user.id)) {
                return conn.sendMessage(from, { text: '❌ Eu preciso ser admin para trocar a descrição do grupo.' }, { quoted: msg });
            }
            const newDesc = args.join(' ').trim();
            if (!newDesc) {
                return conn.sendMessage(from, { text: `❌ Use: ${config.prefix}setdesc Nova descrição do grupo` }, { quoted: msg });
            }
            await conn.groupUpdateDescription(from, newDesc);
            await conn.sendMessage(from, { text: '✅ Descrição do grupo atualizada.' }, { quoted: msg });
        } catch (e) {
            console.error('Erro no comando setdesc:', e);
            await conn.sendMessage(from, { text: '❌ Erro ao trocar a descrição do grupo.' }, { quoted: msg });
        }
    }
};
