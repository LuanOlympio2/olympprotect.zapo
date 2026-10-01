// creditos Olympio
const Usuario = require('../../modelos/Usuario');
const { normalizeId } = require('../../funções/normalizarid');
module.exports = {
    name: 'rankativo',
    aliases: ['rankativo', 'rankgrupo', 'topativo'],
    description: 'Mostra os 10 usuários mais ativos do grupo.',
    category: 'membro',
    run: async (conn, msg, config, args, sender, senderName) => {
        try {
            const from = msg.key.remoteJid;
            if (!from.endsWith('@g.us')) {
                return conn.sendMessage(from, { text: '❌ Este comando só pode ser usado em grupos.' }, { quoted: msg });
            }
            const groupMetadata = await conn.groupMetadata(from);
            const participants = groupMetadata.participants;
            const users = await Usuario.find({
                userId: { $in: participants.map(p => normalizeId(p.id)) }
            }).sort({ mensagensEnviadas: -1 }).limit(10);
            if (!users || users.length === 0) {
                return conn.sendMessage(from, { text: '❌ Nenhuma atividade registrada neste grupo ainda.' }, { quoted: msg });
            }
            let text = `🏆 *RANKING DE ATIVIDADE (GRUPO)* 🏆\n\n`;
            const mentions = [];
            for (let i = 0; i < users.length; i++) {
                const user = users[i];
                const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}º`;
                const participant = participants.find(p => normalizeId(p.id) === user.userId);
                if (participant) {
                    mentions.push(participant.id);
                    text += `${medal} @${participant.id.split('@')[0]}\n   └ 💬 ${user.mensagensEnviadas} mensagens\n\n`;
                }
            }
            await conn.sendMessage(from, { text: text, mentions: mentions }, { quoted: msg });
        } catch (e) {
            console.error("Erro no comando rankativo:", e);
            await conn.sendMessage(msg.key.remoteJid, { text: '❌ Erro ao gerar ranking.' }, { quoted: msg });
        }
    }
};
