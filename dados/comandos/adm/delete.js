const aliases = ['delete', 'del', 'd'];
const { isUserAdmin, isBotAdmin } = require('../../funções/normalizarid');
async function run(conn, msg, config, args, sender, senderName) {
    const from = msg.key.remoteJid;
    const isGroup = from.endsWith('@g.us');
    if (!isGroup) {
        return await conn.sendMessage(from, { text: 'Este comando só funciona em grupos!' }, { quoted: msg });
    }
    try {
        const groupMetadata = await conn.groupMetadata(from).catch(() => null);
        if (!groupMetadata) {
            return await conn.sendMessage(from, { text: '❌ Erro ao obter dados do grupo.' }, { quoted: msg });
        }
        const rawSender = msg.key?.participant || sender;
        if (!isUserAdmin(groupMetadata, sender, conn) && !isUserAdmin(groupMetadata, rawSender, conn)) {
            return await conn.sendMessage(from, { text: 'Apenas administradores podem usar este comando!' }, { quoted: msg });
        }
        if (!isBotAdmin(groupMetadata, conn)) {
            return await conn.sendMessage(from, { text: 'Preciso ser administrador para deletar mensagens!' }, { quoted: msg });
        }
        const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        const quotedKey = msg.message?.extendedTextMessage?.contextInfo?.stanzaId;
        const quotedParticipant = msg.message?.extendedTextMessage?.contextInfo?.participant;
        if (!quoted || !quotedKey) {
            return await conn.sendMessage(from, { text: 'Você precisa marcar a mensagem que deseja deletar!' }, { quoted: msg });
        }
        const messageKey = {
            remoteJid: from,
            fromMe: false,
            id: quotedKey,
            participant: quotedParticipant
        };
        await conn.sendMessage(from, { delete: messageKey });
        setTimeout(async () => {
            try {
                await conn.sendMessage(from, { delete: msg.key });
            } catch (e) {
                console.log("Não conseguiu deletar mensagem do comando");
            }
        }, 500);
    } catch (e) {
        console.error("Erro no comando delete:", e);
        await conn.sendMessage(from, { text: 'Erro ao deletar a mensagem. Verifique se sou admin e se a mensagem é recente.' }, { quoted: msg });
    }
}
module.exports = {
    run,
    aliases
};
