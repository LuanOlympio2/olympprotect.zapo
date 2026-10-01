// creditos Olympio
const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs-extra');
const path = require('path');
const { getYtDlpBinary, getCookiesArg } = require('../../funções/ytdlpHelper');
const { buildDownloadCard } = require('../../funções/layout');
const execPromise = promisify(exec);

module.exports = {
    name: 'twitter',
    aliases: ['tw', 'x'],
    run: async (conn, msg, config, args, sender, senderName) => {
        const from = msg.key.remoteJid;
        const prefix = config.prefix || '!';
        if (!args[0] || (!args[0].includes('twitter.com') && !args[0].includes('x.com'))) {
            return await conn.sendMessage(from, { text: `⚠️ Envie o link do Twitter ou X: *${prefix}x <link>*` }, { quoted: msg });
        }
        try {
            await conn.sendMessage(from, { text: '📥 Processando mídia do X / Twitter...' }, { quoted: msg });
            const rootDir = process.cwd();
            const tempDir = path.join(rootDir, 'temp');
            await fs.ensureDir(tempDir);

            const fileName = `twitter_${Date.now()}.mp4`;
            const outputPath = path.join(tempDir, fileName);
            const bin = getYtDlpBinary();
            const cookies = getCookiesArg();

            const command = `${bin} -f "best[ext=mp4]/best" --no-playlist --force-overwrites ${cookies} -o "${outputPath}" "${args[0]}"`;
            await execPromise(command, { timeout: 60000 });

            if (!fs.existsSync(outputPath)) throw new Error('Falha no download.');

            const card = buildDownloadCard({
                title: 'X / TWITTER MEDIA',
                icon: '🐦',
                source: 'X / Twitter Post',
                status: 'Download finalizado com sucesso!'
            });

            await conn.sendMessage(from, {
                video: { url: outputPath },
                caption: card
            }, { quoted: msg });

            await fs.unlink(outputPath).catch(() => {});
        } catch (error) {
            console.error('Erro Twitter:', error.message);
            await conn.sendMessage(from, { text: '❌ Erro ao baixar.' }, { quoted: msg });
        }
    }
};
