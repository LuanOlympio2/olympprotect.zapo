// creditos Olympio
const Grupo = require('../../modelos/grupos');
const { isUserAdmin } = require('../../funções/normalizarid');
const aliases = ['verlistanegra', 'listanegralist', 'blacklistview', 'banlistview'];
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
        const grupoDB = await Grupo.findOne({ groupId: from });
        if (!grupoDB || !grupoDB.listaNegra || grupoDB.listaNegra.length === 0) {
            return await conn.sendMessage(from, { text: '📋 *Lista Negra do Grupo*\n\nNenhum usuário na lista negra.' }, { quoted: msg });
        }
        let texto = `🚫 *LISTA NEGRA DO GRUPO*\n\nTotal: ${grupoDB.listaNegra.length} usuários\n\n`;
        grupoDB.listaNegra.forEach((numero, index) => {
            texto += `${index + 1}. +${numero}\n`;
        });
        texto += `\nUse *!rmlistanegra <numero>* para remover.`;
        await conn.sendMessage(from, { text: texto }, { quoted: msg });
    } catch (e) {
        console.error("Erro no comando verlistanegra:", e);
        await conn.sendMessage(from, { text: '❌ Erro ao buscar lista negra.' }, { quoted: msg });
    }
}
module.exports = {
    run,
    aliases
};
