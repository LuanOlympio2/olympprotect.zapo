// creditos Olympio
const { buildExtravagantMenu, safeSendMenu, getExtravagantSystemInfo } = require('../../funções/layout');

const aliases = ['menuadm', 'menuadmin', 'ajudaadm'];

function formatAdminList(commands, prefix) {
    return [...commands].sort().map(cmd => `${prefix}${cmd}`);
}

async function run(conn, msg, config, args, sender, senderName) {
    const from = msg.key.remoteJid;
    const { systemInfo, mentions, prefix } = await getExtravagantSystemInfo(config, sender, from, msg, conn);

    const defesas = ['antilink', 'antilinkgp', 'antifake', 'antipg', 'antispam', 'antinuke', 'antiflood', 'x9', 'antivisu'];
    const bloqueios = ['antiaudio', 'antifoto', 'antivideo', 'antifig', 'antidoc', 'antiloc', 'anticard', 'anticatalogo', 'antimarcar', 'antibtn', 'antistatus'];
    const moderacao = ['ban', 'banghost', 'adv', 'rmadv', 'listanegra', 'rmlistanegra', 'promover', 'rebaixar', 'mute', 'unmute', 'delete', 'revelar'];
    const gestao = ['grupo', 'abrirgp', 'fechargp', 'statusgp', 'donosgp', 'marcar', 'totag', 'linkgp', 'soadm', 'blockcmd', 'bangp', 'setname', 'setdesc', 'setimg', 'modorpg', 'modobrincadeira'];
    const automacoes = ['autobaixar', 'autofig', 'autotranscrever'];
    const boasVindas = ['bemvindo', 'legendabv', 'fundobv', 'saida', 'legendasaida', 'fundosaida'];

    const text = buildExtravagantMenu({
        headerTitle: 'PAINEL DE ADMINISTRAÇÃO',
        headerIcon: '🛡️',
        headerSubIcon: '🏛️',
        systemTitle: 'PAINEL DO SISTEMA',
        systemIcon: '🛡️',
        systemInfo,
        sections: [
            {
                category: 'Defesa e Segurança',
                bannerIcon: '🛡️',
                boxIcon: '🔒',
                innerIcon: '🛡️',
                commands: formatAdminList(defesas, prefix)
            },
            {
                category: 'Travas de Mídia',
                bannerIcon: '🚫',
                boxIcon: '🎬',
                innerIcon: '🚫',
                commands: formatAdminList(bloqueios, prefix)
            },
            {
                category: 'Moderação e Punições',
                bannerIcon: '⚖️',
                boxIcon: '🔨',
                innerIcon: '⚖️',
                commands: formatAdminList(moderacao, prefix)
            },
            {
                category: 'Automações do Grupo',
                bannerIcon: '⚡',
                boxIcon: '🤖',
                innerIcon: '⚙️',
                commands: formatAdminList(automacoes, prefix)
            },
            {
                category: 'Gestão do Grupo',
                bannerIcon: '⚙️',
                boxIcon: '👥',
                innerIcon: '⚙️',
                commands: formatAdminList(gestao, prefix)
            },
            {
                category: 'Boas Vindas e Saída',
                bannerIcon: '👋',
                boxIcon: '🎉',
                innerIcon: '👋',
                commands: formatAdminList(boasVindas, prefix)
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
