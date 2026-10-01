// creditos Olympio
const { buildPrefixCard, safeSendMenu } = require('../../funções/layout');

const aliases = ['prefixo', 'prefix', 'qualprefixo'];

async function run(conn, msg, config, args, sender, senderName) {
    const from = msg.key.remoteJid;
    const prefix = config.prefix || '+';
    const text = buildPrefixCard(prefix, config.botName || 'OlympProtect');
    await safeSendMenu(conn, from, text, msg, []);
}

module.exports = {
    run,
    aliases
};
