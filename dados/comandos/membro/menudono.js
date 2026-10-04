// creditos Olympio
const { buildExtravagantMenu, safeSendMenu, getExtravagantSystemInfo } = require('../../funções/layout');

const aliases = ['menudono', 'menuproprietario', 'ajudadono'];

async function run(conn, msg, config, args, sender, senderName) {
    const from = msg.key.remoteJid;
    const { systemInfo, mentions, prefix } = await getExtravagantSystemInfo(config, sender, from, msg, conn);

    const commands = [
        `${prefix}setprefix`,
        `${prefix}setdono`,
        `${prefix}configbot`,
        `${prefix}antipv`,
        `${prefix}antinuke`,
        `${prefix}blockuser`,
        `${prefix}unblockuser`,
        `${prefix}div`,
        `${prefix}setdiv`,
        `${prefix}reiniciar`,
        `${prefix}update`,
        `${prefix}desligar`,
        `${prefix}ligar`
    ];

    const text = buildExtravagantMenu({
        headerTitle: 'PAINEL DO PROPRIETÁRIO',
        headerIcon: '👑',
        headerSubIcon: '🏛️',
        systemTitle: 'PAINEL DO SISTEMA',
        systemIcon: '👑',
        systemInfo,
        sections: [
            {
                category: 'Comandos Executivos',
                bannerIcon: '👑',
                boxIcon: '⚙️',
                innerIcon: '🔱',
                commands
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
