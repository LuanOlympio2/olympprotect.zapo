// creditos Olympio
const vabList = require('./data/vabData.json');

const aliases = ['vab', 'voceprefere', 'vocêprefere', 'prefere', 'preferencia'];

async function run(conn, msg, config, args, sender, senderName) {
    const from = msg.key.remoteJid;
    const isGroup = from.endsWith('@g.us');

    if (!isGroup) {
        return await conn.sendMessage(from, {
            text: '⚠️ O comando de *Você Prefere* só pode ser jogado em grupos!'
        }, { quoted: msg });
    }

    try {
        const randomIndex = Math.floor(Math.random() * vabList.length);
        const item = vabList[randomIndex];

        let title = `⚖️ Você prefere: ${item.option1} OU ${item.option2}?`;
        if (title.length > 255) {
            title = '⚖️ O que você prefere?';
        }

        const opt1 = item.option1.length > 100 ? item.option1.slice(0, 97) + '...' : item.option1;
        const opt2 = item.option2.length > 100 ? item.option2.slice(0, 97) + '...' : item.option2;

        await conn.sendMessage(from, {
            poll: {
                name: title,
                values: [opt1, opt2],
                selectableCount: 1
            }
        });
    } catch (error) {
        console.error('Erro no comando vab:', error);
        await conn.sendMessage(from, {
            text: '❌ Ocorreu um erro ao enviar a enquete. Tente novamente!'
        }, { quoted: msg });
    }
}

module.exports = {
    name: 'vab',
    category: 'brincadeiras',
    description: 'Envia uma enquete dupla do Você Prefere com dilemas absurdos (+550 opções)',
    aliases,
    run
};
