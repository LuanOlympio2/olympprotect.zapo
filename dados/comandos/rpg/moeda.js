// creditos Olympio
const { getOrCriaPlayer, verificarModoRpg, formatOuro } = require('../../funções/rpg/rpgHelper');

const aliases = ['moeda', 'caraoucoroa', 'flip', 'coinflip'];

async function run(conn, msg, config, args, sender, senderName) {
    const from = msg.key.remoteJid;
    const prefix = config.prefix || '!';

    if (!(await verificarModoRpg(conn, from, msg, prefix))) return;

    const senderNumber = sender.replace(/[^0-9]/g, '');
    const player = await getOrCriaPlayer(senderNumber, senderName);

    const escolha = args[0]?.toLowerCase();
    const aposta = parseInt(args[1], 10);

    if (!escolha || (escolha !== 'cara' && escolha !== 'coroa') || !aposta || aposta <= 0) {
        return await conn.sendMessage(from, {
            text: `🪙 *FLIP DE MOEDA IMPERIAL* 🪙\n\nComo jogar:\n👉 *${prefix}moeda <cara|coroa> <valor>*\n\nExemplo: *${prefix}moeda cara 100*\nExemplo: *${prefix}moeda coroa 250*`
        }, { quoted: msg });
    }

    if (player.ouro < aposta) {
        return await conn.sendMessage(from, {
            text: `❌ Ouro insuficiente!\n\nVocê apostou *${formatOuro(aposta)}*, mas possui apenas *${formatOuro(player.ouro)}*.`
        }, { quoted: msg });
    }

    const resultadoSorteado = Math.random() < 0.5 ? 'cara' : 'coroa';
    const iconeResultado = resultadoSorteado === 'cara' ? '👤 *CARA*' : '👑 *COROA*';
    const ganhou = escolha === resultadoSorteado;

    if (ganhou) {
        const lucro = aposta;
        player.ouro += lucro;
        await player.save();

        let resposta = [
            `🪙 *A MOEDA GIROU NO AR... E CAIU!* 🪙`,
            ``,
            `Resultado: ${iconeResultado}!`,
            `🎉 *@${senderNumber}*, você acertou em cheio!`,
            `💰 Prêmio: *+${formatOuro(aposta * 2)}* (Lucro líquido: +${formatOuro(lucro)})`,
            `🪙 Saldo Atual: *${formatOuro(player.ouro)}*`
        ].join('\n');

        return await conn.sendMessage(from, { text: resposta, mentions: [sender] }, { quoted: msg });
    } else {
        player.ouro -= aposta;
        await player.save();

        let resposta = [
            `🪙 *A MOEDA GIROU NO AR... E CAIU!* 🪙`,
            ``,
            `Resultado: ${iconeResultado}!`,
            `💀 Que azar, *@${senderNumber}*! A moeda caiu no lado oposto.`,
            `💸 Ouro Perdido: *-${formatOuro(aposta)}*`,
            `🪙 Saldo Restante: *${formatOuro(player.ouro)}*`
        ].join('\n');

        return await conn.sendMessage(from, { text: resposta, mentions: [sender] }, { quoted: msg });
    }
}

module.exports = {
    run,
    aliases
};
