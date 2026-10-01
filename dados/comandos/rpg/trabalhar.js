// creditos Olympio
const { getOrCriaPlayer, verificarModoRpg, formatOuro, formatTempoRestante } = require('../../funções/rpg/rpgHelper');
const { EMPREGOS, MINERIOS, PLANTACOES, INGREDIENTES_LOJA, FORJA } = require('../../funções/rpg/dadosRpg');

const aliases = ['trabalhar', 'trampar', 'work', 'servico'];
const COOLDOWN_TRABALHO = 10 * 60 * 1000; 

async function run(conn, msg, config, args, sender, senderName) {
    const from = msg.key.remoteJid;
    const prefix = config.prefix || '!';

    if (!(await verificarModoRpg(conn, from, msg, prefix))) return;

    const senderNumber = sender.replace(/[^0-9]/g, '');
    const player = await getOrCriaPlayer(senderNumber, senderName);

    if (player.presoAte && Date.now() < player.presoAte) {
        const tempoPreso = formatTempoRestante(player.presoAte - Date.now());
        return await conn.sendMessage(from, {
            text: `⛓️ *Você está preso na Masmorra Imperial!*\n\nAguarde mais *${tempoPreso}* ou pague a fiança com *${prefix}fianca*.`
        }, { quoted: msg });
    }

    const agora = Date.now();
    const ultimoTrabalho = player.cooldowns?.trabalho || 0;
    if (agora - ultimoTrabalho < COOLDOWN_TRABALHO) {
        const restante = formatTempoRestante(COOLDOWN_TRABALHO - (agora - ultimoTrabalho));
        return await conn.sendMessage(from, {
            text: `⏳ *@${senderNumber}*, você já trabalhou recentemente e está descansando!\n\nVolte ao trabalho em *${restante}*.`,
            mentions: [sender]
        }, { quoted: msg });
    }

    player.regenerarEstamina();
    let custoEstamina = 15;
    if (player.petAtivo === 'coelho') custoEstamina = 10; 

    if (player.estamina < custoEstamina) {
        return await conn.sendMessage(from, {
            text: `⚡ *Você está exausto(a)!*\n\nVocê precisa de *${custoEstamina} de Estamina* para trabalhar, mas possui apenas *${player.estamina}/${player.estaminaMax}*.\n\n⏳ Descanse alguns instantes (a estamina regenera automaticamente a cada 30 segundos) ou coma um prato preparado na cozinha!`
        }, { quoted: msg });
    }

    player.consumirEstamina(custoEstamina);

    const empregoKey = player.emprego || 'desempregado';
    const emp = EMPREGOS[empregoKey] || EMPREGOS.desempregado;

    let ouroGanho = emp.salarioBase + Math.floor(player.nivel * 4) + Math.floor(Math.random() * 20);

    if (player.petAtivo === 'papagaio') {
        ouroGanho = Math.floor(ouroGanho * 1.20);
    }

    let itensGanhos = [];
    let xpGanho = 25 + Math.floor(Math.random() * 15);

    if (empregoKey === 'minerador') {
        const picaretaId = player.equipamentos?.picareta || 'picareta_madeira';
        const picaretaInfo = FORJA.picaretas[picaretaId];
        const bonusMin = picaretaInfo ? picaretaInfo.bonusMinerio : 0;

        let poolMinerios = ['cobre'];
        if (player.nivel >= 2) poolMinerios.push('ferro');
        if (player.nivel >= 4) poolMinerios.push('prata');
        if (player.nivel >= 7) poolMinerios.push('ouro');
        if (player.nivel >= 10) poolMinerios.push('platina');

        const minerioSorteado = poolMinerios[Math.floor(Math.random() * poolMinerios.length)];
        const qtdBase = Math.floor(Math.random() * 3) + 1;
        const qtdFinal = qtdBase + Math.floor(bonusMin / 60);

        player.adicionarItem(minerioSorteado, qtdFinal);
        const mInfo = MINERIOS[minerioSorteado];
        itensGanhos.push(`${mInfo.icone} ${mInfo.nome}: *${qtdFinal}x*`);

    } else if (empregoKey === 'fazendeiro') {
        const chavesPlantacoes = Object.keys(PLANTACOES);
        const sementeSorteada = chavesPlantacoes[Math.floor(Math.random() * Math.min(player.nivel + 2, chavesPlantacoes.length))];
        const qtdSemente = Math.floor(Math.random() * 3) + 2;

        if (!player.sementes) player.sementes = {};
        player.sementes[sementeSorteada] = (player.sementes[sementeSorteada] || 0) + qtdSemente;

        const pInfo = PLANTACOES[sementeSorteada];
        itensGanhos.push(`🌱 Sementes de ${pInfo.nome}: *${qtdSemente}x*`);

    } else if (empregoKey === 'cozinheiro') {
        const chavesIngredientes = Object.keys(INGREDIENTES_LOJA);
        const ingSorteado = chavesIngredientes[Math.floor(Math.random() * chavesIngredientes.length)];
        const qtdIng = Math.floor(Math.random() * 2) + 1;

        player.adicionarItem(ingSorteado, qtdIng);
        const ingInfo = INGREDIENTES_LOJA[ingSorteado];
        itensGanhos.push(`${ingInfo.icone} ${ingInfo.nome}: *${qtdIng}x*`);

    } else if (empregoKey === 'cacador') {
        const qtdCarne = Math.floor(Math.random() * 2) + 1;
        player.adicionarItem('carne_caca', qtdCarne);
        itensGanhos.push(`🥩 Carne Nobre de Caça: *${qtdCarne}x*`);

    } else if (empregoKey === 'mercador') {
        const bonusMercado = Math.floor(Math.random() * 100) + 50;
        ouroGanho += bonusMercado;
        itensGanhos.push(`💰 Lucro comercial extra: +${bonusMercado} 🪙`);

    } else if (empregoKey === 'ferreiro') {
        player.adicionarItem('ferro', 2);
        itensGanhos.push(`⚪ Minério de Ferro: *2x*`);

    } else {
        ouroGanho += 10;
    }

    player.ouro += ouroGanho;
    player.cooldowns.trabalho = agora;

    const subiuNivel = player.ganharXP(xpGanho);
    await player.save();

    let resposta = [
        `🔨 *TURNO DE TRABALHO CONCLUÍDO!*`,
        ``,
        `👤 *Trabalhador:* @${senderNumber}`,
        `💼 *Profissão:* ${emp.icone} ${emp.nome}`,
        `💰 *Salário Recebido:* ${formatOuro(ouroGanho)}`,
        `⭐ *XP Ganho:* +${xpGanho} XP`,
        ``
    ];

    if (itensGanhos.length > 0) {
        resposta.push(`📦 *Recursos Coletados:*`);
        itensGanhos.forEach(item => resposta.push(`• ${item}`));
        resposta.push(``);
    }

    if (subiuNivel) {
        resposta.push(`🎉 *LEVEL UP!* Você alcançou o *Nível ${player.nivel}*!`);
        resposta.push(`❤️ Vida e Mana restauradas ao máximo!`);
        resposta.push(``);
    }

    resposta.push(`💡 _Dica: Digite *${prefix}vender* para faturar com seus minérios ou *${prefix}forjar* para criar ferramentas!_`);

    await conn.sendMessage(from, {
        text: resposta.join('\n'),
        mentions: [sender]
    }, { quoted: msg });
}

module.exports = {
    run,
    aliases
};
