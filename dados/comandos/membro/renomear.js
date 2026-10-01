// creditos Olympio
const { downloadContentFromMessage } = require('baileys');
const { writeExif } = require('../../funções/autofigUtils');

const aliases = ['rename', 'renomear', 'rn', 'roubar'];

async function run(conn, msg, config, args, sender, senderName) {
    const from = msg.key.remoteJid;
    const quoted = msg.message.extendedTextMessage?.contextInfo?.quotedMessage;
    const stickerMsg = quoted?.stickerMessage;
    if (!stickerMsg) {
        return await conn.sendMessage(from, { 
            text: `📝 *Renomear Sticker*\n\nResponda a uma figurinha com:\n*${config.prefix}rn pacote/autor*` 
        }, { quoted: msg });
    }
    const input = args.join(' ');
    if (!input.includes('/')) {
        return await conn.sendMessage(from, { text: '❌ Use a barra "/" para separar.\nEx: !rn Pack/Olymp' }, { quoted: msg });
    }
    const [pack, author] = input.split('/').map(s => s.trim());
    try {
        const stream = await downloadContentFromMessage(stickerMsg, 'sticker');
        let buffer = Buffer.from([]);
        for await (const chunk of stream) {
            buffer = Buffer.concat([buffer, chunk]);
        }
        const isAnim = !!stickerMsg.isAnimated || buffer.indexOf(Buffer.from('ANIM')) !== -1;
        const renamedBuffer = await writeExif(buffer, {
            pack: pack || "Pack",
            author: author || "Olymp"
        });
        await conn.sendMessage(from, {
            sticker: renamedBuffer,
            isAnimated: isAnim
        }, { quoted: msg });
    } catch (e) {
        console.error("Erro rename:", e);
        await conn.sendMessage(from, { text: '❌ Erro ao renomear.' }, { quoted: msg });
    }
}

module.exports = {
    run,
    aliases
};
