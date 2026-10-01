// creditos Olympio
const { extractMediaSource, mediaToStickerBuffer } = require('../../funções/autofigUtils');

const aliases = ['sticker', 's', 'f', 'figurinha', 'fig'];

async function run(conn, msg, config, args, sender, senderName) {
    const from = msg.key.remoteJid;
    let packName = "";
    let authorName = "「 Olymp.Protect - bot 」";

    if (args && args.length > 0) {
        const text = args.join(' ');
        if (text.includes('/')) {
            const parts = text.split('/');
            packName = parts[0].trim();
            authorName = parts.slice(1).join('/').trim();
        } else {
            authorName = text.trim();
        }
    }

    const source = extractMediaSource(msg);
    if (!source) {
        return await conn.sendMessage(from, { text: 'Você precisa enviar ou marcar uma foto, vídeo de até 10s ou figurinha!' }, { quoted: msg });
    }

    if (source.isVideo && source.media.seconds && source.media.seconds > 10) {
        return await conn.sendMessage(from, { text: 'O vídeo é muito longo! (Máx 10s).' }, { quoted: msg });
    }

    await conn.sendMessage(from, { text: 'Convertendo em figurinha, aguarde...' }, { quoted: msg });

    try {
        const stickerBuffer = await mediaToStickerBuffer(source.media, source.mediaType, {
            packName,
            authorName
        });
        const isAnimated = !!stickerBuffer.isAnimated || source.isVideo;
        await conn.sendMessage(from, {
            sticker: stickerBuffer,
            isAnimated
        }, { quoted: msg });
    } catch (e) {
        console.error("Erro ao criar sticker:", e);
        await conn.sendMessage(from, { text: 'Não consegui converter essa mídia. Verifique se o ffmpeg está instalado.' }, { quoted: msg });
    }
}

module.exports = {
    run,
    aliases
};
