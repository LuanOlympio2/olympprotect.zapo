// creditos Olympio
const { buildPlayCard, toSmallCaps } = require('../../funções/layout');
const { formatUserTag, getMentionJids } = require('../../funções/normalizarid');

const aliases = ['sn', 'simnao', 'simounao'];

const respostasSim = [
    'Com toda certeza do mundo! Vai sem medo.',
    'Sim! Os deuses de Olimpo conspiram a seu favor.',
    'Totalmente sim! Não pense duas vezes.',
    'Com certeza, as energias são 100% positivas!',
    'Sim, é o seu momento de brilhar!',
    'Claro que sim, nem precisa ter dúvida.',
    'Sim! O destino já decidiu por você.'
];

const respostasNao = [
    'Nem a pau! Fique bem longe disso.',
    'Não! Os astros alertam que vai dar ruim.',
    'Definitivamente não! Não insista.',
    'Chance zero, fuja enquanto há tempo!',
    'Não! Melhor repensar todas as suas escolhas de vida.',
    'Nem pensar, as probabilidades estão contra você.',
    'Não! O universo mandou avisar que é cilada.'
];

async function run(conn, msg, config, args, sender, senderName) {
    const from = msg.key.remoteJid;
    const prefix = config.prefix || '!';

    const quotedText = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage?.conversation ||
                       msg.message?.extendedTextMessage?.contextInfo?.quotedMessage?.extendedTextMessage?.text || '';

    let pergunta = args.join(' ').trim() || quotedText.trim();
    if (!pergunta) {
        pergunta = 'Devo arriscar tudo hoje?';
    }

    const isGroup = from.endsWith('@g.us');
    const groupMetadata = isGroup ? await conn.groupMetadata(from).catch(() => null) : null;
    const participants = groupMetadata?.participants || [];

    const isSim = Math.random() < 0.5;
    const porcentagem = Math.floor(Math.random() * 41) + 60;
    const frase = isSim 
        ? respostasSim[Math.floor(Math.random() * respostasSim.length)]
        : respostasNao[Math.floor(Math.random() * respostasNao.length)];

    const resultadoTexto = isSim ? '🟢 SIM' : '🔴 NÃO';
    const tagSender = formatUserTag(sender, participants);

    const card = buildPlayCard({
        title: 'ORÁCULO SIM OU NÃO',
        subtitle: `Consulta de ${senderName || tagSender}`,
        icon: '🔮',
        infoLines: [
            `👤 *${toSmallCaps('consultante')}:* ${tagSender}`,
            `❓ *${toSmallCaps('pergunta')}:* ${pergunta}`,
            `🎯 *${toSmallCaps('certeza')}:* ${porcentagem}%`
        ],
        result: `${resultadoTexto}!\n\n💬 _${frase}_`
    });

    await conn.sendMessage(from, {
        text: card,
        mentions: getMentionJids(sender, participants)
    }, { quoted: msg });
}

module.exports = {
    name: 'sn',
    category: 'brincadeiras',
    description: 'Responde qualquer pergunta com SIM ou NÃO de forma definitiva',
    aliases,
    run
};
