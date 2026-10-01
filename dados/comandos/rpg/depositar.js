// creditos Olympio
const { getOrCriaPlayer, verificarModoRpg, formatOuro } = require('../../funções/rpg/rpgHelper');

const aliases = ['depositar', 'dep', 'guardar'];

async function run(conn, msg, config, args, sender, senderName) {
    const from = msg.key.remoteJid;
    const prefix = config.prefix || '!';

    if (!(await verificarModoRpg(conn, from, msg, prefix))) return;

    const senderNumber = sender.replace(/[^0-9]/g, '');
    const player = await getOrCriaPlayer(senderNumber, senderName);

    const valorArg = args[0]?.toLowerCase();

    if (!valorArg) {
        return await conn.sendMessage(from, {
            text: `❌ Quanto você quer depositar no cofre?\nExemplo: *${prefix}depositar 500*\nOu guarde tudo com *${prefix}depositar tudo*.`
        }, { quoted: msg });
    }

    let valor = 0;
    if (valorArg === 'tudo' || valorArg === 'all') {
        valor = player.ouro;
    } else {
        valor = parseInt(valorArg, 10);
    }

    if (!valor || valor <= 0) {
        return await conn.sendMessage(from, { text: '❌ Valor de depósito inválido!' }, { quoted: msg });
    }

    if (player.ouro < valor) {
        return await conn.sendMessage(from, {
            text: `❌ Você não possui *${formatOuro(valor)}* na carteira!\nSaldo disponível: *${formatOuro(player.ouro)}*.`
        }, { quoted: msg });
    }

    const limiteBanco = player.getLimiteBanco ? player.getLimiteBanco() : 5000000;
    const espacoDisponivel = Math.max(0, limiteBanco - (player.ouroBanco || 0));

    if (espacoDisponivel <= 0) {
        return await conn.sendMessage(from, {
            text: `🏛️ *COFRE IMPERIAL LOTADO!* 🔒\n\nSeu cofre atingiu a capacidade máxima de *${formatOuro(limiteBanco)}*!\n\n💡 Adquira novos cofres na loja com *${prefix}comprar cofre* para expandir seu teto em *+1.000.000 de ouro* por cofre!`
        }, { quoted: msg });
    }

    let valorDepositado = valor;
    let sobrouParaCarteira = 0;

    if (valorDepositado > espacoDisponivel) {
        valorDepositado = espacoDisponivel;
        sobrouParaCarteira = valor - valorDepositado;
    }

    player.ouro -= valorDepositado;
    player.ouroBanco = (player.ouroBanco || 0) + valorDepositado;

    await player.save();

    let resposta = [
        `🏦 *DEPÓSITO REALIZADO COM SUCESSO!* 🔒`,
        ``,
        `👤 Correntista: *@${senderNumber}*`,
        `💰 Guardado no Cofre: *+${formatOuro(valorDepositado)}*`,
        `👛 Saldo na Carteira: *${formatOuro(player.ouro)}*`,
        `🏛️ Total no Banco Imperial: *${formatOuro(player.ouroBanco)} / ${formatOuro(limiteBanco)}*`
    ];

    if (sobrouParaCarteira > 0) {
        resposta.push(``);
        resposta.push(`⚠️ *Aviso de Capacidade:* Seu cofre atingiu o limite máximo! *${formatOuro(sobrouParaCarteira)}* permaneceram na sua carteira.`);
        resposta.push(`💡 Digite *${prefix}comprar cofre* para aumentar seu limite em +1M!`);
    } else {
        resposta.push(``);
        resposta.push(`✨ _Seu ouro agora está 100% protegido contra ladrões!_`);
    }

    await conn.sendMessage(from, {
        text: resposta.join('\n'),
        mentions: [sender]
    }, { quoted: msg });
}

module.exports = {
    run,
    aliases
};
