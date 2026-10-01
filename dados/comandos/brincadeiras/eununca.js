// creditos Olympio
const eununcaList = require('./data/eununcaData.json');

const aliases = ['eununca', 'euja', 'eujá', 'never'];

async function run(conn, msg, config, args, sender, senderName) {
    const from = msg.key.remoteJid;
    const isGroup = from.endsWith('@g.us');

    if (!isGroup) {
        return await conn.sendMessage(from, {
            text: '⚠️ O comando de *Eu Nunca* só pode ser jogado em grupos!'
        }, { quoted: msg });
    }

    try {
        const randomIndex = Math.floor(Math.random() * eununcaList.length);
        let question = eununcaList[randomIndex];

        const cleanQuestion = question.replace(/^eu nunca\s+/i, '');

        await conn.sendMessage(from, {
            poll: {
                name: `🎲 Eu nunca ${cleanQuestion}`,
                values: ['Eu nunca 😇', 'Eu já 😈'],
                selectableCount: 1
            }
        });
    } catch (error) {
        console.error('Erro no comando eununca:', error);
        await conn.sendMessage(from, {
            text: '❌ Ocorreu um erro ao gerar a enquete do Eu Nunca. Tente novamente!'
        }, { quoted: msg });
    }
}

module.exports = {
    name: 'eununca',
    category: 'brincadeiras',
    description: 'Envia uma enquete interativa do jogo Eu Nunca (+550 perguntas)',
    aliases,
    run
};
