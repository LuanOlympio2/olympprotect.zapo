// creditos Olympio
const { getOrCriaPlayer, verificarModoRpg, formatOuro } = require('../../funções/rpg/rpgHelper');

const aliases = ['redencao', 'reza', 'penitencia', 'perdao', 'templo'];

async function run(conn, msg, config, args, sender, senderName) {
    const from = msg.key.remoteJid;
    const prefix = config.prefix || '!';

    if (!(await verificarModoRpg(conn, from, msg, prefix))) return;

    const senderNumber = sender.replace(/[^0-9]/g, '');
    const player = await getOrCriaPlayer(senderNumber, senderName);

    const valorArg = args[0]?.toLowerCase();

    if (!valorArg) {
        return await conn.sendMessage(from, {
            text: `╭─〔 🏛️ *TEMPLO SAGRADO DE ATENA* 〕\n│ _"Aos de coração arrependido, as águas sagradas lavam todo pecado."_\n│ 👤 Seu Karma Atual: *${player.karma || 0}*\n│ 🪙 Taxa de Redenção: *200 de Ouro = +1 Ponto de Karma*\n╰────────────────────────\n\n👉 Faça sua doação ao templo:\n*${prefix}redencao <quantidade_ouro>*\nExemplo: *${prefix}redencao 1000* (+5 de Karma)`
        }, { quoted: msg });
    }

    const valorOuro = parseInt(valorArg, 10);
    if (!valorOuro || valorOuro < 200) {
        return await conn.sendMessage(from, {
            text: `❌ O valor mínimo de doação para redenção no altar é de *200 moedas de ouro* (+1 de Karma).`
        }, { quoted: msg });
    }

    if (player.ouro < valorOuro) {
        return await conn.sendMessage(from, {
            text: `❌ Você não possui *${formatOuro(valorOuro)}* na carteira!\nSaldo atual: *${formatOuro(player.ouro)}*.`
        }, { quoted: msg });
    }

    const karmaGanho = Math.floor(valorOuro / 200);
    const ouroCobrado = karmaGanho * 200;

    player.ouro -= ouroCobrado;
    player.karma = (player.karma || 0) + karmaGanho;

    await player.save();

    await conn.sendMessage(from, {
        text: `🕊️ *BÊNÇÃO DE PURIFICAÇÃO RECEBIDA!* 🏛️\n\n👤 Fiel: *@${senderNumber}*\n🪙 Oferenda Entregue: *${formatOuro(ouroCobrado)}*\n✨ Karma Restaurado: *+${karmaGanho} Pontos*\n🔮 Novo Karma Total: *${player.karma}*\n\n_As sacerdotisas de Atena entoaram cânticos de paz por sua alma!_`,
        mentions: [sender]
    }, { quoted: msg });
}

module.exports = {
    run,
    aliases
};
