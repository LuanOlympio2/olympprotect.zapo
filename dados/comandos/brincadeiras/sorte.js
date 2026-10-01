// creditos Olympio
const { buildPlayCard, buildProgressBar, toSmallCaps } = require('../../funções/layout');
const { findParticipant, formatUserTag, getMentionJids } = require('../../funções/normalizarid');

const aliases = ['sorte'];

function getSorteTier(level) {
    if (level <= 20) return { badge: 'Azar Extremo 🍂', desc: 'Melhor nem sair da cama para não pisar em cocô!' };
    if (level <= 45) return { badge: 'Sorte Baixa 🌧️', desc: 'Dia neutro, evite tomar decisões arriscadas hoje.' };
    if (level <= 70) return { badge: 'Sorte Moderada ⚖️', desc: 'Equilíbrio total, as coisas tendem a fluir com calma.' };
    if (level <= 88) return { badge: 'Boa Sorte 🍀', desc: 'O dia promete coisas boas, aproveite as oportunidades!' };
    return { badge: 'Sorte Divina 🌟', desc: 'Tudo conspira a seu favor hoje, pode apostar na mega da virada!' };
}

async function run(conn, msg, config, args, sender, senderName) {
    const from = msg.key.remoteJid;
    const isGroup = from.endsWith('@g.us');

    const contextInfo = msg.message?.extendedTextMessage?.contextInfo;
    let targetJid = sender;

    if (contextInfo?.participant) {
        targetJid = contextInfo.participant;
    } else if (contextInfo?.mentionedJid && contextInfo.mentionedJid.length > 0) {
        targetJid = contextInfo.mentionedJid[0];
    }

    let rawTarget = targetJid;
    const groupMetadata = isGroup ? await conn.groupMetadata(from).catch(() => null) : null;
    const participants = groupMetadata?.participants || [];

    const targetTag = formatUserTag(targetJid, participants);
    const level = Math.floor(Math.random() * 100) + 1;
    const progressBar = buildProgressBar(level, 8);
    const tier = getSorteTier(level);

    const verdict = `🍀 ${targetTag} está com *${level}% de sorte* hoje! ${tier.desc}`;

    const infoLines = [
        `👤 *${toSmallCaps('alvo')}:* ${targetTag}`,
        `📊 *${toSmallCaps('sorte hoje')}:* ${level}% ${progressBar}`,
        `🏅 *${toSmallCaps('status')}:* ${tier.badge}`
    ];

    const card = buildPlayCard({
        title: 'Termômetro de Sorte Diária',
        icon: '🍀',
        infoLines,
        result: verdict
    });

    const mentions = Array.from(new Set([
        ...getMentionJids(targetJid, participants),
        ...getMentionJids(rawTarget, participants),
        ...getMentionJids(sender, participants)
    ]));

    await conn.sendMessage(from, {
        text: card,
        mentions
    }, { quoted: msg }).catch(async () => {
        await conn.sendMessage(from, { text: card, mentions });
    });
}

module.exports = {
    name: 'sorte',
    description: 'Mede a porcentagem de sorte diária de alguém',
    aliases,
    run
};
