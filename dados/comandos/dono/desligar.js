// creditos Olympio
const path = require('path');
const { isOwnerSender } = require(path.resolve(__dirname, '../../funções/ownerAuth'));
const aliases = ['desligar', 'off'];
async function run(conn, msg, config, args, sender, senderName) {
    const from = msg.key.remoteJid;
    const isOwner = isOwnerSender(config, sender, msg, conn);
    if (!isOwner) return;
    if (global.botOnline === false) {
        return await conn.sendMessage(from, { text: '💤 O bot já está desligado (Modo Standby).' }, { quoted: msg });
    }
    global.botOnline = false;
    await conn.sendMessage(from, { 
        text: '🔌 *Desligando Sistema...*\n\nO bot entrou em modo *Standby*. Ele ignorará todos os comandos até que você use o comando de ligar novamente.' 
    }, { quoted: msg });
    console.log(`[SISTEMA] Bot colocado em Standby por ${senderName}`);
}
module.exports = {
    run,
    aliases
};
