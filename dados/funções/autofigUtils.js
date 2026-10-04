// creditos Olympio
const { downloadContentFromMessage } = require('./mediaUtils');
const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs-extra');
const path = require('path');
const sharp = require('sharp');
const webp = require('node-webpmux');

function extractQuotedMessage(msg) {
    return msg?.message?.extendedTextMessage?.contextInfo?.quotedMessage || null;
}

function extractMediaSource(msg) {
    const quoted = extractQuotedMessage(msg);
    const direct = msg?.message || {};
    const candidates = [quoted, direct];
    for (const candidate of candidates) {
        if (!candidate) continue;
        const target = candidate.ephemeralMessage?.message ||
            candidate.viewOnceMessage?.message ||
            candidate.viewOnceMessageV2?.message ||
            candidate.viewOnceMessageV2Extension?.message ||
            candidate.documentWithCaptionMessage?.message ||
            candidate;

        if (target.imageMessage) {
            return { media: target.imageMessage, mediaType: 'image', isVideo: false };
        }
        if (target.videoMessage) {
            return { media: target.videoMessage, mediaType: 'video', isVideo: true };
        }
        if (target.stickerMessage) {
            return { media: target.stickerMessage, mediaType: 'sticker', isVideo: !!target.stickerMessage.isAnimated };
        }
        if (target.documentMessage) {
            const mime = target.documentMessage.mimetype || '';
            if (mime.includes('image')) {
                return { media: target.documentMessage, mediaType: 'image', isVideo: false };
            }
            if (mime.includes('video')) {
                return { media: target.documentMessage, mediaType: 'video', isVideo: true };
            }
        }
    }
    return null;
}

async function downloadMediaBuffer(media, mediaType) {
    const stream = await downloadContentFromMessage(media, mediaType);
    let buffer = Buffer.from([]);
    for await (const chunk of stream) {
        buffer = Buffer.concat([buffer, chunk]);
    }
    return buffer;
}

async function writeExif(webpBuffer, metadata = {}) {
    try {
        const img = new webp.Image();
        await img.load(webpBuffer);
        const json = {
            'sticker-pack-id': metadata.id || 'OlympProtect-bot',
            'sticker-pack-name': metadata.pack || metadata.packName || '',
            'sticker-pack-publisher': metadata.author || metadata.authorName || '「 Olymp.Protect - bot 」',
            'emojis': metadata.categories || ['🤖']
        };
        const exifAttr = Buffer.from([
            0x49, 0x49, 0x2A, 0x00,
            0x08, 0x00, 0x00, 0x00,
            0x01, 0x00, 0x41, 0x57,
            0x07, 0x00, 0x00, 0x00,
            0x00, 0x00, 0x16, 0x00,
            0x00, 0x00
        ]);
        const jsonBuff = Buffer.from(JSON.stringify(json), 'utf-8');
        const exif = Buffer.concat([exifAttr, jsonBuff]);
        exif.writeUIntLE(jsonBuff.length, 14, 4);
        img.exif = exif;
        return await img.save(null);
    } catch (e) {
        return webpBuffer;
    }
}

async function videoToSticker(inputBuffer, options = {}) {
    const tempDir = path.join(process.cwd(), 'temp');
    await fs.ensureDir(tempDir);
    const id = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const inputPath = path.join(tempDir, `vid_in_${id}.mp4`);
    const outputPath = path.join(tempDir, `vid_out_${id}.webp`);
    await fs.writeFile(inputPath, inputBuffer);

    try {
        const MAX_SIZE = 950000;
        let quality = 40;
        let fps = 15;
        let maxDuration = 8;
        const scale = 'scale=512:512:force_original_aspect_ratio=decrease,format=rgba,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=0x00000000';

        let outBuffer = null;
        for (let attempt = 0; attempt < 3; attempt++) {
            await new Promise((resolve, reject) => {
                ffmpeg(inputPath)
                    .outputOptions([
                        '-vf', `${scale},fps=${fps}`,
                        '-c:v', 'libwebp',
                        '-lossless', '0',
                        '-compression_level', '4',
                        '-q:v', String(quality),
                        '-loop', '0',
                        '-an',
                        '-vsync', '0',
                        '-t', String(maxDuration)
                    ])
                    .save(outputPath)
                    .on('end', resolve)
                    .on('error', reject);
            });

            outBuffer = await fs.readFile(outputPath);
            if (outBuffer.length <= MAX_SIZE) {
                break;
            }

            quality = Math.max(15, quality - 15);
            fps = 12;
            maxDuration = 6;
        }

        const finalBuffer = await writeExif(outBuffer, options);
        finalBuffer.isAnimated = true;
        return finalBuffer;
    } finally {
        if (await fs.pathExists(inputPath)) await fs.unlink(inputPath);
        if (await fs.pathExists(outputPath)) await fs.unlink(outputPath);
    }
}

async function imageToSticker(inputBuffer, options = {}) {
    let webpBuffer;
    try {
        webpBuffer = await sharp(inputBuffer)
            .resize(512, 512, {
                fit: 'contain',
                background: { r: 0, g: 0, b: 0, alpha: 0 }
            })
            .webp({ quality: 80 })
            .toBuffer();
    } catch {
        const tempDir = path.join(process.cwd(), 'temp');
        await fs.ensureDir(tempDir);
        const id = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
        const inputPath = path.join(tempDir, `img_in_${id}`);
        const outputPath = path.join(tempDir, `img_out_${id}.webp`);
        await fs.writeFile(inputPath, inputBuffer);
        try {
            await new Promise((resolve, reject) => {
                ffmpeg(inputPath)
                    .videoFilter('scale=512:512:force_original_aspect_ratio=decrease,format=rgba,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=0x00000000')
                    .outputOptions(['-f webp', '-quality 80'])
                    .save(outputPath)
                    .on('end', resolve)
                    .on('error', reject);
            });
            webpBuffer = await fs.readFile(outputPath);
        } finally {
            if (await fs.pathExists(inputPath)) await fs.unlink(inputPath);
            if (await fs.pathExists(outputPath)) await fs.unlink(outputPath);
        }
    }

    const finalBuffer = await writeExif(webpBuffer, options);
    finalBuffer.isAnimated = false;
    return finalBuffer;
}

async function mediaToStickerBuffer(media, mediaType, options = {}) {
    const buffer = await downloadMediaBuffer(media, mediaType);
    const isVideo = mediaType === 'video' || (media.mimetype && (media.mimetype.includes('video') || media.mimetype.includes('gif')));
    
    if (mediaType === 'sticker') {
        const isAnim = !!media.isAnimated || buffer.indexOf(Buffer.from('ANIM')) !== -1;
        const finalBuffer = await writeExif(buffer, options);
        finalBuffer.isAnimated = isAnim;
        return finalBuffer;
    }

    if (isVideo) {
        return await videoToSticker(buffer, options);
    }

    return await imageToSticker(buffer, options);
}

module.exports = {
    extractQuotedMessage,
    extractMediaSource,
    downloadMediaBuffer,
    writeExif,
    videoToSticker,
    imageToSticker,
    mediaToStickerBuffer
};
