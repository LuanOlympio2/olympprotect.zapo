// creditos Olympio
const { buildPlayCard, toSmallCaps } = require('../../funções/layout');
const { formatUserTag, getMentionJids } = require('../../funções/normalizarid');

const aliases = ['quando'];

const RESPOSTAS_QUANDO = [
    { nivel: 100, tempo: 'agora mesmo!' },
    { nivel: 95, tempo: 'ainda hoje à noite!' },
    { nivel: 85, tempo: 'amanhã sem falta!' },
    { nivel: 80, tempo: 'amanhã!' },
    { nivel: 75, tempo: 'neste fim de semana!' },
    { nivel: 65, tempo: 'semana que vem com certeza!' },
    { nivel: 50, tempo: 'no próximo mês, se tudo der certo!' },
    { nivel: 40, tempo: 'daqui a alguns meses!' },
    { nivel: 30, tempo: 'talvez no ano que vem...' },
    { nivel: 20, tempo: 'pode ser que não...' },
    { nivel: 15, tempo: 'em outra encarnação!' },
    { nivel: 10, tempo: 'quando as galinhas tiverem dentes!' },
    { nivel: 5, tempo: 'quando o Palmeiras tiver Mundial!' },
    { nivel: 0, tempo: 'nunca na sua vida!' },
    { nivel: 0, tempo: 'nem em sonho!' }
];

async function run(conn, msg, config, args, sender, senderName) {
    const from = msg.key.remoteJid;
    const prefix = config.prefix || '+';

    let question = args.join(' ').trim();
    if (!question) {
        return await conn.sendMessage(from, {
            text: `⚠️ *Como usar:* Digite uma pergunta para o oráculo!\nExemplo: *${prefix}quando eu vou namorar?*`
        }, { quoted: msg });
    }

    const isGroup = from.endsWith('@g.us');
    const groupMetadata = isGroup ? await conn.groupMetadata(from).catch(() => null) : null;
    const participants = groupMetadata?.participants || [];

    const chosen = RESPOSTAS_QUANDO[Math.floor(Math.random() * RESPOSTAS_QUANDO.length)];
    const senderTag = formatUserTag(sender, participants);

    const contextInfo = msg.message?.extendedTextMessage?.contextInfo;
    let mentions = getMentionJids(sender, participants);
    if (contextInfo?.participant) {
        getMentionJids(contextInfo.participant, participants).forEach(j => {
            if (!mentions.includes(j)) mentions.push(j);
        });
    }
    if (contextInfo?.mentionedJid) {
        for (const jid of contextInfo.mentionedJid) {
            getMentionJids(jid, participants).forEach(j => {
                if (!mentions.includes(j)) mentions.push(j);
            });
        }
    }

    const infoLines = [
        `👤 *${toSmallCaps('consultante')}:* ${senderTag}`,
        `❓ *${toSmallCaps('pergunta')}:* ${question}`
    ];

    const card = buildPlayCard({
        title: 'Oráculo do Tempo',
        icon: '⏳',
        infoLines,
        result: `⏳ *Previsão:* ${chosen.nivel}% ${chosen.tempo}`
    });

    await conn.sendMessage(from, {
        text: card,
        mentions
    }, { quoted: msg }).catch(async () => {
        await conn.sendMessage(from, { text: card, mentions });
    });
}

module.exports = {
    name: 'quando',
    description: 'Previsão de quando algo vai acontecer',
    aliases,
    run
};
