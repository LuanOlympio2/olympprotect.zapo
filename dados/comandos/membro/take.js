// creditos Olympio
const { downloadContentFromMessage } = require('baileys');
const fs = require('fs-extra');
const path = require('path');
const { normalizeId } = require('../../funções/normalizarid');
const { writeExif } = require('../../funções/autofigUtils');

const TAKE_PATH = path.resolve(__dirname, '../../database/take.json');

module.exports = {
    name: 'take',
    aliases: ['take'],
    category: 'membro',
    description: 'Reenvia uma figurinha usando o autor e pacote salvos no rgtake.',
    run: async (conn, msg, config, args, sender) => {
        const from = msg.key.remoteJid;
        const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        const stickerMsg = quoted?.stickerMessage;
        if (!stickerMsg) {
            return conn.sendMessage(from, { text: 'Marque uma figurinha para aplicar o take.' }, { quoted: msg });
        }
        if (!fs.existsSync(TAKE_PATH)) {
            return conn.sendMessage(from, { text: 'Nenhum registro de take foi encontrado. Use rgtake primeiro.' }, { quoted: msg });
        }
        try {
            const dataTake = await fs.readJson(TAKE_PATH);
            const registro = dataTake[normalizeId(sender)];
            if (!registro) {
                return conn.sendMessage(from, { text: 'Você ainda não registrou seu take. Use rgtake primeiro.' }, { quoted: msg });
            }
            const stream = await downloadContentFromMessage(stickerMsg, 'sticker');
            let buffer = Buffer.from([]);
            for await (const chunk of stream) {
                buffer = Buffer.concat([buffer, chunk]);
            }
            const isAnim = !!stickerMsg.isAnimated || buffer.indexOf(Buffer.from('ANIM')) !== -1;
            const renamedBuffer = await writeExif(buffer, {
                pack: registro.pack || 'Pack',
                author: registro.author || ''
            });
            await conn.sendMessage(from, {
                sticker: renamedBuffer,
                isAnimated: isAnim
            }, { quoted: msg });
        } catch (e) {
            console.error('Erro no comando take:', e);
            await conn.sendMessage(from, { text: 'Não consegui aplicar o take nessa figurinha.' }, { quoted: msg });
        }
    }
};
