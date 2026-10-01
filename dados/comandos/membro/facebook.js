// creditos Olympio
const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs-extra');
const path = require('path');
const { getYtDlpBinary, getCookiesArg } = require('../../funções/ytdlpHelper');
const { buildDownloadCard } = require('../../funções/layout');
const execPromise = promisify(exec);

module.exports = {
    name: 'facebook',
    aliases: ['fb', 'face'],
    run: async (conn, msg, config, args, sender, senderName) => {
        const from = msg.key.remoteJid;
        const prefix = config.prefix || '!';
        if (!args[0] || (!args[0].includes('facebook.com') && !args[0].includes('fb.watch'))) {
            return await conn.sendMessage(from, { text: `⚠️ Envie o link do vídeo do Facebook: *${prefix}facebook <link>*` }, { quoted: msg });
        }
        try {
            await conn.sendMessage(from, { text: '📥 Processando vídeo do Facebook...' }, { quoted: msg });
            const rootDir = process.cwd();
            const tempDir = path.join(rootDir, 'temp');
            await fs.ensureDir(tempDir);

            const fileName = `fb_${Date.now()}.mp4`;
            const outputPath = path.join(tempDir, fileName);
            const bin = getYtDlpBinary();
            const cookies = getCookiesArg();

            const command = `${bin} -f "best[ext=mp4]/best" --no-playlist --force-overwrites ${cookies} -o "${outputPath}" "${args[0]}"`;
            await execPromise(command, { timeout: 90000 });

            if (!fs.existsSync(outputPath)) throw new Error('Falha no download.');

            const card = buildDownloadCard({
                title: 'FACEBOOK VIDEO',
                icon: '🟦',
                source: 'Facebook Watch / Reel',
                status: 'Download finalizado!'
            });

            await conn.sendMessage(from, {
                video: { url: outputPath },
                caption: card
            }, { quoted: msg });

            await fs.unlink(outputPath).catch(() => {});
        } catch (error) {
            console.error('Erro Facebook:', error.message);
            await conn.sendMessage(from, { text: '❌ Erro ao baixar, o vídeo pode ser privado ou estar em um grupo fechado.' }, { quoted: msg });
        }
    }
};
