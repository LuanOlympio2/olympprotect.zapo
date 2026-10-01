// creditos Olympio
const { downloadMediaMessage } = require('zapo-js');

async function downloadContentFromMessage(mediaMessage, type) {
    if (!mediaMessage) throw new Error('No media to download');
    if (mediaMessage.directPath && mediaMessage.mediaKey) {
        const key = type === 'image' ? 'imageMessage' :
                    type === 'video' ? 'videoMessage' :
                    type === 'audio' ? 'audioMessage' :
                    type === 'sticker' ? 'stickerMessage' :
                    type === 'document' ? 'documentMessage' :
                    `${type}Message`;
        return await downloadMediaMessage({ [key]: mediaMessage });
    }
    return await downloadMediaMessage(mediaMessage);
}

module.exports = {
    downloadContentFromMessage,
    downloadMediaMessage
};
