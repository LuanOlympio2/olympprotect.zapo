// creditos Olympio
const aliases = ['dono', 'owner'];
async function run(conn, msg, config, args, sender, senderName) {
    const from = msg.key.remoteJid;
    const ownerNumber = config.ownerNumber;
    const botName = config.botName || "OlympProtect";
    if (!ownerNumber) {
        return await conn.sendMessage(from, { text: '⚠️ O número do dono ainda não foi configurado.' }, { quoted: msg });
    }
    const vcard = 'BEGIN:VCARD\n' + 
                  'VERSION:3.0\n' + 
                  `FN:Dono do ${botName}\n` + 
                  `ORG:${botName} Corp;\n` +
                  `TEL;type=CELL;type=VOICE;waid=${ownerNumber}:${ownerNumber}\n` + 
                  'END:VCARD';
    await conn.sendMessage(from, { 
        contacts: { 
            displayName: 'Dono', 
            contacts: [{ vcard }] 
        }
    }, { quoted: msg });
    await conn.sendMessage(from, { 
        text: `👑 *Contato do Dono*\n\nOlá, ${senderName}! Acima está o contato do meu Dono. Caso precise de suporte ou queira relatar bugs, chame ele.`
    }, { quoted: msg });
}
module.exports = {
    run,
    aliases
};
