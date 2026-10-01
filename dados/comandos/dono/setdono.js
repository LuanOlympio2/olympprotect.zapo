// creditos Olympio
const fs = require('fs-extra');
const path = require('path');
const { normalizeId } = require(path.resolve(__dirname, '../../funções/normalizarid'));
const aliases = ['setdono', 'setowner'];
async function run(conn, msg, config, args, sender, senderName) {
    const from = msg.key.remoteJid;
    const senderId = normalizeId(sender);
    const currentOwner = normalizeId(config.ownerNumber);
    const botId = normalizeId(conn.user.id);
    const isFromMe = msg.key.fromMe;
    const isAllowed = (senderId === currentOwner) || (senderId === botId) || isFromMe;
    if (!isAllowed) {
        return await conn.sendMessage(from, { text: '❌ Apenas o dono atual ou o próprio bot podem redefinir o dono.' }, { quoted: msg });
    }
    try {
        const configPath = path.resolve(process.cwd(), 'config.json');
        const currentConfig = await fs.readJson(configPath);
        let newOwnerNumber = "";
        let newOwnerLid = "";
        const quoted = msg.message?.extendedTextMessage?.contextInfo?.participant;
        if (quoted) {
            newOwnerNumber = normalizeId(quoted);
            if (quoted === sender && sender.includes('@lid')) {
                newOwnerLid = sender;
            }
        }
        else if (args[0]) {
            newOwnerNumber = args[0].replace(/[^0-9]/g, '');
            if (normalizeId(sender) === newOwnerNumber && sender.includes('@lid')) {
                newOwnerLid = sender;
            }
        }
        else if (isFromMe) {
            newOwnerNumber = normalizeId(conn.user.id);
        }
        if (!newOwnerNumber) {
            return await conn.sendMessage(from, {
                text: '⚠️ Mencione alguém, responda a uma mensagem ou digite o número.\n\nExemplo:\n*!setdono @usuario*\n*!setdono 551199999999*'
            }, { quoted: msg });
        }
        currentConfig.ownerNumber = newOwnerNumber;
        if (newOwnerNumber !== currentOwner) {
            currentConfig.ownerlid = newOwnerLid || "";
        } else if (newOwnerLid) {
            currentConfig.ownerlid = newOwnerLid;
        }
        await fs.writeJson(configPath, currentConfig, { spaces: 2 });
        config.ownerNumber = newOwnerNumber;
        config.ownerlid = currentConfig.ownerlid;
        const resposta = `
╭┈⊰ ✅ *CONFIGURAÇÃO ATUALIZADA*
┊
┊ 👑 *Novo Dono:* @${newOwnerNumber}
┊ 🔑 *LID Vinculado:* ${config.ownerlid ? 'Sim (Salvo)' : 'Não identificado'}
┊
┊ O bot agora obedece a este número.
╰─┈┈┈┈┈◜☣︎◞┈┈┈┈┈─╯`;
        await conn.sendMessage(from, {
            text: resposta,
            mentions: [newOwnerNumber + '@s.whatsapp.net']
        }, { quoted: msg });
    } catch (e) {
        console.error(e);
        await conn.sendMessage(from, { text: '❌ Erro ao salvar no config.json.' }, { quoted: msg });
    }
}
module.exports = {
    run,
    aliases
};
