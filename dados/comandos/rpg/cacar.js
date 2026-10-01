// creditos Olympio
const { getOrCriaPlayer, verificarModoRpg, formatOuro, formatTempoRestante } = require('../../funções/rpg/rpgHelper');
const { FERAS_CACA } = require('../../funções/rpg/dadosRpg');

const aliases = ['cacar', 'hunt', 'caca'];
const COOLDOWN_CACA = 4 * 60 * 1000; 

async function run(conn, msg, config, args, sender, senderName) {
    const from = msg.key.remoteJid;
    const prefix = config.prefix || '!';

    if (!(await verificarModoRpg(conn, from, msg, prefix))) return;

    const senderNumber = sender.replace(/[^0-9]/g, '');
    const player = await getOrCriaPlayer(senderNumber, senderName);

    if (player.presoAte && Date.now() < player.presoAte) {
        return await conn.sendMessage(from, {
            text: `⛓️ *Você está preso na masmorra e não pode caçar!*\nPague a fiança com *${prefix}fianca*.`
        }, { quoted: msg });
    }

    if (player.hp <= 15) {
        return await conn.sendMessage(from, {
            text: `❤️ *Você está com pouca vida (${player.hp}/${player.hpMax})!*\nDescanse com *${prefix}descansar* antes de enfrentar feras selvagens.`
        }, { quoted: msg });
    }

    const agora = Date.now();
    if (!player.cooldowns) player.cooldowns = {};
    const ultimaCaca = player.cooldowns.cacar || 0;
    if (agora - ultimaCaca < COOLDOWN_CACA) {
        const restante = formatTempoRestante(COOLDOWN_CACA - (agora - ultimaCaca));
        return await conn.sendMessage(from, {
            text: `⏳ Seus rastreadores estão procurando novas pegadas! Aguarde *${restante}*.`
        }, { quoted: msg });
    }

    player.regenerarEstamina();
    const custoEstamina = 15;
    if (player.estamina < custoEstamina) {
        return await conn.sendMessage(from, {
            text: `⚡ *Você está sem energia para correr atrás das feras!*\nCaçar exige *${custoEstamina} de Estamina* (Você tem ${player.estamina}/${player.estaminaMax}).\nDescanse com *${prefix}descansar*.`
        }, { quoted: msg });
    }
    player.consumirEstamina(custoEstamina);

    const ferasDisponiveis = FERAS_CACA.filter(f => player.nivel >= f.nivel);
    const fera = ferasDisponiveis[ferasDisponiveis.length - 1] || FERAS_CACA[0];

    let ataqueJogador = player.ataque;
    if (player.petAtivo === 'dragao') ataqueJogador += 120;
    if (player.petAtivo === 'tiranossauro') ataqueJogador += 150;
    if (player.petAtivo === 'spinossauro') ataqueJogador += 90;
    if (player.petAtivo === 'velociraptor') ataqueJogador += 80;

    const turnosParaVencer = Math.ceil(fera.hp / Math.max(10, ataqueJogador));
    const danoBrutoFera = Math.floor(fera.ataque * (turnosParaVencer * 0.7));
    let danoSofro = Math.max(5, danoBrutoFera - Math.floor(player.defesa * 0.5));

    if (player.petAtivo === 'tartaruga') danoSofro = Math.floor(danoSofro * 0.7);

    if (danoSofro >= player.hp) {
        player.hp = 1;
        player.cooldowns.cacar = agora;
        await player.save();

        return await conn.sendMessage(from, {
            text: `🩸 *EMBATE VIOLENTO CONTRA ${fera.nome.toUpperCase()}!* 🩸\n\nA fera era feroz demais e desferiu um contra-ataque devastador!\nVocê fugiu por pouco mancando com apenas *1 de HP*.\nDescanse urgente com *${prefix}descansar*!`
        }, { quoted: msg });
    }

    player.hp -= danoSofro;
    const ouroMin = fera.recompensaOuro[0];
    const ouroMax = fera.recompensaOuro[1];
    const ouroGanho = Math.floor(Math.random() * (ouroMax - ouroMin + 1)) + ouroMin;
    const carneGanha = Math.floor(Math.random() * 2) + 1;

    player.ouro += ouroGanho;
    player.adicionarItem(fera.drop, carneGanha);

    const subiuNivel = player.ganharXP(fera.xp);
    player.cooldowns.cacar = agora;

    await player.save();

    let resposta = [
        `🏹 *EXPEDIÇÃO DE CAÇA BEM-SUCEDIDA!*`,
        ``,
        `👤 Caçador: *@${senderNumber}*`,
        `🐾 Alvo Abatido: *${fera.icone} ${fera.nome}* (Nível ${fera.nivel})`,
        `⚔️ Dano Desferido: *${fera.hp} de dano letal*`,
        `❤️ Dano Sofrido: *-${danoSofro} HP* (Vida Restante: ${player.hp}/${player.hpMax})`,
        ``,
        `🎁 *RECOMPENSAS DA CAÇA:*`,
        `💰 Ouro: *+${formatOuro(ouroGanho)}*`,
        `🥩 Carne Nobre de Caça: *+${carneGanha}x*`,
        `⭐ XP Ganho: *+${fera.xp} XP*`
    ];

    if (subiuNivel) {
        resposta.push(``);
        resposta.push(`🎉 *LEVEL UP!* Parabéns, você avançou para o *Nível ${player.nivel}*!`);
    }

    resposta.push(``);
    resposta.push(`💡 _Cozinhe a carne de caça em *${prefix}cozinhar* ou forje armas melhores com *${prefix}forjar*!_`);

    await conn.sendMessage(from, { text: resposta.join('\n'), mentions: [sender] }, { quoted: msg });
}

module.exports = {
    run,
    aliases
};
