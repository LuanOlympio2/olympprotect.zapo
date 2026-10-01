// creditos Olympio
const lembreteManager = require('../../funções/lembreteManager');
const { buildPlayCard, toSmallCaps } = require('../../funções/layout');
const { normalizeId } = require('../../funções/normalizarid');
const moment = require('moment-timezone');

const aliases = ['lembrete', 'lembrar', 'remind', 'timer'];

async function run(conn, msg, config, args, sender, senderName) {
    const from = msg.key.remoteJid;
    const prefix = config.prefix || '!';

    if (!args || args.length < 2) {
        return await conn.sendMessage(from, {
            text: `⏰ *COMO USAR O COMANDO LEMBRETE:*\n\n` +
                  `👉 *Exemplo:* *${prefix}lembrete 10m tomar meu remédio*\n` +
                  `👉 *Exemplo:* *${prefix}lembrete 2h entrar na reunião*\n` +
                  `👉 *Exemplo:* *${prefix}lembrete 30s verificar a panela*\n` +
                  `👉 *Exemplo:* *${prefix}lembrete 1d pagar fatura do cartão*\n\n` +
                  `💡 _Formatos de tempo aceitos:_ *s* (segundos), *m* (minutos), *h* (horas), *d* (dias).`
        }, { quoted: msg });
    }

    const timeArg = args[0];
    const parsed = lembreteManager.parseDuration(timeArg);

    if (!parsed) {
        return await conn.sendMessage(from, {
            text: `❌ Formato de tempo inválido! Use por exemplo: *10s*, *15m*, *2h* ou *1d*.`
        }, { quoted: msg });
    }

    const reminderText = args.slice(1).join(' ').trim();
    if (!reminderText) {
        return await conn.sendMessage(from, {
            text: `❌ Você precisa escrever o que deseja ser lembrado!`
        }, { quoted: msg });
    }

    const item = lembreteManager.createReminder({
        from,
        sender,
        senderName: senderName || 'Usuário',
        text: reminderText,
        durationMs: parsed.ms,
        durationText: parsed.unitName
    });

    const senderNum = normalizeId(sender);
    const horaDisparo = moment(item.notifyAt).tz('America/Sao_Paulo').format('HH:mm:ss (DD/MM)');

    const card = buildPlayCard({
        title: 'LEMBRETE ATIVADO',
        subtitle: 'Confirmação de Agendamento',
        icon: '⏰',
        infoLines: [
            `👤 *${toSmallCaps('para')}:* @${senderNum}`,
            `⏱️ *${toSmallCaps('tempo')}:* ${parsed.unitName}`,
            `🔔 *${toSmallCaps('previsto para')}:* ${horaDisparo} (Brasília)`
        ],
        result: `📝 *Mensagem anotada:*\n"${reminderText}"\n\nEu avisarei você quando o tempo acabar!`
    });

    await conn.sendMessage(from, {
        text: card,
        mentions: [`${senderNum}@s.whatsapp.net`]
    }, { quoted: msg });
}

module.exports = {
    name: 'lembrete',
    category: 'membro',
    description: 'Define um lembrete para você ser avisado no chat após o tempo especificado',
    aliases,
    run
};
