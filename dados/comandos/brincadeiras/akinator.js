// creditos Olympio
const akinatorManager = require('../../funções/akinatorManager');

const aliases = ['akinator', 'aki', 'fimaki', 'cancelaraki'];

async function run(conn, msg, config, args, sender, senderName) {
    const from = msg.key.remoteJid;
    const prefix = config.prefix || '!';

    const fullText = msg.message?.conversation ||
                     msg.message?.extendedTextMessage?.text ||
                     msg.message?.imageMessage?.caption ||
                     msg.message?.videoMessage?.caption || '';

    let commandUsed = '';
    if (fullText.startsWith(prefix)) {
        commandUsed = fullText.slice(prefix.length).trim().split(/\s+/)[0].toLowerCase();
    } else {
        commandUsed = aliases.find(a => fullText.toLowerCase().includes(a)) || aliases[0];
    }

    if (['fimaki', 'cancelaraki'].includes(commandUsed) || args[0] === 'cancelar' || args[0] === 'sair') {
        const session = akinatorManager.endSession(from, 'manual');
        if (session) {
            return await conn.sendMessage(from, {
                text: '🛑 O jogo do Akinator foi encerrado com sucesso.'
            }, { quoted: msg });
        } else {
            return await conn.sendMessage(from, {
                text: '❌ Não há nenhuma partida de Akinator em andamento neste momento.'
            }, { quoted: msg });
        }
    }

    await conn.sendMessage(from, {
        text: '🧞‍♂️ *Aguarde...* Invocando o gênio Akinator...'
    }, { quoted: msg });

    const result = await akinatorManager.startSession(from, sender, senderName || 'Jogador');

    if (!result.success) {
        return await conn.sendMessage(from, {
            text: result.message
        }, { quoted: msg });
    }

    return await conn.sendMessage(from, {
        text: result.message,
        mentions: result.mentions || []
    }, { quoted: msg });
}

module.exports = {
    aliases,
    category: 'brincadeiras',
    description: 'Jogue o jogo de adivinhação com o gênio Akinator!',
    run
};
