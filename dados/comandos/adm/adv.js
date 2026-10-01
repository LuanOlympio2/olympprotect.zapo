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
    const groupMetadata = await conn.groupMetadata(from);
    if (!isUserAdmin(groupMetadata, sender)) {
        return await conn.sendMessage(from, { text: '❌ Apenas administradores podem aplicar advertência.' }, { quoted: msg });
    }
    let target;
    if (msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length > 0) {
        target = msg.message.extendedTextMessage.contextInfo.mentionedJid[0];
    } else if (msg.message?.extendedTextMessage?.contextInfo?.participant) {
        target = msg.message.extendedTextMessage.contextInfo.participant;
    }
    if (!target) {
        return await conn.sendMessage(from, { text: '⚠️ Marque alguém ou responda a mensagem dele para advertir.' }, { quoted: msg });
    }
    const targetId = normalizeId(target);
    const botId = normalizeId(conn.user.id);
    if (targetId === botId) {
        return await conn.sendMessage(from, { text: '❌ Eu não posso me advertir.' }, { quoted: msg });
    }
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
            if (!isBotAdmin(groupMetadata, conn.user.id)) {
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
