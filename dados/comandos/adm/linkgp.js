const { isUserAdmin, isBotAdmin } = require('../../funções/normalizarid');
const aliases = ['linkgp', 'linkgrupo', 'convite'];
async function run(conn, msg, config, args, sender, senderName) {
    const from = msg.key.remoteJid;
    if (!from.endsWith('@g.us')) {
        return await conn.sendMessage(from, { text: '❌ Este comando só funciona em grupos!' }, { quoted: msg });
    }
    const groupMetadata = await conn.groupMetadata(from).catch(() => null);
    if (!groupMetadata) {
        return await conn.sendMessage(from, { text: '❌ Erro ao obter dados do grupo.' }, { quoted: msg });
    }
    const rawSender = msg.key?.participant || sender;
    if (!isUserAdmin(groupMetadata, sender, conn) && !isUserAdmin(groupMetadata, rawSender, conn)) {
        return await conn.sendMessage(from, { text: '❌ Apenas administradores podem usar este comando!' }, { quoted: msg });
    }
    if (!isBotAdmin(groupMetadata, conn)) {
        return await conn.sendMessage(from, { text: '❌ Preciso ser administrador para pegar o link do grupo!' }, { quoted: msg });
    }
    try {
        const code = await conn.groupInviteCode(from);
        const link = `https://chat.whatsapp.com/${code}`;
        await conn.sendMessage(from, { text: `Aqui está o link do grupo: ${link}` }, { quoted: msg });
    } catch (e) {
        console.error("Erro ao pegar link do grupo:", e);
        await conn.sendMessage(from, { text: '❌ Erro ao obter o link do grupo. Verifique se sou admin.' }, { quoted: msg });
    }
}
module.exports = {
    run,
    aliases
};
