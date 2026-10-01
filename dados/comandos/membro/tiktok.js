// creditos Olympio
const { tiktokdl } = require('@tobyg74/tiktok-api-dl');
const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');
const { buildDownloadCard } = require('../../funções/layout');
module.exports = {
    name: 'tiktok',
    aliases: ['tiktok', 'tt', 'tikt'],
    run: async (conn, msg, config, args, sender, senderName) => {
        const from = msg.key.remoteJid;
        const prefix = config.prefix || '!';
        if (!args[0] || !args[0].match(/tiktok\.com/)) {
            return await conn.sendMessage(from, { text: `⚠️ Envie o link do TikTok.` }, { quoted: msg });
        }
        await conn.sendMessage(from, { text: '📥 Baixando...' }, { quoted: msg });
        const tempDir = path.resolve(process.cwd(), 'temp');
        await fs.ensureDir(tempDir);
        const outputPath = path.join(tempDir, `tiktok_${Date.now()}.mp4`);
        try {
            let videoUrl = null;
            try {
                const data = await tiktokdl(args[0]);
                if (data && data.video && (data.video.noWatermark || data.video.noWatermark2)) {
                    videoUrl = data.video.noWatermark || data.video.noWatermark2;
                }
            } catch (libError) {
            }
            if (!videoUrl) {
                try {
                    const { data } = await axios.post('https://www.tikwm.com/api/', {
                        url: args[0],
                        count: 12,
                        cursor: 0,
                        web: 1,
                        hd: 1
                    }, {
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                        }
                    });
                    if (data && data.data && data.data.play) {
                        videoUrl = data.data.play;
                        if (!videoUrl.startsWith('http')) {
                            videoUrl = `https://www.tikwm.com${videoUrl}`;
                        }
                    }
                } catch (apiError) {
                }
            }
            if (!videoUrl) {
                throw new Error('Falha ao obter link.');
            }
            const response = await axios({
                url: videoUrl,
                method: 'GET',
                responseType: 'arraybuffer'
            });
            const card = buildDownloadCard({
                title: 'TIKTOK VIDEO',
                icon: '🎵',
                source: 'TikTok (Sem Marca d\'Água)',
                status: 'Download finalizado!'
            });

            await conn.sendMessage(from, {
                video: await fs.readFile(outputPath),
                caption: card,
                gifPlayback: false
            }, { quoted: msg });
        } catch (error) {
            console.error(error);
            await conn.sendMessage(from, { text: '❌ Erro ao baixar o vídeo do TikTok. Verifique se o link está correto e público.' }, { quoted: msg });
        } finally {
            if (await fs.exists(outputPath)) {
                await fs.unlink(outputPath);
            }
        }
    }
};
