// creditos Olympio
const { getOrCriaPlayer, verificarModoRpg, formatOuro } = require('../../funções/rpg/rpgHelper');

const aliases = ['dados', 'jogardados', 'dice', 'craps'];

const DADOS_EMOJIS = ['', '⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];

async function run(conn, msg, config, args, sender, senderName) {
    const from = msg.key.remoteJid;
    const prefix = config.prefix || '!';

    if (!(await verificarModoRpg(conn, from, msg, prefix))) return;

    const senderNumber = sender.replace(/[^0-9]/g, '');
    const player = await getOrCriaPlayer(senderNumber, senderName);

    const aposta = parseInt(args[0], 10);

    if (!aposta || aposta <= 0) {
        return await conn.sendMessage(from, {
            text: `🎲 *JOGO DE DADOS DA TAVERNA MEDIEVAL* 🎲\n\nDesafie os dados contra o taberneiro!\n\nComo jogar:\n👉 *${prefix}dados <valor_da_aposta>*\nExemplo: *${prefix}dados 100*\n\n📜 _Regras:_\n• Quem tirar a maior soma nos dois dados vence 2x!\n• Se tirar dados iguais (par da sorte), ganha 3x!\n• Empate devolve as moedas.`
        }, { quoted: msg });
    }

    if (player.ouro < aposta) {
        return await conn.sendMessage(from, {
            text: `❌ Ouro insuficiente!\n\nVocê apostou *${formatOuro(aposta)}*, mas possui apenas *${formatOuro(player.ouro)}*.`
        }, { quoted: msg });
    }

    const d1Jogador = Math.floor(Math.random() * 6) + 1;
    const d2Jogador = Math.floor(Math.random() * 6) + 1;
    const totalJogador = d1Jogador + d2Jogador;
    const parDaSorte = d1Jogador === d2Jogador;

    const d1Banca = Math.floor(Math.random() * 6) + 1;
    const d2Banca = Math.floor(Math.random() * 6) + 1;
    const totalBanca = d1Banca + d2Banca;

    let resultadoTexto = '';

    if (parDaSorte && totalJogador >= totalBanca) {
        const lucro = aposta * 2;
        player.ouro += lucro;
        resultadoTexto = `🔥 *PAR DA SORTE! VITÓRIA CRÍTICA!*\nVocê tirou uma dupla de ${d1Jogador}! Recebeu *3x a aposta* (+${formatOuro(aposta * 3)})!`;
    } else if (totalJogador > totalBanca) {
        const lucro = aposta;
        player.ouro += lucro;
        resultadoTexto = `🎉 *VOCÊ VENCEU A RODADA!*\nSua pontuação superou o taberneiro! Recebeu *+${formatOuro(aposta * 2)}*!`;
    } else if (totalJogador === totalBanca) {
        resultadoTexto = `🤝 *EMPATE NA MESA!*\nAs pontuações foram iguais. Sua aposta de *${formatOuro(aposta)}* foi devolvida.`;
    } else {
        player.ouro -= aposta;
        resultadoTexto = `💀 *A BANCA DA TAVERNA VENCEU!*\nO taberneiro recolheu seus *${formatOuro(aposta)}*.`;
    }

    await player.save();

    let resposta = [
        `🎲 *ROLAGEM DE DADOS NA MESA DA TAVERNA* 🎲`,
        ``,
        `👤 Jogador: *@${senderNumber}*`,
        `🎲 Seus Dados: ${DADOS_EMOJIS[d1Jogador]} (${d1Jogador}) + ${DADOS_EMOJIS[d2Jogador]} (${d2Jogador}) ➔ *Total: ${totalJogador}*`,
        `🍺 Dados do Taberneiro: ${DADOS_EMOJIS[d1Banca]} (${d1Banca}) + ${DADOS_EMOJIS[d2Banca]} (${d2Banca}) ➔ *Total: ${totalBanca}*`,
        ``,
        resultadoTexto,
        `🪙 Saldo Atual: *${formatOuro(player.ouro)}*`
    ].join('\n');

    await conn.sendMessage(from, { text: resposta, mentions: [sender] }, { quoted: msg });
}

module.exports = {
    run,
    aliases
};
