// creditos Olympio
const { downloadContentFromMessage } = require('baileys');
const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs-extra');
const path = require('path');
const aliases = ['toimg', 'img'];
async function run(conn, msg, config, args) {
    const from = msg.key.remoteJid;
    const quoted = msg.message.extendedTextMessage?.contextInfo?.quotedMessage;
    if (!quoted || !quoted.stickerMessage) {
        return await conn.sendMessage(from, { text: '❌ Você precisa responder a uma figurinha!' }, { quoted: msg });
    }
    if (quoted.stickerMessage.isAnimated) {
        return await conn.sendMessage(from, { text: '❌ Figurinhas animadas não são suportadas (use !tovid se quiser converter gif/video).' }, { quoted: msg });
    }
    await conn.sendMessage(from, { text: '🔄 Convertendo figurinha em imagem...' }, { quoted: msg });
    const tempDir = path.join(process.cwd(), 'temp');
    await fs.ensureDir(tempDir);
    const timestamp = Date.now();
    const inputPath = path.join(tempDir, `toimg_in_${timestamp}.webp`);
    const outputPath = path.join(tempDir, `toimg_out_${timestamp}.png`);
    try {
        const stream = await downloadContentFromMessage(quoted.stickerMessage, 'sticker');
        let buffer = Buffer.from([]);
        for await (const chunk of stream) {
            buffer = Buffer.concat([buffer, chunk]);
        }
        await fs.writeFile(inputPath, buffer);
        await new Promise((resolve, reject) => {
            ffmpeg(inputPath)
                .fromFormat('webp_pipe')
                .save(outputPath)
                .on('end', resolve)
                .on('error', reject);
        });
        const imageBuffer = await fs.readFile(outputPath);
        await conn.sendMessage(from, {
            image: imageBuffer,
            caption: '🖼️ Aqui está sua imagem!'
        }, { quoted: msg });
    } catch (e) {
        console.error("Erro no comando toimg:", e);
        await conn.sendMessage(from, { text: '❌ Erro ao converter a figurinha.' }, { quoted: msg });
    } finally {
        if (await fs.exists(inputPath)) await fs.unlink(inputPath);
        if (await fs.exists(outputPath)) await fs.unlink(outputPath);
    }
}
module.exports = {
    run,
    aliases
};
