// creditos Olympio
const fs = require('fs-extra');
const path = require('path');
const { downloadMediaGeneric } = require('../../funções/ytdlpHelper');
const { buildDownloadCard } = require('../../funções/layout');

module.exports = {
    name: 'instagram',
    aliases: ['instagram', 'insta', 'ig', 'reels'],
    run: async (conn, msg, config, args, sender, senderName) => {
        const from = msg.key.remoteJid;
        const prefix = config.prefix || '!';

        if (!args[0] || !args[0].includes('instagram.com')) {
            return await conn.sendMessage(from, { text: `⚠️ Envie o link do post/reels do Instagram: *${prefix}instagram <link>*` }, { quoted: msg });
        }

        try {
            await conn.sendMessage(from, { text: '📥 Processando mídia do Instagram...' }, { quoted: msg });

            const rootDir = process.cwd();
            const tempDir = path.join(rootDir, 'temp');
            await fs.ensureDir(tempDir);

            const fileName = `insta_${Date.now()}.mp4`;
            const outputPath = path.join(tempDir, fileName);

            await downloadMediaGeneric(args[0], outputPath, 'video');

            if (!fs.existsSync(outputPath)) {
                throw new Error('Falha no download.');
            }

            const card = buildDownloadCard({
                title: 'INSTAGRAM MEDIA',
                icon: '📸',
                source: 'Instagram Reels / Post',
                status: 'Download concluído!'
            });

            await conn.sendMessage(from, {
                video: { url: outputPath },
                caption: card
            }, { quoted: msg });

            await fs.unlink(outputPath).catch(() => {});
        } catch (error) {
            console.error('Erro Instagram:', error.message);
            const errorMsg = '❌ Não foi possível baixar do Instagram. O perfil pode ser privado ou a mídia indisponível sem login.';
            await conn.sendMessage(from, { text: errorMsg }, { quoted: msg });
        }
    }
};
