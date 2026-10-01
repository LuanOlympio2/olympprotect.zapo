// creditos Olympio
const { buildExtravagantMenu, safeSendMenu, getExtravagantSystemInfo } = require('../../funções/layout');

const aliases = ['menubrincadeira', 'brincadeira', 'diversao', 'menudiversao'];

function formatList(commands, prefix) {
    return [...commands].sort().map(cmd => `${prefix}${cmd}`);
}

async function run(conn, msg, config, args, sender, senderName) {
    const from = msg.key.remoteJid;
    const { systemInfo, mentions, prefix } = await getExtravagantSystemInfo(config, sender, from, msg, conn);

    const interacoes = [
        'abracar', 'abraco', 'bater', 'beijar', 'beijarb', 'beijo', 'beijob',
        'cafune', 'chutar', 'chute', 'explodir', 'goza', 'gozar', 'lamber',
        'lambida', 'mamada', 'mamar', 'mata', 'matar', 'mordida', 'morder',
        'proteger', 'sexo', 'socar', 'soco', 'surubao', 'tapa', 'tapar'
    ];

    const ranks = [
        'rankbraba', 'rankbrabo', 'rankburra', 'rankburro', 'rankcharmosa',
        'rankcharmoso', 'rankcorna', 'rankcorno', 'rankengracada', 'rankengracado',
        'rankfiel', 'rankforte', 'rankgada', 'rankgado', 'rankgay', 'rankgostosa',
        'rankgostoso', 'rankinfiel', 'rankinteligente', 'ranklesbica', 'ranklinda',
        'rankmacho', 'rankmalandra', 'rankmalandro', 'ranknazista', 'ranknerd',
        'rankotaku', 'rankpegador', 'rankpegadora', 'rankpobre', 'rankpoderosa',
        'rankpoderoso', 'rankrica', 'rankrico', 'ranktrabalhador', 'ranktrabalhadora',
        'rankvencedor', 'rankvencedora', 'rankvisionaria', 'rankvisionario'
    ];

    const jogosEDesafios = [
        'akinator', 'casal', 'chance', 'cu', 'eununca', 'jogodavelha', 'ppt', 'quando', 'shipo', 'sn', 'sorte', 'suicidio', 'vab'
    ];

    const brincadeirasHomem = [
        'azarado', 'bandido', 'bebado', 'billionario', 'bobo', 'bolsonarista',
        'brabo', 'brincalhao', 'burro', 'cachorro', 'carinhoso', 'charmoso',
        'chato', 'chefao', 'chorao', 'ciumento', 'comedia', 'comunista',
        'coragem', 'corajoso', 'corno', 'covarde', 'desumilde', 'engracado',
        'esperto', 'feio', 'fiel', 'fortao', 'forte', 'fraco',
        'gado', 'gamer', 'gay', 'global', 'gostoso', 'homofobico',
        'humilde', 'independente', 'infantil', 'infiel', 'inseguro', 'inteligente',
        'introvertido', 'irresponsavel', 'ladrao', 'liberal', 'lider', 'lindo',
        'local', 'lulista', 'machista', 'macho', 'maduro', 'magrelo',
        'malandro', 'misterioso', 'mito', 'moderno', 'nazista', 'nerd',
        'nervoso', 'offline', 'online', 'otaku', 'otario', 'otimista',
        'padrao', 'patriotico', 'pegador', 'pessimista', 'petista', 'pilantra',
        'pirocudo', 'pobre', 'poderoso', 'pratico', 'preguicoso', 'programador',
        'psicopata', 'racista', 'realista', 'rei', 'religioso', 'responsavel',
        'rico', 'romantico', 'rural', 'safado', 'saudavel', 'seguidor',
        'senhor', 'serio', 'simpatico', 'social', 'solitario', 'sonhador',
        'sortudo', 'supersticioso', 'talarico', 'tecnologico', 'tradicional', 'traicao',
        'traidor', 'trabalhador', 'urbano', 'vagabundo', 'vencedor', 'vesgo',
        'viajante', 'visionario', 'zueiro'
    ];

    const brincadeirasMulher = [
        'azarada', 'bandida', 'bebada', 'billionaria', 'boba', 'bolsonarista',
        'braba', 'brincalhona', 'bucetuda', 'burra', 'cachorra', 'cadela',
        'carinhosa', 'charmosa', 'chata', 'chefa', 'chefona', 'chorona',
        'ciumenta', 'comedia', 'comunista', 'coragem', 'corajosa', 'corna',
        'covarde', 'desumilde', 'engracada', 'esperta', 'feia', 'femea',
        'fiel', 'fortona', 'forte', 'fraca', 'gada', 'gamer',
        'global', 'gostosa', 'homofobica', 'humilde', 'independente', 'infantil',
        'infiel', 'insegura', 'inteligente', 'introvertida', 'irresponsavel', 'ladra',
        'lesbica', 'liberal', 'lider', 'linda', 'local', 'lulista',
        'machista', 'madura', 'magrela', 'malandra', 'misteriosa', 'mito',
        'moderna', 'mulher', 'nazista', 'nerd', 'nervosa', 'offline',
        'online', 'otaka', 'otaria', 'otimista', 'otome', 'padrao',
        'patriotica', 'pegadora', 'peituda', 'pessimista', 'petista', 'pilantra',
        'pobre', 'poderosa', 'pratica', 'preguicosa', 'programadora', 'psicopata',
        'racista', 'rainha', 'realista', 'religiosa', 'responsavel', 'rica',
        'romantica', 'rural', 'safada', 'saudavel', 'seguidora', 'senhora',
        'seria', 'simpatica', 'social', 'solitaria', 'sonhadora', 'sortuda',
        'supersticiosa', 'talarica', 'tecnologica', 'tradicional', 'traicao', 'traidora',
        'trabalhadora', 'urbana', 'vagabunda', 'vencedora', 'vesga', 'viajante',
        'visionaria', 'zueira'
    ];

    const text = buildExtravagantMenu({
        headerTitle: 'ARENA DE BRINCADEIRAS',
        headerIcon: '🎭',
        headerSubIcon: '🏛️',
        systemTitle: 'PAINEL DO SISTEMA',
        systemIcon: '🎭',
        systemInfo,
        sections: [
            {
                category: 'Jogos e Desafios',
                bannerIcon: '🎲',
                boxIcon: '🎯',
                innerIcon: '🎮',
                commands: formatList(jogosEDesafios, prefix)
            },
            {
                category: 'Pódios e Ranks',
                bannerIcon: '👑',
                boxIcon: '🏆',
                innerIcon: '👑',
                commands: formatList(ranks, prefix)
            },
            {
                category: 'Ações e Interações',
                bannerIcon: '🎭',
                boxIcon: '💬',
                innerIcon: '🎭',
                commands: formatList(interacoes, prefix)
            },
            {
                category: 'Brincadeira Homem',
                bannerIcon: '🎩',
                boxIcon: '♂️',
                innerIcon: '⚡',
                commands: formatList(brincadeirasHomem, prefix)
            },
            {
                category: 'Brincadeira Mulher',
                bannerIcon: '👑',
                boxIcon: '♀️',
                innerIcon: '✨',
                commands: formatList(brincadeirasMulher, prefix)
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
