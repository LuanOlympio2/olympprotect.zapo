// creditos Olympio
const Grupo = require('../../modelos/grupos');
const { normalizeId, isUserAdmin, isBotAdmin } = require('../../funções/normalizarid');
const { isOwnerSender } = require('../../funções/ownerAuth');
const groupCache = require('../../funções/groupCache');
const aliases = ['donosgp', 'setdono', 'manager'];
async function run(conn, msg, config, args, sender, senderName) {
    const from = msg.key.remoteJid;
    if (!from.endsWith('@g.us')) {
        return await conn.sendMessage(from, { text: '❌ Este comando só funciona em grupos!' }, { quoted: msg });
    }
    try {
        const groupMetadata = await conn.groupMetadata(from);
        const senderClean = normalizeId(sender);
        const groupOwner = normalizeId(groupMetadata.owner || "");
        if (!isOwnerSender(config, sender, msg, conn) && senderClean !== groupOwner) {
            return await conn.sendMessage(from, { text: '❌ Apenas o Dono do Grupo ou o Dono do Bot podem gerenciar os donos secundários!' }, { quoted: msg });
        }
        let grupoDB = await Grupo.findOne({ groupId: from });
        if (!grupoDB) {
            grupoDB = new Grupo({ groupId: from });
        }
        const action = args[0] ? args[0].toLowerCase() : 'list';
        if (action === 'add') {
            let target = null;
            if (msg.message.extendedTextMessage?.contextInfo?.participant) {
                target = msg.message.extendedTextMessage.contextInfo.participant;
            } else if (args[1]) {
                target = args[1].replace(/[^0-9]/g, '') + '@s.whatsapp.net';
            }
            if (!target) {
                return await conn.sendMessage(from, { text: '❌ Marque alguém ou digite o número para adicionar.' }, { quoted: msg });
            }
            const targetClean = normalizeId(target);
            if (grupoDB.donos.includes(targetClean)) {
                return await conn.sendMessage(from, { text: '⚠️ Este usuário já é um dono do grupo.' }, { quoted: msg });
            }
            grupoDB.donos.push(targetClean);
            await grupoDB.save();
            groupCache.del(from);
            await conn.sendMessage(from, { text: `✅ Usuário @${targetClean.split('@')[0]} adicionado à lista de donos!`, mentions: [target] }, { quoted: msg });
        } else if (action === 'remove' || action === 'del') {
            let target = null;
            if (msg.message.extendedTextMessage?.contextInfo?.participant) {
                target = msg.message.extendedTextMessage.contextInfo.participant;
            } else if (args[1]) {
                target = args[1].replace(/[^0-9]/g, '') + '@s.whatsapp.net';
            }
            if (!target) {
                return await conn.sendMessage(from, { text: '❌ Marque alguém ou digite o número para remover.' }, { quoted: msg });
            }
            const targetClean = normalizeId(target);
            const index = grupoDB.donos.indexOf(targetClean);
            if (index === -1) {
                return await conn.sendMessage(from, { text: '⚠️ Este usuário não está na lista de donos.' }, { quoted: msg });
            }
            grupoDB.donos.splice(index, 1);
            await grupoDB.save();
            groupCache.del(from);
            await conn.sendMessage(from, { text: `✅ Usuário @${targetClean.split('@')[0]} removido da lista de donos!`, mentions: [target] }, { quoted: msg });
        } else {
            if (grupoDB.donos.length === 0) {
                return await conn.sendMessage(from, { text: '📋 *Lista de Donos:*\n\nNenhum dono adicional configurado.\n\nUse: *!donosgp add @user*' }, { quoted: msg });
            }
            let text = '📋 *Lista de Donos do Grupo:*\n\n';
            grupoDB.donos.forEach(dono => {
                text += `- @${dono.split('@')[0]}\n`;
            });
            text += '\nEstes usuários podem promover/rebaixar sem serem punidos pelo Anti-Nuke.';
            await conn.sendMessage(from, { text: text, mentions: grupoDB.donos }, { quoted: msg });
        }
    } catch (e) {
        console.error("Erro no comando donosgp:", e);
        await conn.sendMessage(from, { text: 'Erro ao executar comando.' }, { quoted: msg });
    }
}
module.exports = {
    run,
    aliases
};
