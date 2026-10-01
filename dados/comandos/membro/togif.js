// creditos Olympio
const { downloadContentFromMessage } = require('../../funções/mediaUtils');
const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs-extra');
const path = require('path');
const sharp = require('sharp');
const execPromise = promisify(exec);
const aliases = ['togif', 'gif', 'tomp4'];
async function run(conn, msg, config, args, sender, senderName) {
    const from = msg.key.remoteJid;
    const quoted = msg.message.extendedTextMessage?.contextInfo?.quotedMessage;
    const stickerMsg = quoted?.stickerMessage;
    if (!stickerMsg) {
        return await conn.sendMessage(from, { 
            text: `🎞️ *Converter Sticker em GIF/Vídeo*
🔹 Marque um sticker e use:
${config.prefix || '!'}togif
${config.prefix || '!'}gif
📌 Funciona com stickers animados!` 
        }, { quoted: msg });
    }
    const tempDir = path.join(__dirname, '..', '..', 'temp');
    await fs.ensureDir(tempDir);
    const timestamp = Date.now();
    const inputPath = path.join(tempDir, `sticker_${timestamp}.webp`);
    const gifPath = path.join(tempDir, `anim_${timestamp}.gif`);
    const mp4Path = path.join(tempDir, `video_${timestamp}.mp4`);
    try {
        const stream = await downloadContentFromMessage(stickerMsg, 'image');
        let buffer = Buffer.from([]);
        for await (const chunk of stream) {
            buffer = Buffer.concat([buffer, chunk]);
        }
        await fs.writeFile(inputPath, buffer);
        try {
            await sharp(inputPath, { animated: true })
                .gif()
                .toFile(gifPath);
        } catch (sharpError) {
            console.log('Sharp falhou, tentando método alternativo...');
            const img2webpCommand = `img2webp -o "${gifPath}" "${inputPath}"`;
            try {
                await execPromise(img2webpCommand);
            } catch (imgError) {
                throw new Error('Não foi possível converter este sticker');
            }
        }
        const convertCommand = `ffmpeg -i "${gifPath}" -movflags faststart -pix_fmt yuv420p -vf "scale=512:512:force_original_aspect_ratio=decrease" "${mp4Path}"`;
        await execPromise(convertCommand);
        const videoBuffer = await fs.readFile(mp4Path);
        await conn.sendMessage(from, { 
            video: videoBuffer,
            gifPlayback: true
        }, { quoted: msg });
    } catch (e) {
        console.error("Erro ao converter sticker:", e);
        await conn.sendMessage(from, { 
            text: '❌ Este sticker não pode ser convertido. Pode ser estático ou estar corrompido.' 
        }, { quoted: msg });
    } finally {
        try {
            if (await fs.exists(inputPath)) await fs.unlink(inputPath);
            if (await fs.exists(gifPath)) await fs.unlink(gifPath);
            if (await fs.exists(mp4Path)) await fs.unlink(mp4Path);
        } catch {}
    }
}
module.exports = {
    run,
    aliases
};
