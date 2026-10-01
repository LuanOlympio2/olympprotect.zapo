// creditos Olympio
const Usuario = require('../../modelos/Usuario');
const { normalizeId } = require('../../funções/normalizarid');
module.exports = {
    name: 'rankativog',
    aliases: ['rankativog', 'rankglobal', 'topglobal'],
    description: 'Mostra os 10 usuários mais ativos globalmente.',
    category: 'membro',
    run: async (conn, msg, config, args, sender, senderName) => {
        try {
            const from = msg.key.remoteJid;
            const users = await Usuario.find({}).sort({ mensagensEnviadas: -1 }).limit(10);
            if (!users || users.length === 0) {
                return conn.sendMessage(from, { text: '❌ Nenhuma atividade registrada ainda.' }, { quoted: msg });
            }
            let text = `🌍 *RANKING DE ATIVIDADE (GLOBAL)* 🌍\n\n`;
            const mentions = [];
            for (let i = 0; i < users.length; i++) {
                const user = users[i];
                const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}º`;
                const fullId = user.userId.includes('@') ? user.userId : `${user.userId}@s.whatsapp.net`;
                mentions.push(fullId);
                text += `${medal} @${user.userId.split('@')[0]}\n   └ 💬 ${user.mensagensEnviadas} mensagens\n\n`;
            }
            await conn.sendMessage(from, { text: text, mentions: mentions }, { quoted: msg });
        } catch (e) {
            console.error("Erro no comando rankativog:", e);
            await conn.sendMessage(msg.key.remoteJid, { text: '❌ Erro ao gerar ranking global.' }, { quoted: msg });
        }
    }
};
