// creditos Olympio
const aliases = ['criador', 'developer', 'luanOlympio'];
async function run(conn, msg, config, args, sender, senderName) {
    const from = msg.key.remoteJid;
    const creatorNumber = config.ownerNumber || ''; 
    const creatorName = 'Desenvolvedor Bot'; 
    if (!creatorNumber) {
        return await conn.sendMessage(from, { text: '⚠️ O número do desenvolvedor/dono ainda não foi configurado.' }, { quoted: msg });
    }
    const vcard = 'BEGIN:VCARD\n' + 
                  'VERSION:3.0\n' + 
                  `FN:${creatorName}\n` + 
                  `ORG:Desenvolvedor OlympProtect;\n` + 
                  `TEL;type=CELL;type=VOICE;waid=${creatorNumber}:${creatorNumber}\n` + 
                  'END:VCARD';
    await conn.sendMessage(from, { 
        contacts: { 
            displayName: creatorName, 
            contacts: [{ vcard }] 
        }
    }, { quoted: msg });
    await conn.sendMessage(from, { 
        text: `🛠️ *Contato do Desenvolvedor*\n\nEste é o número do criador oficial do sistema. Entre em contato apenas para:\n\n✅ Relatar Bugs/Erros\n✅ Sugerir Melhorias\n✅ Contratar serviços de Dev`
    }, { quoted: msg });
}
module.exports = {
    run,
    aliases
};
