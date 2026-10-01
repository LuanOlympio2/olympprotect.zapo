// creditos Olympio
const { getOrCriaPlayer, verificarModoRpg, formatTempoRestante } = require('../../funções/rpg/rpgHelper');

const aliases = ['descansar', 'dormir', 'rest', 'acampamento', 'fogueira'];
const COOLDOWN_DESCANSO = 15 * 60 * 1000; 

async function run(conn, msg, config, args, sender, senderName) {
    const from = msg.key.remoteJid;
    const prefix = config.prefix || '!';

    if (!(await verificarModoRpg(conn, from, msg, prefix))) return;

    const senderNumber = sender.replace(/[^0-9]/g, '');
    const player = await getOrCriaPlayer(senderNumber, senderName);

    if (player.presoAte && Date.now() < player.presoAte) {
        return await conn.sendMessage(from, {
            text: `⛓️ *Você está trancado nas celas da prisão imperial!*\nNão é possível descansar com conforto aqui. Pague a fiança com *${prefix}fianca*.`
        }, { quoted: msg });
    }

    const agora = Date.now();
    const ultimoDescanso = player.cooldowns?.descanso || 0;

    if (agora - ultimoDescanso < COOLDOWN_DESCANSO) {
        const restante = formatTempoRestante(COOLDOWN_DESCANSO - (agora - ultimoDescanso));
        return await conn.sendMessage(from, {
            text: `🏕️ *@${senderNumber}*, você já descansou recentemente e está com as energias cheias!\n\nPoderá montar outro acampamento em *${restante}*.\n\n⚡ Estamina Atual: *${player.estamina}/${player.estaminaMax}*`,
            mentions: [sender]
        }, { quoted: msg });
    }

    player.regenerarEstamina();

    const hpRecuperado = Math.min(player.hpMax - player.hp, Math.floor(player.hpMax * 0.6) + 20);
    const estaminaRecuperada = player.estaminaMax - player.estamina;

    player.estamina = player.estaminaMax;
    player.hp = Math.min(player.hpMax, player.hp + hpRecuperado);
    player.mp = player.mpMax;
    player.ultimaRegenEstamina = agora;

    if (!player.cooldowns) player.cooldowns = {};
    player.cooldowns.descanso = agora;

    await player.save();

    const texto = [
        `🏕️ *ACAMPAMENTO REPOUSANTE* 🔥`,
        ``,
        `👤 Aventureiro: *@${senderNumber}*`,
        ``,
        `🔥 _Você encontrou um local seguro, armou sua barraca, acendeu uma fogueira estalante e por ali descansou sob as estrelas..._`,
        ``,
        `⚡ *Estamina Restaurada:* ${player.estamina}/${player.estaminaMax} (+${estaminaRecuperada})`,
        `❤️ *Vida Recuperada:* ${player.hp}/${player.hpMax} (+${hpRecuperado} HP)`,
        `🌀 *Mana Restaurada:* ${player.mp}/${player.mpMax} (100%)`,
        ``,
        `✨ *Você acordou revigorado, forte e pronto para novos desafios!*`,
        `💡 _Trabalhe com *${prefix}trabalhar* ou desbrave reinos com *${prefix}explorar*!_`
    ].join('\n');

    await conn.sendMessage(from, { text: texto, mentions: [sender] }, { quoted: msg });
}

module.exports = {
    run,
    aliases
};
