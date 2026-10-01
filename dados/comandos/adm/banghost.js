// creditos Olympio
const Grupo = require('../../modelos/grupos');
const { isUserAdmin, isBotAdmin, normalizeId } = require('../../funções/normalizarid');
module.exports = {
    name: 'banghost',
    aliases: ['banghost', 'bangghost'],
    category: 'adm',
    description: 'Remove membros com pouca atividade registrada.',
    run: async (conn, msg, config, args, sender) => {
        const from = msg.key.remoteJid;
        if (!from.endsWith('@g.us')) {
            return conn.sendMessage(from, { text: '❌ Esse comando só funciona em grupos.' }, { quoted: msg });
        }
        try {
            const metadata = await conn.groupMetadata(from);
            if (!isUserAdmin(metadata, sender)) {
                return conn.sendMessage(from, { text: '❌ Apenas administradores podem usar o BangGhost.' }, { quoted: msg });
            }
            if (!isBotAdmin(metadata, conn.user.id)) {
                return conn.sendMessage(from, { text: '❌ Eu preciso ser admin para remover os fantasmas.' }, { quoted: msg });
            }
            const minMessages = parseInt(args[0], 10);
            if (Number.isNaN(minMessages) || minMessages < 0) {
                return conn.sendMessage(from, { text: `Use assim: ${config.prefix}banghost 5` }, { quoted: msg });
            }
            const grupo = await Grupo.findOne({ groupId: from });
            const activity = grupo?.memberActivity || [];
            const participants = metadata.participants || [];
            const toRemove = participants
                .filter((participant) => !participant.admin)
                .map((participant) => {
                    const userId = normalizeId(participant.id);
                    const found = activity.find((entry) => entry.userId === userId);
                    return { id: participant.id, count: found?.messages || 0 };
                })
                .filter((entry) => entry.count < minMessages)
                .map((entry) => entry.id);
            if (!toRemove.length) {
                return conn.sendMessage(from, { text: 'Nenhum membro ficou abaixo desse limite de atividade.' }, { quoted: msg });
            }
            await conn.groupParticipantsUpdate(from, toRemove, 'remove');
            await conn.sendMessage(from, {
                text: `Banghost concluido.\n\nForam removidos ${toRemove.length} membro(s) com menos de ${minMessages} mensagem(ns).`
            }, { quoted: msg });
        } catch (e) {
            console.error('Erro no comando banghost:', e);
            await conn.sendMessage(from, { text: 'Nao consegui concluir o banghost agora.' }, { quoted: msg });
        }
    }
};
