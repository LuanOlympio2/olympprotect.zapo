// creditos Olympio
const { getOrCriaPlayer, verificarModoRpg, formatOuro } = require('../../funções/rpg/rpgHelper');

const aliases = ['sacar', 'saque', 'retirar'];

async function run(conn, msg, config, args, sender, senderName) {
    const from = msg.key.remoteJid;
    const prefix = config.prefix || '!';

    if (!(await verificarModoRpg(conn, from, msg, prefix))) return;

    const senderNumber = sender.replace(/[^0-9]/g, '');
    const player = await getOrCriaPlayer(senderNumber, senderName);

    const valorArg = args[0]?.toLowerCase();

    if (!valorArg) {
        return await conn.sendMessage(from, {
            text: `❌ Quanto você quer sacar do banco?\nExemplo: *${prefix}sacar 200*\nOu retire tudo com *${prefix}sacar tudo*.`
        }, { quoted: msg });
    }

    const ouroBanco = player.ouroBanco || 0;

    let valor = 0;
    if (valorArg === 'tudo' || valorArg === 'all') {
        valor = ouroBanco;
    } else {
        valor = parseInt(valorArg, 10);
    }

    if (!valor || valor <= 0) {
        return await conn.sendMessage(from, { text: '❌ Valor de saque inválido!' }, { quoted: msg });
    }

    if (ouroBanco < valor) {
        return await conn.sendMessage(from, {
            text: `❌ Você não possui *${formatOuro(valor)}* guardados no banco!\nSaldo no cofre: *${formatOuro(ouroBanco)}*.`
        }, { quoted: msg });
    }

    player.ouroBanco = ouroBanco - valor;
    player.ouro = (player.ouro || 0) + valor;

    await player.save();

    await conn.sendMessage(from, {
        text: `🏦 *SAQUE CONCLUÍDO!* 💸\n\n👤 Correntista: *@${senderNumber}*\n💰 Retirado para a Carteira: *+${formatOuro(valor)}*\n👛 Saldo na Carteira: *${formatOuro(player.ouro)}*\n🏛️ Saldo Restante no Cofre: *${formatOuro(player.ouroBanco)}*`,
        mentions: [sender]
    }, { quoted: msg });
}

module.exports = {
    run,
    aliases
};
