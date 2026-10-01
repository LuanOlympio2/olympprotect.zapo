// creditos Olympio
const { transcreverAudioBuffer } = require('../../funções/transcricao');

const aliases = ['transcrever', 'transcreva', 'ouvir'];

async function run(conn, msg, config, args, sender, senderName) {
    const from = msg.key.remoteJid;
    const prefix = config.prefix || '!';

    const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    let audioMessage = null;

    if (quoted?.audioMessage) {
        audioMessage = quoted.audioMessage;
    } else if (msg.message?.audioMessage) {
        audioMessage = msg.message.audioMessage;
    }

    if (!audioMessage) {
        return await conn.sendMessage(from, {
            text: `⚠️ Como usar: responda a um áudio com o comando *${prefix}transcrever* ou envie um áudio com o comando na legenda!`
        }, { quoted: msg });
    }

    try {
        await conn.sendPresenceUpdate('composing', from);

        let downloadContentFromMessage = null;
        try {
            downloadContentFromMessage = require('../../funções/mediaUtils').downloadContentFromMessage;
        } catch (_) {
            downloadContentFromMessage = null;
        }

        if (!downloadContentFromMessage) {
            return await conn.sendMessage(from, {
                text: 'Módulo de download de mídia indisponível no momento!'
            }, { quoted: msg });
        }

        const stream = await downloadContentFromMessage(audioMessage, 'audio');
        let buffer = Buffer.from([]);
        for await (const chunk of stream) {
            buffer = Buffer.concat([buffer, chunk]);
        }

        const mimeType = audioMessage.mimetype || 'audio/ogg';
        const texto = await transcreverAudioBuffer(buffer, mimeType);

        if (!texto) {
            return await conn.sendMessage(from, {
                text: 'Não consegui entender o que foi dito no áudio, pode estar muito baixo ou com ruído!'
            }, { quoted: msg });
        }

        await conn.sendMessage(from, {
            text: `📝 *Transcrição do áudio:*\n\n${texto}`
        }, { quoted: msg });

    } catch (e) {
        console.error('Erro ao transcrever áudio:', e?.message || e);
        await conn.sendMessage(from, {
            text: 'Ocorreu um erro ao transcrever o áudio, tente novamente em instantes!'
        }, { quoted: msg });
    }
}

module.exports = {
    name: 'transcrever',
    description: 'Transcreve um áudio citado ou enviado',
    aliases,
    run
};
