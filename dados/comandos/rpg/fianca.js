// creditos Olympio
const { getOrCriaPlayer, verificarModoRpg, formatOuro, formatTempoRestante } = require('../../funções/rpg/rpgHelper');

const aliases = ['fianca', 'soltar', 'pagarfianca'];
const VALOR_FIANCA = 250;

async function run(conn, msg, config, args, sender, senderName) {
    const from = msg.key.remoteJid;
    const prefix = config.prefix || '!';

    if (!(await verificarModoRpg(conn, from, msg, prefix))) return;

    const senderNumber = sender.replace(/[^0-9]/g, '');
    const player = await getOrCriaPlayer(senderNumber, senderName);

    if (!player.presoAte || Date.now() >= player.presoAte) {
        player.presoAte = null;
        await player.save();
        return await conn.sendMessage(from, {
            text: `🕊️ *@${senderNumber}*, você é um cidadão livre e não tem nenhuma ordem de prisão ativa!`,
            mentions: [sender]
        }, { quoted: msg });
    }

    const tempoRestante = formatTempoRestante(player.presoAte - Date.now());

    if (player.ouro < VALOR_FIANCA) {
        return await conn.sendMessage(from, {
            text: `❌ Ouro insuficiente para pagar a fiança imperial!\n\nO custo é de *${formatOuro(VALOR_FIANCA)}*, você tem *${formatOuro(player.ouro)}*.\nVocê precisará cumprir o resto da sua pena: *${tempoRestante}*.`
        }, { quoted: msg });
    }

    player.ouro -= VALOR_FIANCA;
    player.presoAte = null;
    await player.save();

    await conn.sendMessage(from, {
        text: `🔓 *FIANÇA PAGA COM SUCESSO!* 🕊️\n\n👤 Libertado: *@${senderNumber}*\n💰 Valor Pago: *${formatOuro(VALOR_FIANCA)}*\n🪙 Saldo Restante: *${formatOuro(player.ouro)}*\n\n✨ As portas da masmorra se abriram! Você já pode trabalhar, pescar e explorar livremente.`,
        mentions: [sender]
    }, { quoted: msg });
}

module.exports = {
    run,
    aliases
};
