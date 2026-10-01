// creditos Olympio
const path = require('path');
const { isOwnerSender } = require(path.resolve(__dirname, '../../funções/ownerAuth'));
const aliases = ['ligar', 'on'];
async function run(conn, msg, config, args, sender, senderName) {
    const from = msg.key.remoteJid;
    const isOwner = isOwnerSender(config, sender, msg, conn);
    if (!isOwner) return;
    if (global.botOnline === true) {
        return await conn.sendMessage(from, { text: '⚡ O bot já está ligado e operando!' }, { quoted: msg });
    }
    global.botOnline = true;
    await conn.sendMessage(from, { 
        text: '⚡ *SISTEMA REINICIADO*\n\nO bot está online novamente e respondendo a todos os comandos.' 
    }, { quoted: msg });
    console.log(`[SISTEMA] Bot reativado por ${senderName}`);
}
module.exports = {
    run,
    aliases
};
