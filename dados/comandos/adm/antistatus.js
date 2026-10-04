const Grupo = require('../../modelos/grupos');
const { isUserAdmin, isBotAdmin } = require('../../funções/normalizarid');
const groupCache = require('../../funções/groupCache');
const aliases = ['antistatus'];
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
                text: '⚠️ *Atenção:* Eu preciso ser Administrador do grupo para apagar mensagens e banir quem menciona status!\n\nMe dê admin e tente novamente.'
            }, { quoted: msg });
        }
        let grupoDB = await Grupo.findOne({ groupId: from });
        if (!grupoDB) {
            grupoDB = new Grupo({ groupId: from });
        }
        grupoDB.antistatus = !grupoDB.antistatus;
        await grupoDB.save();
        groupCache.del(from);
        const status = grupoDB.antistatus ? 'ATIVADO 🛡️' : 'DESATIVADO 🔓';
        await conn.sendMessage(from, { text: `Sistema Anti-Status foi ${status} neste grupo!` }, { quoted: msg });
    } catch (e) {
        console.error("Erro no comando antistatus:", e);
        await conn.sendMessage(from, { text: 'Erro ao salvar configuração.' }, { quoted: msg });
    }
}
module.exports = {
    run,
    aliases
};
