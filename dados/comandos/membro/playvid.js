// creditos Olympio
const fs = require('fs-extra');
const path = require('path');
const { downloadVideo } = require('../../funções/ytdlpHelper');
const { buildDownloadCard } = require('../../funções/layout');

module.exports = {
    name: 'playvid',
    aliases: ['playvid', 'video', 'ytv', 'mp4', 'youtube', 'yt'],
    run: async (conn, msg, config, args, sender, senderName) => {
        const from = msg.key.remoteJid;
        const prefix = config.prefix || '!';

        if (!args || args.length === 0) {
            return await conn.sendMessage(from, { text: `⚠️ Use: *${prefix}playvid nome do vídeo* ou link direto.` }, { quoted: msg });
        }

        const query = args.join(' ').trim();
        await conn.sendMessage(from, { text: `🔍 Buscando vídeo: *${query}*...` }, { quoted: msg });

        const tempDir = path.resolve(process.cwd(), 'temp');
        await fs.ensureDir(tempDir);

        const fileName = `vid_${Date.now()}.mp4`;
        const outputPath = path.join(tempDir, fileName);

        try {
            const info = await downloadVideo(query, outputPath);

            const card = buildDownloadCard({
                title: info.title || query,
                icon: '🎬',
                source: info.source || 'YouTube Video',
                duration: info.duration || 'Normal',
                status: 'Vídeo carregado com sucesso!'
            });

            await conn.sendMessage(from, {
                video: { url: outputPath },
                caption: card,
                gifPlayback: false
            }, { quoted: msg });

            await fs.unlink(outputPath).catch(() => {});
        } catch (error) {
            console.error('Erro playvid:', error.message);
            await fs.unlink(outputPath).catch(() => {});
            await conn.sendMessage(from, {
                text: '❌ Erro ao baixar o vídeo. Tente pesquisar com outro nome ou enviar o link direto.'
            }, { quoted: msg });
        }
    }
};
