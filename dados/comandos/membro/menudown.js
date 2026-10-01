// creditos Olympio
const { buildExtravagantMenu, safeSendMenu, getExtravagantSystemInfo } = require('../../funções/layout');

const aliases = ['menudown', 'menudownload', 'menudownloads', 'downloads'];

async function run(conn, msg, config, args, sender, senderName) {
    const from = msg.key.remoteJid;
    const { systemInfo, mentions, prefix } = await getExtravagantSystemInfo(config, sender, from, msg, conn);

    const commands = [
        `${prefix}play`,
        `${prefix}playvid`,
        `${prefix}youtube`,
        `${prefix}instagram`,
        `${prefix}tiktok`,
        `${prefix}pinterest`,
        `${prefix}facebook`,
        `${prefix}twitter`,
        `${prefix}reddit`
    ];

    const guide = [
        `Músicas: ${prefix}play Nome da Música`,
        `Vídeos: ${prefix}playvid Nome do Vídeo`,
        `Links: ${prefix}instagram link_do_post`
    ];

    const text = buildExtravagantMenu({
        headerTitle: 'CENTRAL DE DOWNLOADS',
        headerIcon: '📥',
        headerSubIcon: '🏛️',
        systemTitle: 'PAINEL DO SISTEMA',
        systemIcon: '📥',
        systemInfo,
        sections: [
            {
                category: 'Plataformas Suportadas',
                bannerIcon: '📥',
                boxIcon: '🌐',
                innerIcon: '📥',
                commands
            },
            {
                category: 'Instruções Rápidas',
                bannerIcon: '💡',
                boxIcon: '📝',
                innerIcon: '📌',
                lines: guide
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
