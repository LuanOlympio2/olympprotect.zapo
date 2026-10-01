// creditos Olympio
const { isOwnerSender } = require('../../funções/ownerAuth');

module.exports = {
    name: "reiniciar",
    aliases: ["reiniciar", "restart", "reset"],
    category: "dono",
    description: "Reinicia o bot (encerra o processo).",
    run: async (conn, msg, config, args, sender, senderName) => {
        const from = msg.key.remoteJid;
        const isOwner = isOwnerSender(config, sender, msg, conn);
        if (!isOwner) {
            return await conn.sendMessage(from, { text: '❌ Apenas o dono pode usar este comando.' }, { quoted: msg });
        }
        await conn.sendMessage(from, { text: '🔄 Reiniciando o sistema...' }, { quoted: msg });
        setTimeout(() => {
            process.exit(0);
        }, 1000);
    }
};
