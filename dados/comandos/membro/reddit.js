// creditos Olympio
const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs-extra');
const path = require('path');
const { getYtDlpBinary, getCookiesArg } = require('../../funções/ytdlpHelper');
const { buildDownloadCard } = require('../../funções/layout');
const execPromise = promisify(exec);

module.exports = {
    name: 'reddit',
    aliases: ['reddit', 'rd'],
    run: async (conn, msg, config, args, sender, senderName) => {
        const from = msg.key.remoteJid;
        const prefix = config.prefix || '!';
        if (!args[0] || !args[0].includes('reddit.com')) {
            return await conn.sendMessage(from, { text: `⚠️ Envie o link do Reddit: *${prefix}reddit <link>*` }, { quoted: msg });
        }
        try {
            await conn.sendMessage(from, { text: '📥 Processando mídia do Reddit...' }, { quoted: msg });
            const rootDir = process.cwd();
            const tempDir = path.join(rootDir, 'temp');
            await fs.ensureDir(tempDir);

            const fileName = `reddit_${Date.now()}.mp4`;
            const outputPath = path.join(tempDir, fileName);
            const bin = getYtDlpBinary();
            const cookies = getCookiesArg();

            let command = `${bin} -f "best[ext=mp4]/best" --no-playlist --force-overwrites ${cookies} -o "${outputPath}" "${args[0]}"`;
            await execPromise(command, { timeout: 60000 });

            if (!fs.existsSync(outputPath)) throw new Error('Falha no download.');

            const stats = await fs.stat(outputPath);
            if (stats.size / (1024 * 1024) > 100) {
                await conn.sendMessage(from, { text: '⚠️ Arquivo muito grande, limite de 100MB excedido.' }, { quoted: msg });
                await fs.unlink(outputPath).catch(() => {});
                return;
            }

            const card = buildDownloadCard({
                title: 'REDDIT MEDIA',
                icon: '🤖',
                source: 'Reddit Video / Post',
                status: 'Download finalizado!'
            });

            await conn.sendMessage(from, {
                video: { url: outputPath },
                caption: card
            }, { quoted: msg });

            await fs.unlink(outputPath).catch(() => {});
        } catch (error) {
            console.error('Erro Reddit:', error.message);
            await conn.sendMessage(from, { text: '❌ Erro ao baixar do Reddit.' }, { quoted: msg });
        }
    }
};
