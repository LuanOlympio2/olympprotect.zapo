const Grupo = require('../../modelos/grupos');
const { isUserAdmin, isBotNumber, isOwnerNumber, normalizeId } = require('../../funções/normalizarid');
const groupCache = require('../../funções/groupCache');
const aliases = ['listanegra', 'blacklist', 'banlist'];
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
        target = msg.message.extendedTextMessage.contextInfo.mentionedJid[0];
    } else if (msg.message?.extendedTextMessage?.contextInfo?.participant) {
        target = msg.message.extendedTextMessage.contextInfo.participant;
    } else if (args.length > 0) {
        target = args.join('').replace(/[^0-9]/g, '');
    }
    if (target && target.includes('@lid')) {
        const found = (groupMetadata.participants || []).find((p) => p.lid === target);
        if (found) {
            target = found.id || found.jid;
        }
    }
    if (target) {
        target = normalizeId(target);
    }
    if (!target) {
        return await conn.sendMessage(from, {
            text: '⚠️ Marque, responda ou envie o número para adicionar à lista negra.'
        }, { quoted: msg });
    }
    if (target.length < 7 || target.length > 15) {
        return await conn.sendMessage(from, { text: '❌ Número inválido. Confira e tente novamente.' }, { quoted: msg });
    }
    if (isBotNumber(target, conn)) {
        return await conn.sendMessage(from, { text: '❌ Eu não posso me jogar na lista negra.' }, { quoted: msg });
    }
    if (isOwnerNumber(target)) {
        return await conn.sendMessage(from, { text: '❌ O dono do bot não pode ser adicionado à lista negra.' }, { quoted: msg });
    }
    try {
        let grupoDB = await Grupo.findOne({ groupId: from });
        if (!grupoDB) {
            grupoDB = new Grupo({ groupId: from });
        }
        if (!grupoDB.listaNegra) {
            grupoDB.listaNegra = [];
        }
        if (grupoDB.listaNegra.includes(target)) {
            return await conn.sendMessage(from, {
                text: `⚠️ O número +${target} já está na lista negra deste grupo.`
            }, { quoted: msg });
        }
        grupoDB.listaNegra.push(target);
        await grupoDB.save();
        groupCache.del(from);
        await conn.sendMessage(from, {
            text: `🚫 *Lista negra atualizada.*\n\n+${target} foi adicionado e será removido automaticamente se entrar no grupo.`
        }, { quoted: msg });
        const participants = (groupMetadata.participants || []).map((p) => normalizeId(p.id || p.jid));
        if (participants.includes(target)) {
            await conn.groupParticipantsUpdate(from, [`${target}@s.whatsapp.net`], 'remove');
            await conn.sendMessage(from, { text: '🔨 O alvo estava no grupo e foi removido na hora.' }, { quoted: msg });
        }
    } catch (e) {
        console.error('Erro no comando listanegra:', e);
        await conn.sendMessage(from, { text: '❌ Erro ao salvar na lista negra.' }, { quoted: msg });
    }
}
module.exports = {
    run,
    aliases
};
