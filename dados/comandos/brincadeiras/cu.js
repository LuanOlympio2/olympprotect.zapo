// creditos Olympio
const { buildPlayCard, toSmallCaps } = require('../../funções/layout');
const { formatUserTag, getMentionJids } = require('../../funções/normalizarid');

const aliases = ['cu', 'cú'];

const cheirosoMsgs = [
    '🌸✨ O cu de {alvo} está exalando um aroma celestial de lavanda francesa, flores silvestres e sabonete Dove! Dá até gosto de ver tanto capricho e higiene! Um verdadeiro jardim perfumado! ✨🛁💐',
    '🌺✨ Rapaz, parece um buquê de rosas recém-colhido! Um perfume agradável que aromatizou o grupo inteiro! {alvo} passou até hidratante e perfume importado ali atrás! 🌹🧴💖',
    '🍓🍰 Inacreditável! O cu de {alvo} tem aroma doce de morango com chantilly e talco de bebê! Banho 100% em dia, nota dez em asseio! 🧼✨🍓'
];

const podreMsgs = [
    '🚨☣️ PUTA QUE PARIU! O cu de {alvo} parece que um gambá comeu feijoada azeda com ovo cozido e repolho estragado, e morreu afogado ali dentro há 3 semanas! Evacuem o grupo agora! 🦨💩☣️💀',
    '🪰🦨 O sensor do bot derreteu ao se aproximar de {alvo}! O cu tá tão fedido que até os mosquitos que passaram perto caíram duros no chão! Nem urubu em jejum aguenta essa inhaca! Pelo amor de Deus, passe sabão de coco e água sanitária urgente! 🚿🧽💩💨',
    '☢️☣️ O gás metano que tá saindo do cu de {alvo} abriu um buraco na camada de ozônio! Parece esgoto a céu aberto em dia de 40 graus no sol do meio-dia! Que fedor absurdo! 🧻💩🦨🔥'
];

async function run(conn, msg, config, args, sender, senderName) {
    const from = msg.key.remoteJid;
    const isGroup = from.endsWith('@g.us');
    const groupMetadata = isGroup ? await conn.groupMetadata(from).catch(() => null) : null;
    const participants = groupMetadata?.participants || [];

    const contextInfo = msg.message?.extendedTextMessage?.contextInfo;
    let targetJid = sender;

    if (contextInfo?.participant) {
        targetJid = contextInfo.participant;
    } else if (contextInfo?.mentionedJid && contextInfo.mentionedJid.length > 0) {
        targetJid = contextInfo.mentionedJid[0];
    }

    const targetTag = formatUserTag(targetJid, participants);
    const isCheiroso = Math.random() < 0.5;
    const porcentagem = Math.floor(Math.random() * 41) + 60;

    let laudo = '';
    let statusBadge = '';
    if (isCheiroso) {
        statusBadge = 'Perfumado & Cheiroso 🌸✨';
        const template = cheirosoMsgs[Math.floor(Math.random() * cheirosoMsgs.length)];
        laudo = template.replace(/{alvo}/g, targetTag);
    } else {
        statusBadge = 'Podre & Radioativo ☣️💩';
        const template = podreMsgs[Math.floor(Math.random() * podreMsgs.length)];
        laudo = template.replace(/{alvo}/g, targetTag);
    }

    const infoLines = [
        `👤 *${toSmallCaps('alvo')}:* ${targetTag}`,
        `👃 *${toSmallCaps('diagnóstico')}:* ${isCheiroso ? 'CHEIROSO' : 'PODRE'}`,
        `📊 *${toSmallCaps('índice')}:* ${porcentagem}% ${isCheiroso ? 'cheiroso' : 'podridão'}`,
        `🏅 *${toSmallCaps('status')}:* ${statusBadge}`
    ];

    const card = buildPlayCard({
        title: isCheiroso ? 'LAUDO OLFATIVO: CHEIROSO' : 'ALERTA DE DESASTRE BIOLÓGICO',
        icon: isCheiroso ? '🌸' : '☣️',
        infoLines,
        result: laudo
    });

    const mentions = Array.from(new Set([
        ...getMentionJids(targetJid, participants),
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
    name: 'cu',
    description: 'Avalia se o cu do alvo está cheiroso ou podre',
    aliases,
    run
};
