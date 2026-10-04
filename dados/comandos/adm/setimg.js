const { downloadContentFromMessage } = require('../../funções/mediaUtils');
const { isUserAdmin, isBotAdmin } = require('../../funções/normalizarid');
const groupCache = require('../../funções/groupCache');
module.exports = {
    name: 'setimg',
    aliases: ['setimg', 'setpp', 'setfotogp'],
    category: 'adm',
    description: 'Troca a foto do grupo.',
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
                return conn.sendMessage(from, { text: '❌ Apenas administradores podem trocar a imagem do grupo.' }, { quoted: msg });
            }
            if (!isBotAdmin(metadata, conn)) {
                return conn.sendMessage(from, { text: '❌ Eu preciso ser admin para trocar a imagem do grupo.' }, { quoted: msg });
            }
            const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
            const imageMessage = quoted?.imageMessage || msg.message?.imageMessage;
            if (!imageMessage) {
                return conn.sendMessage(from, { text: `❌ Envie ou responda uma foto com ${config.prefix}setimg.` }, { quoted: msg });
            }
            const stream = await downloadContentFromMessage(imageMessage, 'image');
            let buffer = Buffer.from([]);
            for await (const chunk of stream) {
                buffer = Buffer.concat([buffer, chunk]);
            }
            await conn.updateProfilePicture(from, buffer);
            groupCache.del(from);
            await conn.sendMessage(from, { text: '✅ Imagem do grupo atualizada com sucesso.' }, { quoted: msg });
        } catch (e) {
            console.error('Erro no comando setimg:', e);
            await conn.sendMessage(from, { text: '❌ Erro ao trocar a imagem do grupo.' }, { quoted: msg });
        }
    }
};
