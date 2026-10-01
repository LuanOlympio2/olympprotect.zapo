// creditos Olympio
const { buildExtravagantMenu, safeSendMenu, getExtravagantSystemInfo } = require('../../funções/layout');

const aliases = ['menu', 'ajuda', 'help', 'comandos'];

async function run(conn, msg, config, args, sender, senderName) {
    const from = msg.key.remoteJid;
    const { systemInfo, mentions, prefix } = await getExtravagantSystemInfo(config, sender, from, msg, conn);

    const categoryList = [
        `${prefix}menuadm`,
        `${prefix}menuia`,
        `${prefix}menumembro`,
        `${prefix}menudown`,
        `${prefix}menubrincadeira`,
        `${prefix}menurpg`,
        `${prefix}menudono`
    ];

    const text = buildExtravagantMenu({
        headerTitle: '𝑶 𝑳 𝒀 𝑴 𝑷 • 𝑷 𝑹 𝑶 𝑻 𝑬 𝑪 𝑻',
        headerIcon: '⚜️',
        headerSubIcon: '🏛️',
        systemTitle: 'PAINEL DO SISTEMA',
        systemIcon: '👑',
        systemInfo,
        sections: [
            {
                category: 'Menus',
                bannerIcon: '⚔️',
                boxIcon: '🛡️',
                innerIcon: '⚜️',
                cmdIcon: '',
                commands: categoryList
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
