// creditos Olympio
const Usuario = require('../../modelos/Usuario');
const { normalizeId } = require('../../funções/normalizarid');
const { buildPlayCard, toSmallCaps } = require('../../funções/layout');
const moment = require('moment-timezone');

module.exports = {
    name: 'afk',
    aliases: ['afk', 'ausente'],
    category: 'membro',
    description: 'Marca você como ausente com motivo opcional.',
    run: async (conn, msg, config, args, sender, senderName) => {
        const from = msg.key.remoteJid;
        const senderId = normalizeId(sender);
        const reason = args.join(' ').trim();

        try {
            let usuario = await Usuario.findOne({ userId: senderId });
            if (!usuario) {
                usuario = new Usuario({ userId: senderId, nome: senderName || msg.pushName || 'Usuário' });
            }
            usuario.afkSince = Date.now();
            usuario.afkReason = reason || '';
            await usuario.save();

            const hora = moment().tz('America/Sao_Paulo').format('HH:mm:ss');
            const infoLines = [
                `👤 *${toSmallCaps('usuario')}:* @${senderId}`,
                `🕒 *${toSmallCaps('horario')}:* ${hora} (Brasília)`
            ];

            if (reason) {
                infoLines.push(`📝 *${toSmallCaps('motivo')}:* ${reason}`);
            }

            const card = buildPlayCard({
                title: 'MODO AFK ATIVADO',
                subtitle: 'Aviso de Ausência',
                icon: '💤',
                infoLines,
                result: reason 
                    ? `Você está ausente por: "${reason}". Quem te marcar será avisado!`
                    : 'Você está ausente no momento. Quem te marcar será avisado!'
            });

            await conn.sendMessage(from, {
                text: card,
                mentions: [`${senderId}@s.whatsapp.net`]
            }, { quoted: msg });
        } catch (e) {
            console.error('Erro no comando afk:', e);
            await conn.sendMessage(from, { text: '❌ Não consegui ativar seu modo AFK agora.' }, { quoted: msg });
        }
    }
};
