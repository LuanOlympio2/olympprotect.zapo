const path = require('path');
const fs = require('fs-extra');
const { exec } = require('child_process');
const { promisify } = require('util');
const { isOwnerSender } = require('../../funções/ownerAuth');

const execPromise = promisify(exec);

const aliases = ['update', 'atualizar', 'upgrade', 'gitupdate'];

async function run(conn, msg, config, args, sender, senderName) {
    const from = msg.key.remoteJid;
    const isOwner = isOwnerSender(config, sender, msg, conn);
    if (!isOwner) {
        return await conn.sendMessage(from, { text: '❌ Apenas o dono pode usar este comando.' }, { quoted: msg });
    }

    await conn.sendMessage(from, { text: '🔄 Conectando ao GitHub e baixando atualizações...' }, { quoted: msg });

    try {
        let repo = 'LuanOlympio2/OlympProtect';
        try {
            const pkgPath = path.join(process.cwd(), 'package.json');
            if (fs.existsSync(pkgPath)) {
                const pkg = fs.readJsonSync(pkgPath);
                if (pkg.name && pkg.name.includes('zapo')) {
                    repo = 'LuanOlympio2/olympprotect.zapo';
                }
            }
        } catch (_) {}

        let updated = false;
        let updateMethod = '';

        if (fs.existsSync(path.join(process.cwd(), '.git'))) {
            try {
                const { stdout } = await execPromise('git pull origin main', { timeout: 60000 });
                updated = true;
                updateMethod = 'Git Pull';
                console.log('[UPDATE]', stdout);
            } catch (gitErr) {
                console.warn('[UPDATE] git pull falhou, tentando download direto:', gitErr.message);
            }
        }

        if (!updated) {
            const archiveUrl = `https://codeload.github.com/${repo}/tar.gz/refs/heads/main`;
            const extractCmd = `curl -sL "${archiveUrl}" | tar -xzf - --strip-components=1 --exclude="*config.json" --exclude="*apis.json" --exclude="*auth_*" --exclude="*dados/database*" --exclude="*cookies.txt"`;
            await execPromise(extractCmd, { timeout: 120000 });
            updated = true;
            updateMethod = 'GitHub Archive';
        }

        const localYtdlp = path.join(process.cwd(), 'yt-dlp');
        if (fs.existsSync(localYtdlp)) {
            try {
                fs.chmodSync(localYtdlp, 0o755);
            } catch (_) {}
        }

        await conn.sendMessage(from, {
            text: `✅ *Atualização concluída com sucesso!*\n\n📦 *Repositório:* ${repo}\n⚙️ *Método:* ${updateMethod}\n🔄 *Reiniciando o bot agora...*`
        }, { quoted: msg });

        setTimeout(() => {
            process.exit(0);
        }, 2000);

    } catch (e) {
        console.error('Erro na atualização:', e);
        await conn.sendMessage(from, {
            text: `❌ *Falha ao atualizar o bot:*\n\`\`\`${e.message}\`\`\``
        }, { quoted: msg });
    }
}

module.exports = {
    name: "update",
    aliases,
    category: "dono",
    description: "Atualiza o bot a partir do repositório no GitHub.",
    run
};
