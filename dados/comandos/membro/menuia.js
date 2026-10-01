// creditos Olympio
const { buildExtravagantMenu, safeSendMenu, getExtravagantSystemInfo } = require('../../funções/layout');

const aliases = ['menuia', 'ajudaia', 'ia'];

async function run(conn, msg, config, args, sender, senderName) {
    const from = msg.key.remoteJid;
    const { systemInfo, mentions, prefix } = await getExtravagantSystemInfo(config, sender, from, msg, conn);

    const commands = [
        `${prefix}gemini`,
        `${prefix}chatgpt`,
        `${prefix}deepseek`,
        `${prefix}qwen`,
        `${prefix}ia`,
        `${prefix}bot`,
        `${prefix}transcrever`,
        `${prefix}autotranscrever`
    ];

    const text = buildExtravagantMenu({
        headerTitle: 'INTELIGÊNCIA ARTIFICIAL',
        headerIcon: '🤖',
        headerSubIcon: '🏛️',
        systemTitle: 'PAINEL DO SISTEMA',
        systemIcon: '🤖',
        systemInfo,
        sections: [
            {
                category: 'Modelos de IA e Voz',
                bannerIcon: '🧠',
                boxIcon: '🤖',
                innerIcon: '✨',
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
