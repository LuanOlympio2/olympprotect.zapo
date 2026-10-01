// creditos Olympio
const { getOrCriaPlayer, verificarModoRpg, formatOuro } = require('../../funções/rpg/rpgHelper');

const aliases = ['baralho', 'vinteum', 'blackjack', 'cartas'];

const CARTAS = [
    { nome: 'Ás', valor: 11, icone: '🂡' },
    { nome: '2', valor: 2, icone: '🂢' },
    { nome: '3', valor: 3, icone: '🂣' },
    { nome: '4', valor: 4, icone: '🂤' },
    { nome: '5', valor: 5, icone: '🂥' },
    { nome: '6', valor: 6, icone: '🂦' },
    { nome: '7', valor: 7, icone: '🂧' },
    { nome: '8', valor: 8, icone: '🂨' },
    { nome: '9', valor: 9, icone: '🂩' },
    { nome: '10', valor: 10, icone: '🂪' },
    { nome: 'Valete (J)', valor: 10, icone: '🂫' },
    { nome: 'Dama (Q)', valor: 10, icone: '🂭' },
    { nome: 'Rei (K)', valor: 10, icone: '🂮' }
];

function puxarCarta() {
    return CARTAS[Math.floor(Math.random() * CARTAS.length)];
}

function calcularMao(cartas) {
    let total = cartas.reduce((acc, c) => acc + c.valor, 0);
    let asCount = cartas.filter(c => c.nome === 'Ás').length;
    while (total > 21 && asCount > 0) {
        total -= 10;
        asCount -= 1;
    }
    return total;
}

async function run(conn, msg, config, args, sender, senderName) {
    const from = msg.key.remoteJid;
    const prefix = config.prefix || '!';

    if (!(await verificarModoRpg(conn, from, msg, prefix))) return;

    const senderNumber = sender.replace(/[^0-9]/g, '');
    const player = await getOrCriaPlayer(senderNumber, senderName);

    const aposta = parseInt(args[0], 10);

    if (!aposta || aposta <= 0) {
        return await conn.sendMessage(from, {
            text: `🃏 *MESA DE CARTAS 21 DA TAVERNA* 🃏\n\nDesafie as cartas do Taberneiro!\n\nComo jogar:\n👉 *${prefix}baralho <aposta>*\nExemplo: *${prefix}baralho 150*\n\n📜 _Regras:_\n• Quem chegar mais perto de 21 sem estourar vence 2x!\n• Vinte-e-Um imediato (Blackjack) paga 2.5x!\n• A banca compra até 17.`
        }, { quoted: msg });
    }

    if (player.ouro < aposta) {
        return await conn.sendMessage(from, {
            text: `❌ Ouro insuficiente!\n\nVocê apostou *${formatOuro(aposta)}*, mas possui apenas *${formatOuro(player.ouro)}*.`
        }, { quoted: msg });
    }

    const maoJogador = [puxarCarta(), puxarCarta()];
    const maoBanca = [puxarCarta(), puxarCarta()];

    while (calcularMao(maoBanca) < 17) {
        maoBanca.push(puxarCarta());
    }

    const pontosJogador = calcularMao(maoJogador);
    const pontosBanca = calcularMao(maoBanca);

    const cartasJogadorStr = maoJogador.map(c => `[${c.nome}]`).join(' ');
    const cartasBancaStr = maoBanca.map(c => `[${c.nome}]`).join(' ');

    let resultadoMsg = '';

    if (pontosJogador === 21 && maoJogador.length === 2) {
        const lucro = Math.floor(aposta * 1.5);
        player.ouro += lucro;
        resultadoMsg = `🔥 *VINTE-E-UM REAL (BLACKJACK)!* 🔥\nVocê tirou a mão perfeita de primeira e recebeu *2.5x* (+${formatOuro(aposta + lucro)})!`;
    } else if (pontosJogador > 21) {
        player.ouro -= aposta;
        resultadoMsg = `💥 *VOCÊ ESTOUROU!* (${pontosJogador} pontos)\nPassou de 21 e perdeu *-${formatOuro(aposta)}*.`;
    } else if (pontosBanca > 21) {
        player.ouro += aposta;
        resultadoMsg = `🎉 *A BANCA ESTOUROU!* (${pontosBanca} pontos)\nO taberneiro perdeu o controle das cartas e você ganhou *+${formatOuro(aposta * 2)}*!`;
    } else if (pontosJogador > pontosBanca) {
        player.ouro += aposta;
        resultadoMsg = `🎉 *VOCÊ VENCEU A MESA!* (${pontosJogador} vs ${pontosBanca})\nSeu jogo superou o taberneiro! Lucro de *+${formatOuro(aposta * 2)}*!`;
    } else if (pontosJogador === pontosBanca) {
        resultadoMsg = `🤝 *EMPATE NA MESA!* (${pontosJogador} pontos)\nSuas moedas foram devolvidas.`;
    } else {
        player.ouro -= aposta;
        resultadoMsg = `💀 *A BANCA VENCEU!* (${pontosBanca} vs ${pontosJogador})\nO taberneiro recolheu sua aposta de *${formatOuro(aposta)}*.`;
    }

    await player.save();

    let resposta = [
        `🃏 *PARTIDA DE VINTE-E-UM NA TAVERNA* 🃏`,
        ``,
        `👤 Suas Cartas: ${cartasJogadorStr} ➔ *Total: ${pontosJogador}*`,
        `🍺 Cartas da Banca: ${cartasBancaStr} ➔ *Total: ${pontosBanca}*`,
        ``,
        resultadoMsg,
        `🪙 Saldo Atual: *${formatOuro(player.ouro)}*`
    ].join('\n');

    await conn.sendMessage(from, { text: resposta, mentions: [sender] }, { quoted: msg });
}

module.exports = {
    run,
    aliases
};
