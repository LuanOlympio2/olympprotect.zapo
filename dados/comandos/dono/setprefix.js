// creditos Olympio
const fs = require('fs-extra');
const path = require('path');
const { isOwnerSender } = require(path.resolve(__dirname, '../../funções/ownerAuth'));
const aliases = ['setprefix', 'prefixo', 'mudarprefixo'];
async function run(conn, msg, config, args, sender, senderName) {
    const from = msg.key.remoteJid;
    const isAllowed = isOwnerSender(config, sender, msg, conn);
    if (!isAllowed) {
        return await conn.sendMessage(from, { text: '❌ Apenas o dono pode alterar o prefixo.' }, { quoted: msg });
    }
    const newPrefix = args[0];
    if (!newPrefix) {
        return await conn.sendMessage(from, { text: `⚠️ Diga o novo prefixo.\nExemplo: *${config.prefix}setprefix .*` }, { quoted: msg });
    }
    if (newPrefix.length > 1) {
        return await conn.sendMessage(from, { text: '❌ O prefixo deve ser curto (1 caractere).' }, { quoted: msg });
    }
    try {
        const configPath = path.resolve(process.cwd(), 'config.json');
        const currentConfig = await fs.readJson(configPath);
        currentConfig.prefix = newPrefix;
        await fs.writeJson(configPath, currentConfig, { spaces: 2 });
        config.prefix = newPrefix;
        await conn.sendMessage(from, { text: `✅ Prefixo alterado para: *${newPrefix}*` }, { quoted: msg });
    } catch (e) {
        console.error("Erro ao salvar prefixo:", e);
        await conn.sendMessage(from, { text: '❌ Erro ao salvar no arquivo de configuração.' }, { quoted: msg });
    }
}
module.exports = {
    run,
    aliases
};
