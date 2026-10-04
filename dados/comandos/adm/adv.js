// creditos Olympio
const Grupo = require('../../modelos/grupos');
const { isUserAdmin, normalizeId, isBotAdmin } = require('../../funções/normalizarid');
const groupCache = require('../../funções/groupCache');
const aliases = ['adv', 'advertencia', 'warn'];
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
        return await conn.sendMessage(from, { text: '❌ Apenas administradores podem aplicar advertência.' }, { quoted: msg });
    }
    let target;
    if (msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length > 0) {
        target = msg.message.extendedTextMessage.contextInfo.mentionedJid[0];
    } else if (msg.message?.extendedTextMessage?.contextInfo?.participant) {
        target = msg.message.extendedTextMessage.contextInfo.participant;
    } else if (args[0]) {
        const cleanArg = args[0].replace(/[^0-9]/g, '');
        if (cleanArg.length >= 7) {
            target = `${cleanArg}@s.whatsapp.net`;
        }
    }
    if (!target) {
        return await conn.sendMessage(from, { text: `⚠️ Marque alguém, responda a mensagem ou use: ${config.prefix}adv 551199999999` }, { quoted: msg });
    }
    const { compareIds, findParticipant, isBotNumber } = require('../../funções/normalizarid');
    if (compareIds(target, sender) || compareIds(target, rawSender)) {
        return await conn.sendMessage(from, { text: '❌ Você não pode advertir a si mesmo.' }, { quoted: msg });
    }
    if (isBotNumber(target, conn)) {
        return await conn.sendMessage(from, { text: '❌ Eu não posso me advertir.' }, { quoted: msg });
    }
    const targetParticipant = findParticipant(groupMetadata.participants, target);
    if (targetParticipant && (['admin', 'superadmin'].includes(targetParticipant.admin) || targetParticipant.isAdmin === true || targetParticipant.isSuperAdmin === true)) {
        return await conn.sendMessage(from, { text: '❌ Não é possível advertir outro administrador.' }, { quoted: msg });
    }
    const targetPhone = targetParticipant?.phoneNumber || (!String(target).includes('@lid') ? target : null);
    const targetId = normalizeId(targetPhone || target);
    try {
        let grupoDB = await Grupo.findOne({ groupId: from });
        if (!grupoDB) {
            grupoDB = new Grupo({ groupId: from });
        }
        if (!grupoDB.advertencias) {
            grupoDB.advertencias = [];
        }
        let userWarn = grupoDB.advertencias.find((warn) => normalizeId(warn.userId) === targetId);
        if (!userWarn) {
            userWarn = { userId: targetId, count: 0 };
            grupoDB.advertencias.push(userWarn);
        }
        userWarn.count += 1;
        if (userWarn.count >= 3) {
            if (!isBotAdmin(groupMetadata, conn)) {
                await conn.sendMessage(from, {
                    text: '⚠️ O alvo chegou em 3 advertências, mas eu ainda não sou admin para remover.'
                }, { quoted: msg });
            } else {
                await conn.groupParticipantsUpdate(from, [target], 'remove');
                await conn.sendMessage(from, {
                    text: '🚫 *Limite atingido.*\n\nO usuário chegou em 3 advertências e foi removido do grupo.'
                }, { quoted: msg });
                grupoDB.advertencias = grupoDB.advertencias.filter((warn) => normalizeId(warn.userId) !== targetId);
            }
        } else {
            await conn.sendMessage(from, {
                text: `⚠️ *Advertência aplicada.*\nUsuário: @${targetId}\nAdvertências: ${userWarn.count}/3`,
                mentions: [target]
            }, { quoted: msg });
        }
        await grupoDB.save();
        groupCache.del(from);
    } catch (e) {
        console.error('Erro no comando adv:', e);
        await conn.sendMessage(from, { text: '❌ Erro ao aplicar advertência.' }, { quoted: msg });
    }
}
module.exports = {
    run,
    aliases
};
