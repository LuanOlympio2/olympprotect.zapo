// creditos Olympio
const path = require('path');
const { normalizeId, isUserAdmin } = require(path.join(__dirname, '..', '..', 'funções', 'normalizarid'));
const aliases = ['marcar', 'tagall', 'todos'];
async function run(conn, msg, config, args, sender, senderName) {
    const from = msg.key.remoteJid;
    const isGroup = from.endsWith('@g.us');
    if (!isGroup) {
        return await conn.sendMessage(from, { text: 'Este comando só funciona em grupos!' }, { quoted: msg });
    }
    try {
        const groupMetadata = await conn.groupMetadata(from);
        if (!isUserAdmin(groupMetadata, sender)) {
            return await conn.sendMessage(from, { text: 'Apenas administradores podem usar este comando!' }, { quoted: msg });
        }
        const participants = groupMetadata.participants;
        const mentions = participants.map(({ id }) => id);
        const reason = args.join(' ') || 'Marcação do adm';
        let text = `📢 ${reason}\n\n`;
        participants.forEach(({ id }) => {
            text += `@${id.split('@')[0]}\n`;
        });
        await conn.sendMessage(from, { 
            text: text,
            mentions: mentions
        }, { quoted: msg });
    } catch (e) {
        console.error("Erro no comando marcar:", e);
        await conn.sendMessage(from, { text: 'Erro ao marcar os membros do grupo.' }, { quoted: msg });
    }
}
module.exports = {
    run,
    aliases
};
