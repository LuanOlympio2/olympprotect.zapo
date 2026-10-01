// creditos Olympio
const { tiktokdl } = require('@tobyg74/tiktok-api-dl');
const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');
const { downloadMediaGeneric } = require('./ytdlpHelper');

async function checkSize(filePath) {
    const stats = await fs.stat(filePath);
    const fileSizeInBytes = stats.size;
    const fileSizeInMegabytes = fileSizeInBytes / (1024 * 1024);
    return fileSizeInMegabytes <= 100;
}

const handleAutoDownload = async (conn, from, text, msg) => {
    const urlRegex = /((?:https?:\/\/)?(?:[\w-]+\.)*(?:instagram\.com|tiktok\.com|twitter\.com|x\.com|pinterest\.com|pin\.it|youtu\.be|youtube\.com|reddit\.com)\/[^\s]+)/gi;
    const matches = text.match(urlRegex);
    if (!matches) return;
    let url = matches[0];
    if (!url.startsWith('http')) {
        url = 'https://' + url;
    }
    const tempDir = path.resolve(process.cwd(), 'temp');
    await fs.ensureDir(tempDir);

    try {
        if (url.includes('tiktok.com')) {
            await downloadTikTok(conn, from, url, msg, tempDir);
        } else if (url.includes('instagram.com')) {
            await downloadInstagram(conn, from, url, msg, tempDir);
        } else if (url.includes('twitter.com') || url.includes('x.com')) {
            await downloadTwitter(conn, from, url, msg, tempDir);
        } else if (url.includes('pinterest.com') || url.includes('pin.it')) {
            await downloadPinterest(conn, from, url, msg, tempDir);
        } else if (url.includes('youtube.com') || url.includes('youtu.be')) {
            await downloadYouTube(conn, from, url, msg, tempDir);
        } else if (url.includes('reddit.com')) {
            await downloadReddit(conn, from, url, msg, tempDir);
        }
    } catch (e) {
        console.error('Erro no AutoDL:', e);
    }
};

