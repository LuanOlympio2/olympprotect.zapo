// creditos Olympio
const Grupo = require('../../modelos/grupos');
const { isUserAdmin, isBotAdmin } = require('../../funções/normalizarid');
const aliases = ['antifoto', 'antiimage'];
async function run(conn, msg, config, args, sender, senderName) {
    const from = msg.key.remoteJid;
    if (!from.endsWith('@g.us')) {
        return await conn.sendMessage(from, { text: '❌ Este comando só funciona em grupos!' }, { quoted: msg });
    }
    try {
        const groupMetadata = await conn.groupMetadata(from);
        if (!isUserAdmin(groupMetadata, sender)) {
            return await conn.sendMessage(from, { text: '❌ Apenas administradores podem usar este comando!' }, { quoted: msg });
        }
        if (!isBotAdmin(groupMetadata, conn.user.id)) {
            return await conn.sendMessage(from, {
                text: '⚠️ *Atenção:* Eu preciso ser Administrador do grupo para apagar mensagens!\n\nMe dê admin e tente novamente.'
            }, { quoted: msg });
        }
        let grupoDB = await Grupo.findOne({ groupId: from });
        if (!grupoDB) {
            grupoDB = new Grupo({ groupId: from });
        }
        grupoDB.antifoto = !grupoDB.antifoto;
        await grupoDB.save();
        const status = grupoDB.antifoto ? 'ATIVADO 🛡️' : 'DESATIVADO 🔓';
        await conn.sendMessage(from, { text: `Sistema Anti-Foto foi ${status} neste grupo!` }, { quoted: msg });
    } catch (e) {
        console.error("Erro no comando antifoto:", e);
        await conn.sendMessage(from, { text: 'Erro ao salvar configuração.' }, { quoted: msg });
    }
}
module.exports = {
    run,
    aliases
};
