const { downloadContentFromMessage } = require('../../funções/mediaUtils');
const { isUserAdmin } = require('../../funções/normalizarid');
const aliases = ['revelar', 'reveal', 'ver'];
async function run(conn, msg, config, args, sender, senderName) {
    const from = msg.key.remoteJid;
    if (!from.endsWith('@g.us')) {
        return await conn.sendMessage(from, { text: '❌ Este comando só funciona em grupos!' }, { quoted: msg });
    }
    const groupMetadata = await conn.groupMetadata(from).catch(() => null);
    if (!groupMetadata) {
        return await conn.sendMessage(from, { text: '❌ Erro ao obter dados do grupo.' }, { quoted: msg });
    }
    const rawSender = msg.key?.participant || sender;
    if (!isUserAdmin(groupMetadata, sender, conn) && !isUserAdmin(groupMetadata, rawSender, conn)) {
        return await conn.sendMessage(from, { text: '❌ Apenas administradores podem usar este comando!' }, { quoted: msg });
    }
    const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    if (!quoted) {
        return await conn.sendMessage(from, { text: '⚠️ Responda a uma mensagem de visualização única para revelá-la.' }, { quoted: msg });
    }
    const viewOnceMessage = quoted.viewOnceMessage || quoted.viewOnceMessageV2 || quoted.viewOnceMessageV2Extension;
    const isDirectViewOnce = (quoted.imageMessage && quoted.imageMessage.viewOnce) || (quoted.videoMessage && quoted.videoMessage.viewOnce);
    if (!viewOnceMessage && !isDirectViewOnce) {
        return await conn.sendMessage(from, { text: '⚠️ A mensagem marcada não é de visualização única.' }, { quoted: msg });
    }
    let messageContent, type, mediaMessage;
    if (viewOnceMessage) {
        messageContent = viewOnceMessage.message;
        type = Object.keys(messageContent)[0];
        mediaMessage = messageContent[type];
    } else {
        if (quoted.imageMessage) {
            type = 'imageMessage';
            mediaMessage = quoted.imageMessage;
        } else if (quoted.videoMessage) {
            type = 'videoMessage';
            mediaMessage = quoted.videoMessage;
        }
    }
    try {
        const stream = await downloadContentFromMessage(mediaMessage, type === 'imageMessage' ? 'image' : 'video');
        let buffer = Buffer.from([]);
        for await (const chunk of stream) {
            buffer = Buffer.concat([buffer, chunk]);
        }
        if (type === 'imageMessage') {
            await conn.sendMessage(from, { image: buffer, caption: '🔓 *Visualização Única Revelada*' }, { quoted: msg });
        } else if (type === 'videoMessage') {
            await conn.sendMessage(from, { video: buffer, caption: '🔓 *Visualização Única Revelada*' }, { quoted: msg });
        }
    } catch (e) {
        console.error("Erro ao revelar mensagem:", e);
        await conn.sendMessage(from, { text: '❌ Erro ao baixar a mídia.' }, { quoted: msg });
    }
}
module.exports = {
    run,
    aliases
};
