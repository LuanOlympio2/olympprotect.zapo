// creditos Olympio
const { buildPlayCard, buildProgressBar, toSmallCaps } = require('../../funções/layout');
const { formatUserTag, getMentionJids } = require('../../funções/normalizarid');

const aliases = ['chance', 'probabilidade'];

function getChanceVerdict(percentage) {
    if (percentage === 0) return '🚫 *Chance zero!* Nem em sonho isso vai acontecer.';
    if (percentage <= 15) return '❄️ *Quase impossível!* É mais fácil chover dinheiro do que isso rolar.';
    if (percentage <= 35) return '🌧️ *Chance bem baixa...* Melhor não criar muitas expectativas.';
    if (percentage <= 60) return '⚖️ *Cinquenta a cinquenta!* Pode muito bem acontecer, depende do destino.';
    if (percentage <= 80) return '🌤️ *Boas chances!* Os astros estão soprando a seu favor.';
    if (percentage <= 99) return '🔥 *Altíssima probabilidade!* Quase certo, prepare a comemoração!';
    return '👑 *100% CERTEZA ABSOLUTA!* Está escrito nas estrelas, vai acontecer!';
}

async function run(conn, msg, config, args, sender, senderName) {
    const from = msg.key.remoteJid;
    const prefix = config.prefix || '+';

    let question = args.join(' ').trim();
    if (!question) {
        return await conn.sendMessage(from, {
            text: `⚠️ *Como usar:* Digite uma pergunta para calcular a chance!\nExemplo: *${prefix}chance de eu passar de ano?*`
        }, { quoted: msg });
    }

    const isGroup = from.endsWith('@g.us');
    const groupMetadata = isGroup ? await conn.groupMetadata(from).catch(() => null) : null;
    const participants = groupMetadata?.participants || [];

    const percentage = Math.floor(Math.random() * 101);
    const progressBar = buildProgressBar(percentage, 8);
    const verdict = getChanceVerdict(percentage);

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
        `❓ *${toSmallCaps('pergunta')}:* ${question}`,
        `📊 *${toSmallCaps('chance')}:* ${percentage}% ${progressBar}`
    ];

    const card = buildPlayCard({
        title: 'Medidor de Probabilidade',
        icon: '🎲',
        infoLines,
        result: verdict
    });

    await conn.sendMessage(from, {
        text: card,
        mentions
    }, { quoted: msg }).catch(async () => {
        await conn.sendMessage(from, { text: card, mentions });
    });
}

module.exports = {
    name: 'chance',
    description: 'Calcula a probabilidade de algo acontecer',
    aliases,
    run
};
