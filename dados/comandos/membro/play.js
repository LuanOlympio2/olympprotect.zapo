// creditos Olympio
const fs = require('fs-extra');
const path = require('path');
const { downloadAudio } = require('../../funções/ytdlpHelper');
const { buildDownloadCard } = require('../../funções/layout');

module.exports = {
    name: 'play',
    aliases: ['play', 'tocar', 'musica', 'music'],
    category: 'membros',
    run: async (conn, msg, config, args, sender, senderName) => {
        const from = msg.key.remoteJid;
        const prefix = config.prefix || '!';

        if (!args || args.length === 0) {
            return await conn.sendMessage(from, { text: `⚠️ Use: *${prefix}play nome da música* ou link direto.` }, { quoted: msg });
        }

        const query = args.join(' ').trim();
        await conn.sendMessage(from, { text: `🔍 Buscando música: *${query}*...` }, { quoted: msg });

        const tempDir = path.resolve(process.cwd(), 'temp');
        await fs.ensureDir(tempDir);

        const fileName = `music_${Date.now()}.mp3`;
        const outputPath = path.join(tempDir, fileName);

        try {
            const info = await downloadAudio(query, outputPath);

            const card = buildDownloadCard({
                title: info.title || query,
                icon: '🎵',
                source: info.source || 'YouTube Music',
                duration: info.duration || 'Normal',
                status: 'Enviando áudio MP3...'
            });

            await conn.sendMessage(from, { text: card }, { quoted: msg });

            const audioBuffer = await fs.readFile(outputPath);

            await conn.sendMessage(from, {
                audio: audioBuffer,
                mimetype: 'audio/mpeg',
                fileName: `${info.title || 'audio'}.mp3`,
                ptt: false
            }, { quoted: msg });

            await fs.unlink(outputPath).catch(() => {});
        } catch (error) {
            console.error('Erro no play:', error.message);
            await fs.unlink(outputPath).catch(() => {});
            await conn.sendMessage(from, {
                text: '❌ Erro ao baixar a música. Tente especificar mais termos ou enviar o link direto.'
            }, { quoted: msg });
        }
    }
};
