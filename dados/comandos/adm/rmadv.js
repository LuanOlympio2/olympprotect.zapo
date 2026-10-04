// creditos Olympio
const Grupo = require('../../modelos/grupos');
const { isUserAdmin, normalizeId } = require('../../funções/normalizarid');
const groupCache = require('../../funções/groupCache');
const aliases = ['rmadv', 'unwarn', 'removeadv', 'tiraadv'];
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
        return await conn.sendMessage(from, { text: '❌ Apenas administradores podem remover advertência.' }, { quoted: msg });
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
        return await conn.sendMessage(from, { text: `⚠️ Marque alguém, responda a mensagem ou use: ${config.prefix}rmadv 551199999999` }, { quoted: msg });
    }
    const { findParticipant } = require('../../funções/normalizarid');
    const targetParticipant = findParticipant(groupMetadata.participants, target);
    const targetPhone = targetParticipant?.phoneNumber || (!String(target).includes('@lid') ? target : null);
    const targetId = normalizeId(targetPhone || target);
    try {
        const grupoDB = await Grupo.findOne({ groupId: from });
        if (!grupoDB?.advertencias?.length) {
            return await conn.sendMessage(from, { text: '⚠️ Esse grupo ainda não tem advertências registradas.' }, { quoted: msg });
        }
        const warnIndex = grupoDB.advertencias.findIndex((warn) => normalizeId(warn.userId) === targetId);
        if (warnIndex === -1) {
            return await conn.sendMessage(from, { text: '⚠️ Esse usuário não possui advertências salvas.' }, { quoted: msg });
        }
        const userWarn = grupoDB.advertencias[warnIndex];
        userWarn.count = Math.max(0, (userWarn.count || 0) - 1);
        if (userWarn.count <= 0) {
            grupoDB.advertencias.splice(warnIndex, 1);
            await conn.sendMessage(from, {
                text: `✅ *Ficha limpa.*\nUsuário: @${targetId}\nTodas as advertências foram removidas.`,
                mentions: [target]
            }, { quoted: msg });
        } else {
            await conn.sendMessage(from, {
                text: `✅ *Advertência removida.*\nUsuário: @${targetId}\nRestam ${userWarn.count}/3.`,
                mentions: [target]
            }, { quoted: msg });
        }
        await grupoDB.save();
        groupCache.del(from);
    } catch (e) {
        console.error('Erro no comando rmadv:', e);
        await conn.sendMessage(from, { text: '❌ Erro ao remover advertência.' }, { quoted: msg });
    }
}
module.exports = {
    run,
    aliases
};
