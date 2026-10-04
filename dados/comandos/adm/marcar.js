const { isUserAdmin, resolveToPhoneJid, getMentionJids } = require('../../funções/normalizarid');
const aliases = ['marcar', 'tagall', 'todos'];
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
        const participants = groupMetadata.participants || [];
        const reason = args.join(' ') || 'Marcação do adm';
        let text = `📢 ${reason}\n\n`;
        const mentionsSet = new Set();
        participants.forEach((p) => {
            const pId = p.id || p.jid;
            const phoneJid = resolveToPhoneJid(pId, participants);
            const num = phoneJid.split('@')[0].split(':')[0];
            text += `@${num}\n`;
            getMentionJids(pId, participants).forEach((m) => mentionsSet.add(m));
        });
        await conn.sendMessage(from, { 
            text: text,
            mentions: Array.from(mentionsSet)
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
