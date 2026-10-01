// creditos Olympio
const { getOrCriaPlayer, verificarModoRpg, formatOuro, formatTempoRestante } = require('../../funções/rpg/rpgHelper');

const aliases = ['diario', 'daily', 'recompensa'];
const COOLDOWN_DIARIO = 24 * 60 * 60 * 1000; 

async function run(conn, msg, config, args, sender, senderName) {
    const from = msg.key.remoteJid;
    const prefix = config.prefix || '!';

    if (!(await verificarModoRpg(conn, from, msg, prefix))) return;

    const senderNumber = sender.replace(/[^0-9]/g, '');
    const player = await getOrCriaPlayer(senderNumber, senderName);

    const agora = Date.now();
    if (!player.cooldowns) player.cooldowns = {};
    const ultimoDiario = player.cooldowns.diario || 0;

    if (agora - ultimoDiario < COOLDOWN_DIARIO) {
        const restante = formatTempoRestante(COOLDOWN_DIARIO - (agora - ultimoDiario));
        return await conn.sendMessage(from, {
            text: `⏳ *@${senderNumber}*, você já resgatou sua recompensa diária hoje!\n\nVolte em *${restante}* para resgatar mais suprimentos.`,
            mentions: [sender]
        }, { quoted: msg });
    }

    let ouroGanho = Math.floor(player.nivel * 50) + 400 + Math.floor(Math.random() * 200);
    const xpGanho = 80 + (player.nivel * 15);

    let ouroFilhos = 0;
    const filhos = player.relacionamento?.filhos || [];
    if (filhos.length > 0) {
        filhos.forEach(f => {
            ouroFilhos += f.ouroDiario || 50;
        });
    }

    const totalOuro = ouroGanho + ouroFilhos;
    player.ouro += totalOuro;
    player.regenerarEstamina();
    player.estamina = player.estaminaMax; 
    player.hp = player.hpMax; 
    player.cooldowns.diario = agora;

    if (!player.sementes) player.sementes = {};
    player.sementes['trigo'] = (player.sementes['trigo'] || 0) + 3;

    const subiuNivel = player.ganharXP(xpGanho);
    await player.save();

    let resposta = [
        `🎁 *BAÚ DE RECOMPENSA DIÁRIA!* 🎁`,
        ``,
        `👤 Aventureiro: *@${senderNumber}*`,
        `💰 Ouro Recebido: *+${formatOuro(ouroGanho)}*`,
        ouroFilhos > 0 ? `👶 Mimo dos Filhos Adotados: *+${formatOuro(ouroFilhos)}*` : null,
        `🌾 Sementes Extras: *+3x Semente de Trigo*`,
        `⭐ XP Recebido: *+${xpGanho} XP*`,
        `⚡ Estamina & Vida: *100% Restauradas!*`,
        ``,
        `🪙 *Saldo Total:* ${formatOuro(player.ouro)}`
    ].filter(Boolean);

    if (subiuNivel) {
        resposta.push(``);
        resposta.push(`🎉 *LEVEL UP!* Parabéns, você avançou para o *Nível ${player.nivel}*! Ganhou +5 pontos em *${prefix}upar*!`);
    }

    resposta.push(``);
    resposta.push(`💡 _Aproveite sua estamina cheia para trabalhar com *${prefix}trabalhar* ou desbravar a masmorra com *${prefix}masmorra*!_`);

    await conn.sendMessage(from, { text: resposta.join('\n'), mentions: [sender] }, { quoted: msg });
}

module.exports = {
    run,
    aliases
};
