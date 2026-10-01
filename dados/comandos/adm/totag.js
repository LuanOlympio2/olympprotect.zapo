// creditos Olympio
const { findParticipant, isUserAdmin } = require('../../funções/normalizarid');
const { downloadContentFromMessage } = require('baileys');
const aliases = ['totag', 'hidetag', 'cita'];
const downloadMedia = async (message, type) => {
    try {
        const stream = await downloadContentFromMessage(message, type);
        let buffer = Buffer.from([]);
        for await (const chunk of stream) {
            buffer = Buffer.concat([buffer, chunk]);
        }
        return buffer;
    } catch (e) {
        console.error('Erro ao baixar mídia:', e);
        return null;
    }
};
async function run(conn, msg, config, args, sender, senderName) {
    const from = msg.key.remoteJid;
    const isGroup = from.endsWith('@g.us');
    if (!isGroup) {
        return await conn.sendMessage(from, { text: 'Este comando só funciona em grupos!' }, { quoted: msg });
    }
    try {
        const groupMetadata = await conn.groupMetadata(from);
        const participants = groupMetadata.participants;
        if (!isUserAdmin(groupMetadata, sender, conn)) {
            return await conn.sendMessage(from, { text: 'Apenas administradores podem usar este comando!' }, { quoted: msg });
        }
        const mentions = participants.map(({ id }) => id);
        const quotedMsg = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        if (quotedMsg) {
            const imageMessage = quotedMsg.imageMessage || quotedMsg.viewOnceMessage?.message?.imageMessage || quotedMsg.viewOnceMessageV2?.message?.imageMessage;
            const videoMessage = quotedMsg.videoMessage || quotedMsg.viewOnceMessage?.message?.videoMessage || quotedMsg.viewOnceMessageV2?.message?.videoMessage;
            const audioMessage = quotedMsg.audioMessage || quotedMsg.viewOnceMessage?.message?.audioMessage || quotedMsg.viewOnceMessageV2?.message?.audioMessage;
            const documentMessage = quotedMsg.documentMessage || quotedMsg.viewOnceMessage?.message?.documentMessage || quotedMsg.viewOnceMessageV2?.message?.documentMessage;
            const stickerMessage = quotedMsg.stickerMessage;
            if (imageMessage) {
                const buffer = await downloadMedia(imageMessage, 'image');
                if (buffer) {
                    await conn.sendMessage(from, {
                        image: buffer,
                        caption: imageMessage.caption || '',
                        mentions: mentions
                    });
                }
            } else if (videoMessage) {
                const buffer = await downloadMedia(videoMessage, 'video');
                if (buffer) {
                    await conn.sendMessage(from, {
                        video: buffer,
                        caption: videoMessage.caption || '',
                        mentions: mentions
                    });
                }
            } else if (audioMessage) {
                const buffer = await downloadMedia(audioMessage, 'audio');
                if (buffer) {
                    await conn.sendMessage(from, {
                        audio: buffer,
                        mimetype: audioMessage.mimetype || 'audio/mp4',
                        ptt: audioMessage.ptt || false,
                        mentions: mentions
                    });
                }
            } else if (documentMessage) {
                const buffer = await downloadMedia(documentMessage, 'document');
                if (buffer) {
                    await conn.sendMessage(from, {
                        document: buffer,
                        mimetype: documentMessage.mimetype,
                        fileName: documentMessage.fileName,
                        caption: documentMessage.caption || '',
                        mentions: mentions
                    });
                }
            } else if (stickerMessage) {
                const buffer = await downloadMedia(stickerMessage, 'sticker');
                if (buffer) {
                    await conn.sendMessage(from, {
                        sticker: buffer,
                        isAnimated: !!stickerMessage.isAnimated,
                        mentions: mentions
                    });
                }
            } else if (quotedMsg.conversation || quotedMsg.extendedTextMessage) {
                const text = quotedMsg.conversation || quotedMsg.extendedTextMessage?.text || '';
                await conn.sendMessage(from, {
                    text: text,
                    mentions: mentions
                });
            } else {
                await conn.sendMessage(from, {
                    text: 'Marcação do grupo! (Mídia não suportada para reenvio)',
                    mentions: mentions
                });
            }
        } else {
            const text = args.join(' ') || 'Marcação do grupo!';
            await conn.sendMessage(from, {
                text: text,
                mentions: mentions
            });
        }
    } catch (e) {
        console.error("Erro no comando totag:", e);
        await conn.sendMessage(from, { text: 'Erro ao marcar os membros do grupo.' }, { quoted: msg });
    }
}
module.exports = {
    run,
    aliases
};
