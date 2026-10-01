// creditos Olympio
const fs = require('fs');
const path = require('path');
const ranksData = require('./data/ranksData.json');
const { buildPlayCard, buildProgressBar } = require('../../funções/layout');
const { findParticipant, formatUserTag, getMentionJids } = require('../../funções/normalizarid');

const aliases = Object.keys(ranksData);

async function run(conn, msg, config, args, sender, senderName) {
    const from = msg.key.remoteJid;
    const isGroup = from.endsWith('@g.us');
    const prefix = config.prefix || '+';

    if (!isGroup) {
        return await conn.sendMessage(from, { 
            text: 'Este comando só pode ser utilizado em grupos!' 
        }, { quoted: msg });
    }

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

    const cmdKey = ranksData[commandUsed] ? commandUsed : 'rankgado';
    const rankInfo = ranksData[cmdKey];

    try {
        const groupMetadata = await conn.groupMetadata(from);
        const participants = groupMetadata.participants || [];
        const botId = conn.user?.id || '';

        let eligible = participants.filter(p => !p.id.includes(botId.split(':')[0].split('@')[0]));
        if (eligible.length < 2) {
            eligible = participants;
        }

        if (eligible.length < 2) {
            return await conn.sendMessage(from, { 
                text: 'Não há membros suficientes no grupo para formar o pódio!' 
            }, { quoted: msg });
        }

        const count = Math.min(5, eligible.length);
        const shuffled = [...eligible].sort(() => Math.random() - 0.5).slice(0, count);

        const ranked = shuffled.map(member => {
            let realId = member.id;
            if (member.id && member.id.endsWith('@lid')) {
                const found = findParticipant(participants, member.id);
                if (found && found.id) {
                    realId = found.id;
                }
            }
            return {
                jid: realId,
                rawJid: member.id,
                level: Math.floor(Math.random() * 100) + 1
            };
        }).sort((a, b) => b.level - a.level);

        const medals = ['🥇', '🥈', '🥉', '🎖️', '🎖️'];
        const mentions = [];
        ranked.forEach(r => {
            getMentionJids(r.rawJid, participants).forEach(j => {
                if (!mentions.includes(j)) mentions.push(j);
            });
        });

        const cleanTitle = (rankInfo.title || 'Ranking do Grupo').replace(/[\*\_]/g, '');

        const comments = rankInfo.comments || [
            'liderando com folga absoluta',
            'destaque com méritos no grupo',
            'muito forte na disputa',
            'ainda tem chances de recuperação',
            'fechando o top 5 com estilo'
        ];

        let lines = [];
        ranked.forEach((item, index) => {
            const medal = medals[index] || '🎖️';
            const tag = formatUserTag(item.rawJid, participants);
            const progressBar = buildProgressBar(item.level, 8);
            const comment = comments[index % comments.length];

            lines.push(`${medal} ${tag} ↳ *${item.level}%* ${progressBar}`);
            lines.push(`↳ _${comment}_`);
        });

        const card = buildPlayCard({
            title: 'Pódio do Grupo',
            subtitle: cleanTitle,
            icon: '👑',
            lines
        });

        let ranksMidia = {};
        const midiaFile = path.join(__dirname, 'data/ranksMidia.json');
        if (fs.existsSync(midiaFile)) {
            try { ranksMidia = JSON.parse(fs.readFileSync(midiaFile, 'utf8')); } catch (_) {}
        }

        const midiaFileName = ranksMidia[cmdKey];
        const midiaPath = midiaFileName ? path.join(__dirname, 'midia', midiaFileName) : null;

        if (midiaPath && fs.existsSync(midiaPath)) {
            try {
                const fileBuffer = fs.readFileSync(midiaPath);
                const isImage = /\.(jpe?g|png|webp)$/i.test(midiaPath);
                const mediaPayload = isImage
                    ? { image: fileBuffer, caption: card, mentions }
                    : { video: fileBuffer, gifPlayback: true, caption: card, mentions };

                return await conn.sendMessage(from, mediaPayload, { quoted: msg }).catch(async () => {
                    await conn.sendMessage(from, mediaPayload);
                });
            } catch (eMedia) {
                console.error('Falha ao enviar midia do rank:', eMedia?.message || eMedia);
            }
        }

        await conn.sendMessage(from, {
            text: card,
            mentions
        }, { quoted: msg }).catch(async () => {
            await conn.sendMessage(from, { text: card, mentions });
        });

    } catch (e) {
        console.error(`Erro ao executar ${cmdKey}:`, e);
        await conn.sendMessage(from, { 
            text: 'Ocorreu uma instabilidade ao gerar o ranking do grupo.' 
        }, { quoted: msg });
    }
}

module.exports = {
    name: 'ranks',
    description: 'Comandos de ranking de membros do grupo',
    aliases,
    run
};
