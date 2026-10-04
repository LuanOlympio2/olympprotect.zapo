const Grupo = require('../../modelos/grupos');
const { isUserAdmin, normalizeId } = require('../../funções/normalizarid');
const groupCache = require('../../funções/groupCache');
const aliases = ['rmlistanegra', 'unblacklist', 'rmblacklist'];
async function run(conn, msg, config, args, sender) {
    const from = msg.key.remoteJid;
    if (!from.endsWith('@g.us')) {
        return await conn.sendMessage(from, { text: '❌ Esse comando só funciona em grupos.' }, { quoted: msg });
    }
    const groupMetadata = await conn.groupMetadata(from).catch(() => null);
    if (!groupMetadata) {
        return await conn.sendMessage(from, { text: '❌ Erro ao obter dados do grupo.' }, { quoted: msg });
    }
    const rawSender = msg.key?.participant || sender;
    if (!isUserAdmin(groupMetadata, sender, conn) && !isUserAdmin(groupMetadata, rawSender, conn)) {
        return await conn.sendMessage(from, { text: '❌ Apenas administradores podem mexer na lista negra.' }, { quoted: msg });
    }
    let target;
    if (msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length > 0) {
        target = normalizeId(msg.message.extendedTextMessage.contextInfo.mentionedJid[0]);
    } else if (args.length > 0) {
        target = args.join('').replace(/[^0-9]/g, '');
    }
    if (!target) {
        return await conn.sendMessage(from, { text: '⚠️ Informe o número que deve sair da lista negra.' }, { quoted: msg });
    }
    try {
        const grupoDB = await Grupo.findOne({ groupId: from });
        if (!grupoDB?.listaNegra?.length) {
            return await conn.sendMessage(from, { text: '⚠️ A lista negra desse grupo está vazia.' }, { quoted: msg });
        }
        if (!grupoDB.listaNegra.includes(target)) {
            return await conn.sendMessage(from, { text: `⚠️ O número +${target} não está na lista negra.` }, { quoted: msg });
        }
        grupoDB.listaNegra = grupoDB.listaNegra.filter((numero) => numero !== target);
        await grupoDB.save();
        groupCache.del(from);
        await conn.sendMessage(from, {
            text: `✅ *Lista negra atualizada.*\n\n+${target} foi removido e pode entrar normalmente no grupo.`
        }, { quoted: msg });
    } catch (e) {
        console.error('Erro no comando rmlistanegra:', e);
        await conn.sendMessage(from, { text: '❌ Erro ao remover da lista negra.' }, { quoted: msg });
    }
}
module.exports = {
    run,
    aliases
};
