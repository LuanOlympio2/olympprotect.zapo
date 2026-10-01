// creditos Olympio
const { buildExtravagantMenu, safeSendMenu, getExtravagantSystemInfo } = require('../../funções/layout');

const aliases = ['menurpg', 'rpgmenu', 'rpg', 'ajudarpg'];

function formatList(commands, prefix) {
    return [...commands].sort().map(cmd => `${prefix}${cmd}`);
}

async function run(conn, msg, config, args, sender, senderName) {
    const from = msg.key.remoteJid;
    const { systemInfo, mentions, prefix } = await getExtravagantSystemInfo(config, sender, from, msg, conn);

    const personagem = ['perfilrpg', 'status', 'upar', 'classes', 'habilidades', 'inventario', 'conquistas', 'missoes', 'rankrpg'];
    const combate = ['cacar', 'masmorra', 'chefe', 'duelo', 'explorar', 'viajar', 'mapa', 'descansar'];
    const clas = ['cla', 'criarcla', 'entrarcla', 'doarcla', 'guerracla', 'saircla'];
    const economia = ['trabalhar', 'salario', 'empregos', 'demitir', 'diario', 'banco', 'depositar', 'sacar', 'pixrpg', 'loja', 'comprar', 'vender'];
    const profissao = ['fazenda', 'plantar', 'regar', 'colher', 'minerar', 'pescar', 'forjar', 'alquimia', 'pocao', 'cozinhar', 'receitas', 'pet', 'montaria'];
    const submundo = ['roubar', 'crime', 'karma', 'redencao', 'prisao', 'fianca'];
    const social = ['namorar', 'casar', 'trair', 'historicotraicao', 'divorcio', 'adotar', 'parceiro'];
    const apostas = ['brigadegalo', 'corridacavalo', 'baralho', 'dados', 'moeda', 'quiz', 'clima', 'modorpg'];

    const text = buildExtravagantMenu({
        headerTitle: 'REINO DE RPG',
        headerIcon: '⚔️',
        headerSubIcon: '🏛️',
        systemTitle: 'PAINEL DO SISTEMA',
        systemIcon: '⚔️',
        systemInfo,
        sections: [
            {
                category: 'Personagem e Evolução',
                bannerIcon: '👤',
                boxIcon: '📜',
                innerIcon: '👤',
                commands: formatList(personagem, prefix)
            },
            {
                category: 'Combate e Expedições',
                bannerIcon: '⚔️',
                boxIcon: '🛡️',
                innerIcon: '⚔️',
                commands: formatList(combate, prefix)
            },
            {
                category: 'Reino dos Clãs',
                bannerIcon: '🏰',
                boxIcon: '🚩',
                innerIcon: '🏰',
                commands: formatList(clas, prefix)
            },
            {
                category: 'Economia e Trabalho',
                bannerIcon: '💰',
                boxIcon: '🪙',
                innerIcon: '💰',
                commands: formatList(economia, prefix)
            },
            {
                category: 'Fazenda e Crafting',
                bannerIcon: '🌾',
                boxIcon: '🔨',
                innerIcon: '🌾',
                commands: formatList(profissao, prefix)
            },
            {
                category: 'Submundo do Crime',
                bannerIcon: '🦹',
                boxIcon: '🗝️',
                innerIcon: '🦹',
                commands: formatList(submundo, prefix)
            },
            {
                category: 'Social e Casamento',
                bannerIcon: '💍',
                boxIcon: '❤️',
                innerIcon: '💍',
                commands: formatList(social, prefix)
            },
            {
                category: 'Taverna e Apostas',
                bannerIcon: '🎲',
                boxIcon: '🃏',
                innerIcon: '🎲',
                commands: formatList(apostas, prefix)
            }
        ],
        footerIcons: '✦ ★ ✦'
    });

    await safeSendMenu(conn, from, text, msg, mentions);
}

module.exports = {
    run,
    aliases
};
