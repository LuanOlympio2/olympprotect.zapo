// creditos Olympio
const fs = require('fs');
const path = require('path');
const medidoresData = require('./data/medidoresData.json');
const medidoresGifs = require('./data/medidoresGifs.json');
const { buildPlayCard, buildProgressBar, toSmallCaps } = require('../../funções/layout');
const { findParticipant, formatUserTag, getMentionJids } = require('../../funções/normalizarid');

const aliases = Object.keys(medidoresData);

function getTierInfo(level) {
    if (level <= 20) {
        return { badge: 'Praticamente Isento 🕊️' };
    }
    if (level <= 40) {
        return { badge: 'Nível Discreto 🌱' };
    }
    if (level <= 65) {
        return { badge: 'Nível Moderado ⚖️' };
    }
    if (level <= 85) {
        return { badge: 'Nível Elevado ⚠️' };
    }
    if (level <= 99) {
        return { badge: 'Nível Crítico 🚨' };
    }
    return { badge: 'Lenda Absoluta 👑' };
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

    const cmdKey = medidoresData[commandUsed] ? commandUsed : 'gado';

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
    const tier = getTierInfo(level);

    let template = medidoresData[cmdKey];
    if (!template) {
        template = `${targetTag} apresenta ${level}% em ${cmdKey}!`;
    }

    const verdict = template
        .replace(/{nome}/g, targetTag)
        .replace(/{level}/g, level);

    const prettyAttribute = cmdKey.charAt(0).toUpperCase() + cmdKey.slice(1);

    const infoLines = [
        `👤 *${toSmallCaps('alvo')}:* ${targetTag}`,
        `🎯 *${toSmallCaps('atributo')}:* ${prettyAttribute}`,
        `📊 *${toSmallCaps('nível')}:* ${level}% ${progressBar}`,
        `🏅 *${toSmallCaps('status')}:* ${tier.badge}`
    ];

    const card = buildPlayCard({
        title: 'Termômetro Social',
        icon: '🎯',
        infoLines,
        result: verdict
    });

    const mentions = Array.from(new Set([
        ...getMentionJids(targetJid, participants),
        ...getMentionJids(rawTarget, participants),
        ...getMentionJids(sender, participants)
    ]));

    const gifFileName = medidoresGifs[cmdKey];
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
            console.error('Falha ao enviar midia do medidor:', eMedia?.message || eMedia);
        }
    }

    await conn.sendMessage(from, {
        text: card,
        mentions
    }, { quoted: msg }).catch(async () => {
        await conn.sendMessage(from, { text: card, mentions });
    });
}

module.exports = {
    name: 'medidores',
    description: 'Medidores de porcentagem de brincadeiras',
    aliases,
    run
};
