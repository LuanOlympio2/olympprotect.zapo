// creditos Olympio
const { getOrCriaPlayer, verificarModoRpg, formatOuro } = require('../../funções/rpg/rpgHelper');

const aliases = ['banco', 'bank', 'cofre', 'saldo'];

async function run(conn, msg, config, args, sender, senderName) {
    const from = msg.key.remoteJid;
    const prefix = config.prefix || '!';

    if (!(await verificarModoRpg(conn, from, msg, prefix))) return;

    const senderNumber = sender.replace(/[^0-9]/g, '');
    const player = await getOrCriaPlayer(senderNumber, senderName);

    const ouroCarteira = player.ouro || 0;
    const ouroBanco = player.ouroBanco || 0;
    const patrimonioTotal = ouroCarteira + ouroBanco;
    const limiteBanco = player.getLimiteBanco ? player.getLimiteBanco() : 5000000;
    const cofres = player.cofres || 0;

    let texto = [
        `╭─〔 🏛️ *BANCO CENTRAL IMPERIAL DO OLIMPO* 〕`,
        `│ • *Correntista:* ${player.nome}`,
        `│ • *Carteira:* ${formatOuro(ouroCarteira)}`,
        `│ • *Cofre:* ${formatOuro(ouroBanco)} / ${formatOuro(limiteBanco)}`,
        `│ • *Cofres extras:* ${cofres} (+${cofres}M de teto)`,
        `│ • *Patrimônio Total:* *${formatOuro(patrimonioTotal)}*`,
        `╰────────────────────────`,
        ``,
        `💡 *OPERAÇÕES BANCÁRIAS:*`,
        `• *${prefix}depositar <valor|tudo>* - Guardar ouro seguro no cofre`,
        `• *${prefix}sacar <valor|tudo>* - Retirar ouro para a carteira`,
        `• *${prefix}pixrpg @amigo <valor>* - Transferir ouro com segurança`,
        `• *${prefix}comprar cofre* - Ampliar limite em +1.000.000 por cofre (350.000 🪙)`
    ].join('\n');

    await conn.sendMessage(from, { text: texto }, { quoted: msg });
}

module.exports = {
    run,
    aliases
};
