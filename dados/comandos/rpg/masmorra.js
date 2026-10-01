// creditos Olympio
const { getOrCriaPlayer, verificarModoRpg, formatOuro } = require('../../funções/rpg/rpgHelper');
const { MINERIOS } = require('../../funções/rpg/dadosRpg');

const aliases = ['masmorra', 'dungeon', 'catacumbas'];

async function run(conn, msg, config, args, sender, senderName) {
    const from = msg.key.remoteJid;
    const prefix = config.prefix || '!';

    if (!(await verificarModoRpg(conn, from, msg, prefix))) return;

    const senderNumber = sender.replace(/[^0-9]/g, '');
    const player = await getOrCriaPlayer(senderNumber, senderName);

    if (!player.andarMasmorra) player.andarMasmorra = 1;

    const acao = args[0]?.toLowerCase();

    if (acao !== 'descer' && acao !== 'lutar' && acao !== 'avancar') {
        const andar = player.andarMasmorra;
        const isBoss = andar % 5 === 0;

        let texto = [
            `╭─〔 🏰 *CATACUMBAS DAS PROFUNDEZAS* 〕`,
            `│ 👤 *Desafiante:* ${player.nome}`,
            `│ • *Nível:* ${player.nivel}`,
            `│ 🪜 *Andar Atual:* *Andar ${andar}* ${isBoss ? '👑 *(ANDAR DE CHEFE!)*' : ''}`,
            `│ ❤️ *Sua Vida:* ${player.hp}/${player.hpMax}`,
            `│ ⚡ *Sua Estamina:* ${player.estamina}/${player.estaminaMax}`,
            `│ 💀 *MONSTRO DO ANDAR:*`,
            isBoss
                ? `│ 👹 *Guardião Titânico do Andar ${andar}* (HP: ${andar * 120} | ATQ: ${andar * 16})`
                : `│ 🧟 *Espectro Sombrio do Andar ${andar}* (HP: ${andar * 70} | ATQ: ${andar * 10})`,
            `│ 🎁 *Recompensa ao vencer:*`,
            `│ • Ouro: ${formatOuro(andar * 60 + 50)}`,
            isBoss ? `│ • 💎 Baú Lendário com Minérios Raros!` : `│ • ⭐ ${andar * 30} XP`,
            `╰────────────────────────`,
            ``,
            `💡 *Para descer e lutar:*`,
            `👉 *${prefix}masmorra descer*`
        ].join('\n');

        return await conn.sendMessage(from, { text: texto }, { quoted: msg });
    }

    if (player.presoAte && Date.now() < player.presoAte) {
        return await conn.sendMessage(from, {
            text: `⛓️ *Você está preso na masmorra imperial e não nas catacumbas de aventura!*`
        }, { quoted: msg });
    }

    if (player.hp <= 25) {
        return await conn.sendMessage(from, {
            text: `❤️ *Você está muito ferido para descer na masmorra (${player.hp}/${player.hpMax})!*\nCure-se ou descanse com *${prefix}descansar*.`
        }, { quoted: msg });
    }

    player.regenerarEstamina();
    const custoEstamina = 20;
    if (player.estamina < custoEstamina) {
        return await conn.sendMessage(from, {
            text: `⚡ *Estamina insuficiente!*\nDescer nas catacumbas exige *${custoEstamina} de Estamina* (Você tem ${player.estamina}/${player.estaminaMax}).\nDescanse com *${prefix}descansar*!`
        }, { quoted: msg });
    }
    player.consumirEstamina(custoEstamina);

    const andar = player.andarMasmorra;
    const isBoss = andar % 5 === 0;

    const monstroHP = isBoss ? andar * 120 : andar * 70;
    const monstroATQ = isBoss ? andar * 16 : andar * 10;
    const monstroNome = isBoss ? `Guardião Colossal do Andar ${andar}` : `Criatura Abissal do Andar ${andar}`;

    let ataqueTotal = player.ataque;
    if (player.petAtivo === 'tiranossauro') ataqueTotal += 150;
    if (player.petAtivo === 'dragao') ataqueTotal += 120;
    if (player.petAtivo === 'velociraptor') ataqueTotal += 80;

    const turnos = Math.ceil(monstroHP / Math.max(10, ataqueTotal));
    const danoRecebidoBruto = Math.floor(monstroATQ * turnos * 0.6);
    let danoSofro = Math.max(8, danoRecebidoBruto - Math.floor(player.defesa * 0.6));

    if (player.petAtivo === 'tartaruga') danoSofro = Math.floor(danoSofro * 0.7);

    if (danoSofro >= player.hp) {
        player.hp = 1;
        await player.save();

        return await conn.sendMessage(from, {
            text: `💀 *DERROTA NO ANDAR ${andar}!* 💀\n\nO *${monstroNome}* foi implacável e quebrou sua formação!\nVocê foi arrastado para fora das catacumbas com apenas *1 HP*.\nDescanse com *${prefix}descansar* e forje equipamentos melhores com *${prefix}forjar*!`
        }, { quoted: msg });
    }

    player.hp -= danoSofro;
    player.andarMasmorra += 1; 

    const ouroGanho = isBoss ? (andar * 150 + 200) : (andar * 60 + 50);
    player.ouro += ouroGanho;

    let itemExtra = null;
    if (isBoss) {
        let minSorteado = 'ouro';
        if (andar >= 10) minSorteado = 'titanio';
        if (andar >= 15) minSorteado = 'mitril';
        if (andar >= 20) minSorteado = 'adamante';
        if (andar >= 25) minSorteado = 'obsidiana';
        if (andar >= 30) minSorteado = 'eter';

        player.adicionarItem(minSorteado, 2);
        itemExtra = `💎 *2x ${MINERIOS[minSorteado]?.nome || minSorteado}*`;
    }

    const xpGanho = andar * 35 + 30;
    const subiuNivel = player.ganharXP(xpGanho);

    await player.save();

    let resposta = [
        `🗡️ *ANDAR ${andar} CONQUISTADO COM SUCESSO!* 🏰`,
        ``,
        `👤 Desafiante: *@${senderNumber}*`,
        `💀 Inimigo Abatido: *${monstroNome}*`,
        `❤️ Dano Sofrido: *-${danoSofro} HP* (Vida: ${player.hp}/${player.hpMax})`,
        ``,
        `🎁 *RECOMPENSAS DO ANDAR:*`,
        `💰 Ouro: *+${formatOuro(ouroGanho)}*`,
        itemExtra ? `📦 Baú do Chefe: ${itemExtra}` : null,
        `⭐ XP Conquistado: *+${xpGanho} XP*`,
        ``,
        `🪜 *Você avançou para o ANDAR ${player.andarMasmorra}!*`
    ].filter(Boolean);

    if (subiuNivel) {
        resposta.push(``);
        resposta.push(`🎉 *LEVEL UP!* Você subiu para o *Nível ${player.nivel}*! Ganhou +5 pontos para *${prefix}upar*!`);
    }

    resposta.push(``);
    resposta.push(`💡 _Digite *${prefix}masmorra descer* para enfrentar o próximo andar!_`);

    await conn.sendMessage(from, { text: resposta.join('\n'), mentions: [sender] }, { quoted: msg });
}

module.exports = {
    run,
    aliases
};
