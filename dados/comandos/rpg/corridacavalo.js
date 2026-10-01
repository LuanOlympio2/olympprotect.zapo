// creditos Olympio
const { getOrCriaPlayer, verificarModoRpg, formatOuro } = require('../../funções/rpg/rpgHelper');

const aliases = ['corridacavalo', 'cavalo', 'hipodromo', 'turfe'];

const CAVALOS = [
    { id: '1', nome: 'Relâmpago Alado', odd: 2.0, peso: 45, icone: '⚡🐎' },
    { id: '2', nome: 'Trovão Negro', odd: 3.0, peso: 30, icone: '🖤🐎' },
    { id: '3', nome: 'Pégaso Dourado', odd: 4.5, peso: 18, icone: '✨🐎' },
    { id: '4', nome: 'Meteoro Vermelho (Azarão)', odd: 10.0, peso: 7, icone: '☄️🐎' }
];

async function run(conn, msg, config, args, sender, senderName) {
    const from = msg.key.remoteJid;
    const prefix = config.prefix || '!';

    if (!(await verificarModoRpg(conn, from, msg, prefix))) return;

    const senderNumber = sender.replace(/[^0-9]/g, '');
    const player = await getOrCriaPlayer(senderNumber, senderName);

    const escolhaArg = args[0]?.toLowerCase();
    const aposta = parseInt(args[1], 10);

    const cavaloEscolhido = CAVALOS.find(c => c.id === escolhaArg || c.nome.toLowerCase().includes(escolhaArg));

    if (!cavaloEscolhido || !aposta || aposta <= 0) {
        let texto = `╭─〔 🏇 *GRANDE HIPÓDROMO DO OLIMPO* 〕\n`;
        texto += `│ _Aposte nos cavalos puro-sangue e multiplique suas moedas!_\n`;

        CAVALOS.forEach(c => {
            texto += `│ [${c.id}] ${c.icone} *${c.nome}*\n`;
            texto += `│     💰 Retorno (Odd): *${c.odd}x*\n`;
        });

        texto += `╰────────────────────────\n`;
        texto += `👉 *${prefix}corridacavalo <número_do_cavalo> <valor>*\nExemplo: *${prefix}corridacavalo 1 300*\nExemplo: *${prefix}corridacavalo 4 100* (Azarão paga 10x!)`;

        return await conn.sendMessage(from, { text: texto }, { quoted: msg });
    }

    if (player.ouro < aposta) {
        return await conn.sendMessage(from, {
            text: `❌ Ouro insuficiente!\n\nVocê apostou *${formatOuro(aposta)}*, mas possui apenas *${formatOuro(player.ouro)}*.`
        }, { quoted: msg });
    }

    const totalPesos = CAVALOS.reduce((acc, c) => acc + c.peso, 0);
    let sorteio = Math.random() * totalPesos;
    let vencedor = CAVALOS[0];

    for (const c of CAVALOS) {
        if (sorteio < c.peso) {
            vencedor = c;
            break;
        }
        sorteio -= c.peso;
    }

    const acertou = cavaloEscolhido.id === vencedor.id;

    const pista = CAVALOS.map(c => {
        const isWinner = c.id === vencedor.id;
        const avanco = isWinner ? '══════════🏁' : '═══════     ';
        return `[${c.id}] ${c.icone} ${avanco} ${isWinner ? '🥇' : ''}`;
    }).join('\n');

    let resultadoMsg = '';
    if (acertou) {
        const premioTotal = Math.floor(aposta * cavaloEscolhido.odd);
        const lucro = premioTotal - aposta;
        player.ouro += lucro;
        resultadoMsg = `🎉 *SEU CAVALO CRUZOU A LINHA EM 1º LUGAR!* 🏆\nVocê faturou a odd de *${cavaloEscolhido.odd}x* (+${formatOuro(premioTotal)})!`;
    } else {
        player.ouro -= aposta;
        resultadoMsg = `💀 Seu cavalo ficou para trás na reta final!\nVocê perdeu *-${formatOuro(aposta)}*.`;
    }

    await player.save();

    let resposta = [
        `🏇💨 *LARGADA NO HIPÓDROMO DO IMPÉRIO!* 💨🏇`,
        ``,
        pista,
        ``,
        `🥇 *1º LUGAR:* ${vencedor.icone} *${vencedor.nome}* (Odd: ${vencedor.odd}x)!`,
        ``,
        `👤 Apostador: *@${senderNumber}*`,
        resultadoMsg,
        `🪙 Saldo Atual: *${formatOuro(player.ouro)}*`
    ].join('\n');

    await conn.sendMessage(from, { text: resposta, mentions: [sender] }, { quoted: msg });
}

module.exports = {
    run,
    aliases
};
