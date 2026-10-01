// creditos Olympio
const Grupo = require('../../modelos/grupos');
const { isUserAdmin } = require('../../funções/normalizarid');
const aliases = ['antivisu', 'antiviewonce'];
async function run(conn, msg, config, args, sender, senderName) {
    const from = msg.key.remoteJid;
    if (!from.endsWith('@g.us')) {
        return await conn.sendMessage(from, { text: '❌ Este comando só funciona em grupos!' }, { quoted: msg });
    }
    const groupMetadata = await conn.groupMetadata(from);
    if (!isUserAdmin(groupMetadata, sender)) {
        return await conn.sendMessage(from, { text: '❌ Apenas administradores podem usar este comando!' }, { quoted: msg });
    }
    try {
        let grupoDB = await Grupo.findOne({ groupId: from });
        if (!grupoDB) {
            grupoDB = new Grupo({ groupId: from });
        }
        grupoDB.antivisu = !grupoDB.antivisu;
        await grupoDB.save();
        const status = grupoDB.antivisu ? 'ATIVADO 👁️' : 'DESATIVADO 🙈';
        await conn.sendMessage(from, { text: `Sistema Anti-Visualização Única foi ${status} neste grupo!\n\nTodas as mensagens de visualização única serão reveladas automaticamente.` }, { quoted: msg });
    } catch (e) {
        console.error("Erro no comando antivisu:", e);
        await conn.sendMessage(from, { text: 'Erro ao salvar configuração.' }, { quoted: msg });
    }
}
module.exports = {
    run,
    aliases
};
