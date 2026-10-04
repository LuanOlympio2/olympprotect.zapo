// creditos Olympio
const Grupo = require('../../modelos/grupos');
const { isUserAdmin, isBotAdmin } = require('../../funções/normalizarid');
const groupCache = require('../../funções/groupCache');
const aliases = ['antiloc', 'antilocation'];
async function run(conn, msg, config, args, sender, senderName) {
    const from = msg.key.remoteJid;
    if (!from.endsWith('@g.us')) {
        return await conn.sendMessage(from, { text: '❌ Este comando só funciona em grupos!' }, { quoted: msg });
    }
    try {
        const groupMetadata = await conn.groupMetadata(from).catch(() => null);
        if (!groupMetadata) {
            return await conn.sendMessage(from, { text: '❌ Erro ao obter dados do grupo.' }, { quoted: msg });
        }
        const rawSender = msg.key?.participant || sender;
        if (!isUserAdmin(groupMetadata, sender, conn) && !isUserAdmin(groupMetadata, rawSender, conn)) {
            return await conn.sendMessage(from, { text: '❌ Apenas administradores podem usar este comando!' }, { quoted: msg });
        }
        if (!isBotAdmin(groupMetadata, conn)) {
            return await conn.sendMessage(from, {
                text: '⚠️ *Atenção:* Eu preciso ser Administrador do grupo para apagar mensagens e banir quem manda localização!\n\nMe dê admin e tente novamente.'
            }, { quoted: msg });
        }
        let grupoDB = await Grupo.findOne({ groupId: from });
        if (!grupoDB) {
            grupoDB = new Grupo({ groupId: from });
        }
        grupoDB.antiloc = !grupoDB.antiloc;
        await grupoDB.save();
        groupCache.del(from);
        const status = grupoDB.antiloc ? 'ATIVADO 🛡️' : 'DESATIVADO 🔓';
        await conn.sendMessage(from, { text: `Sistema Anti-Localização foi ${status} neste grupo!` }, { quoted: msg });
    } catch (e) {
        console.error("Erro no comando antiloc:", e);
        await conn.sendMessage(from, { text: 'Erro ao salvar configuração.' }, { quoted: msg });
    }
}
module.exports = {
    run,
    aliases
};
