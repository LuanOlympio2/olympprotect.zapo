// creditos Olympio
const Grupo = require('../../modelos/grupos');
const groupCache = require('../../funções/groupCache');
const { isUserAdmin } = require('../../funções/normalizarid');
const { isOwnerSender } = require('../../funções/ownerAuth');

const aliases = ['soadm', 'onlyadmin', 'soadmin', 'onlyadm', 'somenteadm'];

async function run(conn, msg, config, args, sender, senderName) {
    const from = msg.key.remoteJid;
    if (!from.endsWith('@g.us')) {
        return await conn.sendMessage(from, { text: '❌ Este comando só funciona em grupos!' }, { quoted: msg });
    }
    try {
        const groupMetadata = await conn.groupMetadata(from);
        const isAdmin = isUserAdmin(groupMetadata, sender, conn);
        const isOwner = isOwnerSender(config, sender, msg, conn);
        if (!isAdmin && !isOwner) {
            return await conn.sendMessage(from, { text: '❌ Apenas administradores podem usar este comando!' }, { quoted: msg });
        }
        let grupoDB = await Grupo.findOne({ groupId: from });
        if (!grupoDB) {
            grupoDB = new Grupo({ groupId: from });
        }
        grupoDB.soadm = !grupoDB.soadm;
        await grupoDB.save();
        groupCache.del(from);
        const status = grupoDB.soadm ? 'ATIVADO 🛡️' : 'DESATIVADO 🔓';
        const mensagem = grupoDB.soadm
            ? '🔒 *Modo Só Administradores ATIVADO!*\n\nApenas administradores poderão usar comandos do bot neste grupo.'
            : '🔓 *Modo Só Administradores DESATIVADO!*\n\nTodos os membros podem usar comandos do bot novamente.';
        await conn.sendMessage(from, { text: mensagem }, { quoted: msg });
    } catch (e) {
        console.error("Erro no comando soadm:", e);
        await conn.sendMessage(from, { text: 'Erro ao salvar configuração.' }, { quoted: msg });
    }
}

module.exports = {
    run,
    aliases
};
