// creditos Olympio
const fs = require('fs');
const path = require('path');
const interacoesData = require('./data/interacoesData.json');
const { compareIds, findParticipant, formatUserTag, getMentionJids } = require('../../funções/normalizarid');
const { buildPlayCard, toSmallCaps } = require('../../funções/layout');

const aliases = Object.keys(interacoesData);

async function sendMediaOrText(conn, from, msg, card, mentions, cmdKey) {
    let interacoesGifs = {};
    const gifsFile = path.join(__dirname, 'data/interacoesGifs.json');
    if (fs.existsSync(gifsFile)) {
        try { interacoesGifs = JSON.parse(fs.readFileSync(gifsFile, 'utf8')); } catch (_) {}
    }

    const gifFileName = interacoesGifs[cmdKey];
    const gifPath = gifFileName ? path.join(__dirname, 'midia', gifFileName) : null;

    if (gifPath && fs.existsSync(gifPath)) {
        try {
            const fileBuffer = fs.readFileSync(gifPath);
            const isImage = /\.(jpe?g|png|webp)$/i.test(gifPath);
            const mediaPayload = isImage
                ? { image: fileBuffer, caption: card, mentions }
                : { video: fileBuffer, gifPlayback: true, caption: card, mentions };

            return await conn.sendMessage(from, mediaPayload, { quoted: msg }).catch(async () => {
                await conn.sendMessage(from, mediaPayload);
            });
        } catch (eMedia) {
            console.error('Falha ao enviar midia de interacao:', eMedia?.message || eMedia);
        }
    }

    await conn.sendMessage(from, {
        text: card,
        mentions
    }, { quoted: msg }).catch(async () => {
        await conn.sendMessage(from, { text: card, mentions });
    });
}

async function run(conn, msg, config, args, sender, senderName) {
    const from = msg.key.remoteJid;
    const prefix = config.prefix || '+';
    const isGroup = from.endsWith('@g.us');

    const fullText = msg.message?.conversation || 
                     msg.message?.extendedTextMessage?.text || 
                     msg.message?.imageMessage?.caption || 
                     msg.message?.videoMessage?.caption || '';
    
    let commandUsed = '';
    if (fullText.startsWith(prefix)) {
        commandUsed = fullText.slice(prefix.length).trim().split(/\s+/)[0].toLowerCase();
    } else {
        commandUsed = aliases.find(a => fullText.toLowerCase().includes(a)) || aliases[0];
    }

    const cmdKey = interacoesData[commandUsed] ? commandUsed : aliases.find(a => a === commandUsed) || 'tapa';

    if (cmdKey === 'surubao') {
        if (!isGroup) {
            return await conn.sendMessage(from, {
                text: '⚠️ O comando surubão só pode ser utilizado em grupos!'
            }, { quoted: msg });
        }

        let count = parseInt(args && args[0], 10);
        if (isNaN(count)) {
            const numMatch = fullText.match(/\b([1-9]|10)\b/);
            if (numMatch) count = parseInt(numMatch[0], 10);
        }
        if (isNaN(count) || count < 2) count = 5;
        if (count > 10) count = 10;

        const groupMetadata = await conn.groupMetadata(from).catch(() => null);
        const participants = groupMetadata?.participants || [];
        const botId = conn.user?.id || '';

        let eligible = participants.filter(p => {
            if (!p.id) return false;
            if (compareIds(p.id, sender)) return false;
            if (botId && compareIds(p.id, botId)) return false;
            return true;
        });

        if (eligible.length < 2) {
            return await conn.sendMessage(from, {
                text: '⚠️ Não há membros suficientes no grupo para realizar um surubão!'
            }, { quoted: msg });
        }

        const chosenCount = Math.min(count, eligible.length);
        const chosen = [...eligible].sort(() => Math.random() - 0.5).slice(0, chosenCount);

        const mentions = [];
        const senderTag = formatUserTag(sender, participants);
        getMentionJids(sender, participants).forEach(j => { if (!mentions.includes(j)) mentions.push(j); });

        const chosenTags = chosen.map((p, idx) => {
            getMentionJids(p.id, participants).forEach(j => { if (!mentions.includes(j)) mentions.push(j); });
            const tag = formatUserTag(p.id, participants);
            return `${idx + 1}. ${tag}`;
        });

        const narrative = `🔥 ${senderTag} organizou um surubão insano com ${chosenTags.length} pessoas no grupo!\n\n│ *Membros na suruba:*\n│ ${chosenTags.join('\n│ ')}\n\n│ Ninguém perdoou ninguém, o clima esquentou e foi sacanagem pura do início ao fim!`;

        const card = buildPlayCard({
            title: 'Surubão do Grupo',
            icon: '🔥',
            infoLines: [
                `👤 *${toSmallCaps('organizador')}:* ${senderTag}`,
                `👥 *${toSmallCaps('participantes')}:* ${chosenTags.length} pessoas`,
                `🎭 *${toSmallCaps('ato')}:* Surubão Coletivo`
            ],
            result: narrative
        });

        return await sendMediaOrText(conn, from, msg, card, mentions, cmdKey);
    }

    const contextInfo = msg.message?.extendedTextMessage?.contextInfo;
    let targetJid = null;

    if (contextInfo?.participant) {
        targetJid = contextInfo.participant;
    } else if (contextInfo?.mentionedJid && contextInfo.mentionedJid.length > 0) {
        targetJid = contextInfo.mentionedJid[0];
    }

    if (!targetJid) {
        return await conn.sendMessage(from, {
            text: `⚠️ Como usar: mencione alguém (@usuario) ou responda à mensagem da pessoa para usar *${prefix}${cmdKey}*!`
        }, { quoted: msg });
    }

    if (compareIds(targetJid, sender)) {
        return await conn.sendMessage(from, {
            text: 'Você não pode fazer isso consigo mesmo, marque outro participante!'
        }, { quoted: msg });
    }

    let rawTarget = targetJid;
    const groupMetadata = isGroup ? await conn.groupMetadata(from).catch(() => null) : null;
    const participants = groupMetadata?.participants || [];

    const templates = interacoesData[cmdKey];
    const targetTag = formatUserTag(targetJid, participants);
    const senderTag = formatUserTag(sender, participants);

    let narrative = `Você interagiu com ${targetTag}!`;
    if (templates && templates.length > 0) {
        const chosenTemplate = templates[Math.floor(Math.random() * templates.length)];
        narrative = chosenTemplate
            .replace(/{alvo}/g, targetTag)
            .replace(/{autor}/g, senderTag);
    }

    const prettyAct = cmdKey.charAt(0).toUpperCase() + cmdKey.slice(1);

    const infoLines = [
        `👤 *${toSmallCaps('autor')}:* ${senderTag}`,
        `🎯 *${toSmallCaps('alvo')}:* ${targetTag}`,
        `🎭 *${toSmallCaps('ato')}:* ${prettyAct}`
    ];

    const card = buildPlayCard({
        title: 'Cena de Interação',
        icon: '🎭',
        infoLines,
        result: narrative
    });

    const mentions = Array.from(new Set([
        ...getMentionJids(targetJid, participants),
        ...getMentionJids(rawTarget, participants),
        ...getMentionJids(sender, participants)
    ]));

    await sendMediaOrText(conn, from, msg, card, mentions, cmdKey);
}

module.exports = {
    name: 'acoes',
    description: 'Comandos de interacao e acoes entre membros',
    aliases,
    run
};
