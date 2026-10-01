// creditos Olympio
const { buildExtravagantMenu, safeSendMenu, getExtravagantSystemInfo } = require('../../funções/layout');

const aliases = ['menumembro', 'membro', 'menuuser', 'ajudauser'];

async function run(conn, msg, config, args, sender, senderName) {
    const from = msg.key.remoteJid;
    const { systemInfo, mentions, prefix } = await getExtravagantSystemInfo(config, sender, from, msg, conn);

    const commands = [
        `${prefix}sticker`,
        `${prefix}take`,
        `${prefix}togif`,
        `${prefix}toimg`,
        `${prefix}perfil`,
        `${prefix}ping`,
        `${prefix}afk`,
        `${prefix}lembrete`,
        `${prefix}rankativo`,
        `${prefix}rankativog`,
        `${prefix}lyrics`,
        `${prefix}gerarnick`,
        `${prefix}transcrever`,
        `${prefix}renomear`,
        `${prefix}rgtake`,
        `${prefix}criador`,
        `${prefix}dono`
    ];

    const text = buildExtravagantMenu({
        headerTitle: 'MENU DE MEMBROS',
        headerIcon: '👤',
        headerSubIcon: '🏛️',
        systemTitle: 'PAINEL DO SISTEMA',
        systemIcon: '👤',
        systemInfo,
        sections: [
            {
                category: 'Utilitários e Mídias',
                bannerIcon: '🎨',
                boxIcon: '🛡️',
                innerIcon: '👤',
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
