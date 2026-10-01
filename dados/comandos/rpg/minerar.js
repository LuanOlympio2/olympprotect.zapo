// creditos Olympio
const { getOrCriaPlayer, verificarModoRpg, formatOuro, formatTempoRestante } = require('../../funções/rpg/rpgHelper');
const { MINERIOS, FORJA } = require('../../funções/rpg/dadosRpg');

const aliases = ['minerar', 'mine', 'minera', 'cavar'];
const COOLDOWN_MINERAR = 5 * 60 * 1000; 

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
    const ultimoMinerar = player.cooldowns?.minerar || 0;
    if (agora - ultimoMinerar < COOLDOWN_MINERAR) {
        const restante = formatTempoRestante(COOLDOWN_MINERAR - (agora - ultimoMinerar));
        return await conn.sendMessage(from, {
            text: `⏳ *@${senderNumber}*, seus braços estão cansados das picaretadas!\n\nDescanse por mais *${restante}* antes de escavar novamente.`,
            mentions: [sender]
        }, { quoted: msg });
    }

    player.regenerarEstamina();
    let custoEstamina = 15;
    if (player.petAtivo === 'coelho') custoEstamina = 10;

    if (player.estamina < custoEstamina) {
        return await conn.sendMessage(from, {
            text: `⚡ *Você está sem fôlego!* Requer *${custoEstamina} de Estamina*, mas você possui apenas *${player.estamina}/${player.estaminaMax}*.\n💡 Descanse com *${prefix}descansar* ou beba um tônico de vigor (*${prefix}pocao*).`
        }, { quoted: msg });
    }

    player.consumirEstamina(custoEstamina);
    player.cooldowns.minerar = agora;

    const picaretaId = player.equipamentos?.picareta || 'picareta_madeira';
    const picaretaInfo = FORJA.picaretas[picaretaId] || FORJA.picaretas.picareta_madeira;
    const bonus = picaretaInfo.bonusMinerio || 0;

    let poolMinerios = ['cobre'];
    if (player.nivel >= 2) poolMinerios.push('ferro');
    if (player.nivel >= 5) poolMinerios.push('prata');
    if (player.nivel >= 8) poolMinerios.push('ouro');
    if (player.nivel >= 12 && bonus >= 30) poolMinerios.push('platina');
    if (player.nivel >= 16 && bonus >= 50) poolMinerios.push('titanio');
    if (player.nivel >= 20 && bonus >= 80) poolMinerios.push('mitril');
    if (player.nivel >= 28 && bonus >= 120) poolMinerios.push('adamante');
    if (player.nivel >= 35 && bonus >= 180) poolMinerios.push('obsidiana');
    if (player.nivel >= 45 && bonus >= 180) poolMinerios.push('eter');

    const minerioSorteado = poolMinerios[Math.floor(Math.random() * poolMinerios.length)];
    const mInfo = MINERIOS[minerioSorteado];

    const qtdBase = Math.floor(Math.random() * 3) + 2;
    const qtdExtra = Math.floor(bonus / 40);
    const qtdFinal = qtdBase + qtdExtra;

    player.adicionarItem(minerioSorteado, qtdFinal);

    if (!player.estatisticas) player.estatisticas = {};
    player.estatisticas.mineriosMinerados = (player.estatisticas.mineriosMinerados || 0) + qtdFinal;

    const ouroAchar = Math.floor(Math.random() * 25) + 10;
    player.ouro += ouroAchar;

    const xpGanho = 20 + Math.floor(mInfo.preco * 0.2);
    const subiuNivel = player.ganharXP(xpGanho);

    await player.save();

    let resposta = [
        `⛏️ *ESCAVAÇÃO MINERAL BEM-SUCEDIDA!* 💎`,
        ``,
        `👤 Minerador: *@${senderNumber}*`,
        `🛠️ Ferramenta: ${picaretaInfo.icone} ${picaretaInfo.nome}`,
        `📦 Minérios Extraídos: *+${qtdFinal}x ${mInfo.icone} ${mInfo.nome}*`,
        `🪙 Pepitas de Ouro Encontradas: *+${formatOuro(ouroAchar)}*`,
        `⭐ XP de Mineração: +${xpGanho} XP`
    ];

    if (subiuNivel) {
        resposta.push(``);
        resposta.push(`🎉 *LEVEL UP!* Você alcançou o *Nível ${player.nivel}*!`);
    }

    resposta.push(``);
    resposta.push(`💡 _Venda seus minérios com *${prefix}vender ${minerioSorteado}* ou use para forjar espadas e armaduras com *${prefix}forjar*!_`);

    await conn.sendMessage(from, {
        text: resposta.join('\n'),
        mentions: [sender]
    }, { quoted: msg });
}

module.exports = {
    run,
    aliases
};
