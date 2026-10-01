// creditos Olympio
const { isUserAdmin, isBotAdmin } = require('../../funções/normalizarid');
const aliases = ['linkgp', 'linkgrupo', 'convite'];
async function run(conn, msg, config, args, sender, senderName) {
    const from = msg.key.remoteJid;
    if (!from.endsWith('@g.us')) {
        return await conn.sendMessage(from, { text: '❌ Este comando só funciona em grupos!' }, { quoted: msg });
    }
    const groupMetadata = await conn.groupMetadata(from);
    if (!isUserAdmin(groupMetadata, sender)) {
        return await conn.sendMessage(from, { text: '❌ Apenas administradores podem usar este comando!' }, { quoted: msg });
    }
    if (!isBotAdmin(groupMetadata, conn.user.id)) {
        return await conn.sendMessage(from, { text: '❌ Preciso ser administrador para pegar o link do grupo!' }, { quoted: msg });
    }
    try {
        console.log(`[DEBUG LINKGP] Tentando obter código de convite para ${from}`);
        const code = await conn.groupInviteCode(from);
        console.log(`[DEBUG LINKGP] Código obtido: ${code}`);
        const link = `https://chat.whatsapp.com/${code}`;
        await conn.sendMessage(from, { text: `Aqui está: ${link}` }, { quoted: msg });
    } catch (e) {
        console.error("Erro ao pegar link do grupo:", e);
        await conn.sendMessage(from, { text: '❌ Erro ao obter o link do grupo. Verifique se sou admin.' }, { quoted: msg });
    }
}
module.exports = {
    run,
    aliases
};