async function downloadTikTok(conn, from, url, msg, tempDir) {
    await conn.sendMessage(from, { react: { text: '⬇️', key: msg.key } });
    const outputPath = path.join(tempDir, `tiktok_${Date.now()}.mp4`);
    try {
        let videoUrl = null;
        try {
            const data = await tiktokdl(url);
            if (data && data.video && (data.video.noWatermark || data.video.noWatermark2)) {
                videoUrl = data.video.noWatermark || data.video.noWatermark2;
            }
        } catch (_) {}
        if (!videoUrl) {
            const { data } = await axios.post('https://www.tikwm.com/api/', {
                url: url, count: 12, cursor: 0, web: 1, hd: 1
            }, { headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' } });
            if (data?.data?.play) videoUrl = data.data.play.startsWith('http') ? data.data.play : `https://www.tikwm.com${data.data.play}`;
        }
        if (!videoUrl) throw new Error('Vídeo do TikTok não encontrado.');

        const response = await axios({
            method: 'get',
            url: videoUrl,
            responseType: 'stream'
        });
        const writer = fs.createWriteStream(outputPath);
        response.data.pipe(writer);

        await new Promise((resolve, reject) => {
            writer.on('finish', resolve);
            writer.on('error', reject);
        });

        if (!(await checkSize(outputPath))) {
            await conn.sendMessage(from, { text: '⚠️ Arquivo muito grande, limite de 100MB excedido.' }, { quoted: msg });
            return;
        }

        await conn.sendMessage(from, { video: { url: outputPath }, caption: '📱 TikTok AutoDL' }, { quoted: msg });
        await conn.sendMessage(from, { react: { text: '✅', key: msg.key } });
    } catch (e) {
        console.error('Erro TikTok AutoDL:', e);
        await conn.sendMessage(from, { react: { text: '❌', key: msg.key } });
    } finally {
        if (await fs.exists(outputPath)) await fs.unlink(outputPath);
    }
}

async function downloadInstagram(conn, from, url, msg, tempDir) {
    await conn.sendMessage(from, { react: { text: '⬇️', key: msg.key } });
    const outputPath = path.join(tempDir, `insta_${Date.now()}.mp4`);
    try {
        await downloadMediaGeneric(url, outputPath, 'video');
        if (!fs.existsSync(outputPath)) throw new Error('Falha no download Instagram');
        if (!(await checkSize(outputPath))) {
            await conn.sendMessage(from, { text: '⚠️ Arquivo muito grande, limite de 100MB excedido.' }, { quoted: msg });
            return;
        }
        await conn.sendMessage(from, { video: { url: outputPath }, caption: '📸 Instagram AutoDL' }, { quoted: msg });
        await conn.sendMessage(from, { react: { text: '✅', key: msg.key } });
    } catch (e) {
        console.error('Erro Instagram AutoDL:', e);
        await conn.sendMessage(from, { react: { text: '❌', key: msg.key } });
    } finally {
        if (await fs.exists(outputPath)) await fs.unlink(outputPath);
    }
}

async function downloadTwitter(conn, from, url, msg, tempDir) {
    await conn.sendMessage(from, { react: { text: '⬇️', key: msg.key } });
    const outputPath = path.join(tempDir, `twitter_${Date.now()}.mp4`);
    try {
        await downloadMediaGeneric(url, outputPath, 'video');
        if (!fs.existsSync(outputPath)) throw new Error('Falha no download Twitter');
        if (!(await checkSize(outputPath))) {
            await conn.sendMessage(from, { text: '⚠️ Arquivo muito grande, limite de 100MB excedido.' }, { quoted: msg });
            return;
        }
        await conn.sendMessage(from, { video: { url: outputPath }, caption: '🐦 Twitter ou X AutoDL' }, { quoted: msg });
        await conn.sendMessage(from, { react: { text: '✅', key: msg.key } });
    } catch (e) {
        console.error('Erro Twitter AutoDL:', e);
        await conn.sendMessage(from, { react: { text: '❌', key: msg.key } });
    } finally {
        if (await fs.exists(outputPath)) await fs.unlink(outputPath);
    }
}

async function downloadPinterest(conn, from, url, msg, tempDir) {
    await conn.sendMessage(from, { react: { text: '⬇️', key: msg.key } });
    const outputPath = path.join(tempDir, `pin_${Date.now()}.mp4`);
    try {
        await downloadMediaGeneric(url, outputPath, 'video');
        if (!fs.existsSync(outputPath)) throw new Error('Falha no download Pinterest');
        if (!(await checkSize(outputPath))) {
            await conn.sendMessage(from, { text: '⚠️ Arquivo muito grande, limite de 100MB excedido.' }, { quoted: msg });
            return;
        }
        await conn.sendMessage(from, { video: { url: outputPath }, caption: '📌 Pinterest AutoDL' }, { quoted: msg });
        await conn.sendMessage(from, { react: { text: '✅', key: msg.key } });
    } catch (e) {
        console.error('Erro Pinterest AutoDL:', e);
        await conn.sendMessage(from, { react: { text: '❌', key: msg.key } });
    } finally {
        if (await fs.exists(outputPath)) await fs.unlink(outputPath);
    }
}

async function downloadYouTube(conn, from, url, msg, tempDir) {
    await conn.sendMessage(from, { react: { text: '⬇️', key: msg.key } });
    const outputPath = path.join(tempDir, `yt_${Date.now()}.mp4`);
    try {
        await downloadMediaGeneric(url, outputPath, 'video');
        if (!fs.existsSync(outputPath)) throw new Error('Falha no download YouTube');
        if (!(await checkSize(outputPath))) {
            await conn.sendMessage(from, { text: '⚠️ Arquivo muito grande, limite de 100MB excedido.' }, { quoted: msg });
            return;
        }
        await conn.sendMessage(from, { video: { url: outputPath }, caption: '📺 YouTube AutoDL' }, { quoted: msg });
        await conn.sendMessage(from, { react: { text: '✅', key: msg.key } });
    } catch (e) {
        console.error('Erro YouTube AutoDL:', e);
        await conn.sendMessage(from, { react: { text: '❌', key: msg.key } });
    } finally {
        if (await fs.exists(outputPath)) await fs.unlink(outputPath);
    }
}

async function downloadReddit(conn, from, url, msg, tempDir) {
    await conn.sendMessage(from, { react: { text: '⬇️', key: msg.key } });
    const outputPath = path.join(tempDir, `reddit_${Date.now()}.mp4`);
    try {
        await downloadMediaGeneric(url, outputPath, 'video');
        if (!fs.existsSync(outputPath)) throw new Error('Falha no download Reddit');
        if (!(await checkSize(outputPath))) {
            await conn.sendMessage(from, { text: '⚠️ Arquivo muito grande, limite de 100MB excedido.' }, { quoted: msg });
            return;
        }
        await conn.sendMessage(from, { video: { url: outputPath }, caption: '🤖 Reddit AutoDL' }, { quoted: msg });
        await conn.sendMessage(from, { react: { text: '✅', key: msg.key } });
    } catch (e) {
        console.error('Erro Reddit AutoDL:', e);
        await conn.sendMessage(from, { react: { text: '❌', key: msg.key } });
    } finally {
        if (await fs.exists(outputPath)) await fs.unlink(outputPath);
    }
}

module.exports = { handleAutoDownload };
