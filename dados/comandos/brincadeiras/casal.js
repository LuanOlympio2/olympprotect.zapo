// creditos Olympio
const { buildPlayCard, buildProgressBar, toSmallCaps } = require('../../funções/layout');
const { compareIds, findParticipant, formatUserTag, getMentionJids } = require('../../funções/normalizarid');

const aliases = ['casal', 'shipo', 'ship', 'shippar'];

function getCasalVerdict(percentage) {
    if (percentage <= 20) return '💔 *Casal Radioativo!* Se ficarem juntos mais de 5 minutos, sai na página policial.';
    if (percentage <= 45) return '🥀 *Pouca química...* No máximo uma amizade forçada ou oi sem graça no zap.';
    if (percentage <= 70) return '🔥 *Tem faísca!* Se derem uma chance no privado, o clima esquenta rapidinho.';
    if (percentage <= 89) return '💖 *Super combinam!* Já podem assumir e colocar as iniciais na bio do perfil!';
    return '💍 *ALMAS GÊMEAS!* O casamento já está marcado no grupo, só falta chamar os padrinhos!';
}

async function run(conn, msg, config, args, sender, senderName) {
    const from = msg.key.remoteJid;
    const isGroup = from.endsWith('@g.us');

    let p1 = null;
    let p2 = null;

    const contextInfo = msg.message?.extendedTextMessage?.contextInfo;
    const mentioned = contextInfo?.mentionedJid || [];

    if (mentioned.length >= 2) {
        p1 = mentioned[0];
        p2 = mentioned[1];
    } else if (mentioned.length === 1) {
        p1 = sender;
        p2 = mentioned[0];
    } else if (contextInfo?.participant) {
        p1 = sender;
        p2 = contextInfo.participant;
    } else if (isGroup) {
        const groupMetadata = await conn.groupMetadata(from).catch(() => null);
        const participants = groupMetadata?.participants || [];
        const botId = conn.user?.id || '';

        let eligible = participants.filter(p => {
            if (!p.id) return false;
            if (botId && compareIds(p.id, botId)) return false;
            return true;
        });

        if (eligible.length < 2) {
            return await conn.sendMessage(from, {
                text: '⚠️ Não há membros suficientes no grupo para formar um casal!'
            }, { quoted: msg });
        }

        const shuffled = [...eligible].sort(() => Math.random() - 0.5);
        p1 = shuffled[0].id;
        p2 = shuffled[1].id;
    } else {
        return await conn.sendMessage(from, {
            text: '⚠️ No privado, mencione alguém para shippar! Exemplo: *!shipo @usuario*'
        }, { quoted: msg });
    }

    if (p1 && p2 && compareIds(p1, p2)) {
        return await conn.sendMessage(from, {
            text: '⚠️ Não dá para shippar a pessoa com ela mesma! Marque pessoas diferentes.'
        }, { quoted: msg });
    }

    let rawP1 = p1;
    let rawP2 = p2;
    const groupMetadata = isGroup ? await conn.groupMetadata(from).catch(() => null) : null;
    const participants = groupMetadata?.participants || [];

    const tag1 = formatUserTag(p1, participants);
    const tag2 = formatUserTag(p2, participants);

    const percentage = Math.floor(Math.random() * 101);
    const progressBar = buildProgressBar(percentage, 8);
    const verdict = getCasalVerdict(percentage);

    const infoLines = [
        `👤 *${toSmallCaps('par')} 1:* ${tag1}`,
        `👤 *${toSmallCaps('par')} 2:* ${tag2}`,
        `💖 *${toSmallCaps('afinidade')}:* ${percentage}% ${progressBar}`
    ];

    const card = buildPlayCard({
        title: 'Formação de Casal & Shipo',
        icon: '💘',
        infoLines,
        result: `${tag1} ❤️ ${tag2}\n\n${verdict}`
    });

    const mentions = Array.from(new Set([
        ...getMentionJids(p1, participants),
        ...getMentionJids(rawP1, participants),
        ...getMentionJids(p2, participants),
        ...getMentionJids(rawP2, participants)
    ]));

    await conn.sendMessage(from, {
        text: card,
        mentions
    }, { quoted: msg }).catch(async () => {
        await conn.sendMessage(from, { text: card, mentions });
    });
}

module.exports = {
    name: 'casal',
    description: 'Sorteia ou shippa casais no grupo',
    aliases,
    run
};
