const Grupo = require('../../modelos/grupos');
const { isUserAdmin } = require('../../funções/normalizarid');
const { isOwnerSender } = require('../../funções/ownerAuth');
const groupCache = require('../../funções/groupCache');

const aliases = ['modorpg', 'rpgmodo'];

async function run(conn, msg, config, args, sender, senderName) {
    const from = msg.key.remoteJid;
    const prefix = config.prefix || '!';

    if (!from.endsWith('@g.us')) {
        return await conn.sendMessage(from, { text: '❌ Este comando só funciona em grupos!' }, { quoted: msg });
    }

    try {
        const groupMetadata = await conn.groupMetadata(from).catch(() => null);
        if (!groupMetadata) {
            return await conn.sendMessage(from, { text: '❌ Erro ao obter dados do grupo.' }, { quoted: msg });
        }
        const rawSender = msg.key?.participant || sender;
        const isAdmin = isUserAdmin(groupMetadata, sender, conn) || isUserAdmin(groupMetadata, rawSender, conn);
        const isOwner = isOwnerSender(config, sender, msg, conn);

        if (!isAdmin && !isOwner) {
            return await conn.sendMessage(from, { text: '❌ Apenas administradores podem ativar ou desativar o Modo RPG!' }, { quoted: msg });
        }

        let grupoDB = await Grupo.findOne({ groupId: from });
        if (!grupoDB) {
            grupoDB = new Grupo({ groupId: from });
        }

        grupoDB.modorpg = !grupoDB.modorpg;

        await grupoDB.save();
        groupCache.del(from);

        const status = grupoDB.modorpg ? 'ATIVADO ⚔️' : 'DESATIVADO 🛡️';
        const msgTexto = grupoDB.modorpg
            ? `🗡️ *MODO RPG ${status}*\n\nAgora os membros podem explorar reinos, viajar, trabalhar, cuidar de plantações, duelar e muito mais neste grupo!\n\nDigite *${prefix}menurpg* para ver os comandos disponíveis.`
            : `🛡️ *MODO RPG ${status}*\n\nOs comandos de RPG foram desativados temporariamente neste grupo pelos administradores.`;

        await conn.sendMessage(from, { text: msgTexto }, { quoted: msg });
    } catch (e) {
        console.error("Erro no comando modorpg:", e);
        await conn.sendMessage(from, { text: '❌ Erro ao salvar configuração do Modo RPG.' }, { quoted: msg });
    }
}

module.exports = {
    run,
    aliases
};
