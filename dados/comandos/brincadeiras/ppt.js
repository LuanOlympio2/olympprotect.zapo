// creditos Olympio
const { buildPlayCard, toSmallCaps } = require('../../funções/layout');
const { formatUserTag, getMentionJids } = require('../../funções/normalizarid');

const aliases = ['ppt', 'jokenpo', 'pedrapapeltesoura'];

const OPCOES = {
    pedra: { nome: 'Pedra', icon: '🪨', vence: 'tesoura', acao: 'quebrou' },
    papel: { nome: 'Papel', icon: '📄', vence: 'pedra', acao: 'embrulhou' },
    tesoura: { nome: 'Tesoura', icon: '✂️', vence: 'papel', acao: 'cortou' }
};

function normalizarEscolha(str) {
    if (!str) return null;
    const s = str.toLowerCase().trim();
    if (s.includes('ped') || s === 'r' || s.includes('🪨')) return 'pedra';
    if (s.includes('pap') || s === 'p' || s.includes('📄')) return 'papel';
    if (s.includes('tes') || s === 's' || s.includes('✂️')) return 'tesoura';
    return null;
}

async function run(conn, msg, config, args, sender, senderName) {
    const from = msg.key.remoteJid;
    const prefix = config.prefix || '+';

    const playerChoiceKey = normalizarEscolha(args[0]);

    if (!playerChoiceKey) {
        return await conn.sendMessage(from, {
            text: `⚠️ *Como jogar Pedra, Papel e Tesoura:*\n\n👉 *${prefix}ppt pedra*\n👉 *${prefix}ppt papel*\n👉 *${prefix}ppt tesoura*\n\n_Desafie o bot no clássico Jokenpô!_`
        }, { quoted: msg });
    }

    const chaves = ['pedra', 'papel', 'tesoura'];
    const botChoiceKey = chaves[Math.floor(Math.random() * chaves.length)];

    const playerObj = OPCOES[playerChoiceKey];
    const botObj = OPCOES[botChoiceKey];

    let resultado = '';
    let statusEmoji = '';

    if (playerChoiceKey === botChoiceKey) {
        resultado = `🤝 *EMPATE!* Ambos escolheram *${playerObj.nome}* ${playerObj.icon}!`;
        statusEmoji = '⚖️';
    } else if (playerObj.vence === botChoiceKey) {
        resultado = `🎉 *VOCÊ VENCEU!* Sua *${playerObj.nome}* ${playerObj.icon} ${playerObj.acao} o *${botObj.nome}* ${botObj.icon} do Bot!`;
        statusEmoji = '🏆';
    } else {
        resultado = `😢 *VOCÊ PERDEU!* O Bot escolheu *${botObj.nome}* ${botObj.icon} e ${botObj.acao} sua *${playerObj.nome}* ${playerObj.icon}!`;
        statusEmoji = '💀';
    }

    const isGroup = from.endsWith('@g.us');
    const groupMetadata = isGroup ? await conn.groupMetadata(from).catch(() => null) : null;
    const participants = groupMetadata?.participants || [];

    const senderTag = formatUserTag(sender, participants);

    const infoLines = [
        `👤 *${toSmallCaps('jogador')}:* ${senderTag} (${playerObj.nome} ${playerObj.icon})`,
        `🤖 *${toSmallCaps('bot')}:* ${botObj.nome} ${botObj.icon}`,
        `🏅 *${toSmallCaps('resultado')}:* ${statusEmoji}`
    ];

    const card = buildPlayCard({
        title: 'Jokenpô - Pedra, Papel e Tesoura',
        icon: '🎮',
        infoLines,
        result: resultado
    });

    const mentions = getMentionJids(sender, participants);

    await conn.sendMessage(from, {
        text: card,
        mentions
    }, { quoted: msg }).catch(async () => {
        await conn.sendMessage(from, { text: card, mentions });
    });
}

module.exports = {
    name: 'ppt',
    description: 'Jogo de Pedra, Papel e Tesoura contra o Bot',
    aliases,
    run
};
