const { Readable } = require('stream');

let lib;
try {
    lib = require('zapo-js');
} catch (_) {
    try {
        lib = require('baileys');
    } catch (_) {}
}

async function downloadContentFromMessage(mediaMessage, type) {
    if (!mediaMessage) throw new Error('No media to download');
    if (lib && typeof lib.downloadContentFromMessage === 'function') {
        return lib.downloadContentFromMessage(mediaMessage, type);
    }
    if (lib && typeof lib.downloadMediaMessage === 'function') {
        let res;
        if (mediaMessage.directPath && mediaMessage.mediaKey) {
            const key = type === 'image' ? 'imageMessage' :
                        type === 'video' ? 'videoMessage' :
                        type === 'audio' ? 'audioMessage' :
                        type === 'sticker' ? 'stickerMessage' :
                        type === 'document' ? 'documentMessage' :
                        `${type}Message`;
            res = await lib.downloadMediaMessage({ [key]: mediaMessage });
        } else {
            res = await lib.downloadMediaMessage(mediaMessage);
        }
        if (Buffer.isBuffer(res) || res instanceof Uint8Array) {
            return Readable.from(Buffer.from(res));
        }
        return res;
    }
    throw new Error('No media downloader available');
}

module.exports = {
    downloadContentFromMessage,
    downloadMediaMessage: lib ? lib.downloadMediaMessage : null
};
