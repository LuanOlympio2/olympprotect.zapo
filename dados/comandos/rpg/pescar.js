// creditos Olympio
const { getOrCriaPlayer, verificarModoRpg, formatOuro, formatTempoRestante } = require('../../funções/rpg/rpgHelper');
const { PEIXES, ITENS_PESCA } = require('../../funções/rpg/dadosRpg');

const aliases = ['pescar', 'fish', 'pescaria'];
const COOLDOWN_PESCA = 3 * 60 * 1000; 

async function run(conn, msg, config, args, sender, senderName) {
    const from = msg.key.remoteJid;
    const prefix = config.prefix || '!';

    if (!(await verificarModoRpg(conn, from, msg, prefix))) return;

    const senderNumber = sender.replace(/[^0-9]/g, '');
    const player = await getOrCriaPlayer(senderNumber, senderName);

    if (player.presoAte && Date.now() < player.presoAte) {
        return await conn.sendMessage(from, {
            text: `⛓️ *Você está preso na masmorra e não pode pescar!*\nPague a fiança com *${prefix}fianca*.`
        }, { quoted: msg });
    }

    const agora = Date.now();
    if (!player.cooldowns) player.cooldowns = {};
    const ultimaPesca = player.cooldowns.pesca || 0;
    if (agora - ultimaPesca < COOLDOWN_PESCA) {
        const restante = formatTempoRestante(COOLDOWN_PESCA - (agora - ultimaPesca));
        return await conn.sendMessage(from, {
            text: `⏳ As águas estão agitadas! Aguarde *${restante}* para lançar a linha novamente.`
        }, { quoted: msg });
    }

    player.regenerarEstamina();
    const custoEstamina = 10;
    if (player.estamina < custoEstamina) {
        return await conn.sendMessage(from, {
            text: `⚡ *Você está cansado demais para pescar!*\n\nPescar consome *${custoEstamina} de Estamina* (Você tem ${player.estamina}/${player.estaminaMax}).\nDescanse com *${prefix}descansar* ou use *${prefix}upar estamina*!`
        }, { quoted: msg });
    }
    player.consumirEstamina(custoEstamina);

    let melhorVara = 'vara_bambu';
    let bonusVara = 10;
    const varasOrdem = ['vara_poseidon', 'vara_ouro', 'vara_ferro', 'vara_fibra', 'vara_bambu'];
    for (const vId of varasOrdem) {
        if (player.temItem(vId, 1)) {
            melhorVara = vId;
            bonusVara = ITENS_PESCA.varas[vId].bonusCaptura;
            break;
        }
    }

    let iscaUsada = null;
    let bonusIsca = 0;
    const iscasOrdem = ['isca_magica', 'isca_luminosa', 'isca_viva', 'isca_minhoca'];
    for (const iId of iscasOrdem) {
        if (player.temItem(iId, 1)) {
            iscaUsada = iId;
            bonusIsca = ITENS_PESCA.iscas[iId].atracao;
            player.removerItem(iId, 1);
            break;
        }
    }

    const sorte = Math.random() * 100 + bonusVara + bonusIsca;
    let peixeCapturado = 'sardinha';

    if (sorte >= 180 && player.nivel >= 20) {
        peixeCapturado = Math.random() < 0.5 ? 'bau_afundado' : 'perola_negra';
    } else if (sorte >= 140 && player.nivel >= 15) {
        peixeCapturado = 'tubarao_ancestral';
    } else if (sorte >= 110 && player.nivel >= 10) {
        peixeCapturado = 'peixe_espada';
    } else if (sorte >= 80 && player.nivel >= 6) {
        peixeCapturado = 'baiacu';
    } else if (sorte >= 60 && player.nivel >= 4) {
        peixeCapturado = 'truta_dourada';
    } else if (sorte >= 40) {
        peixeCapturado = 'salmao';
    } else if (sorte >= 25) {
        peixeCapturado = 'tilapia';
    }

    const peixeData = PEIXES[peixeCapturado];
    player.adicionarItem(peixeCapturado, 1);

    const xpGanho = Math.floor(peixeData.preco / 3) + 15;
    const subiuNivel = player.ganharXP(xpGanho);
    player.cooldowns.pesca = agora;

    await player.save();

    let resposta = [
        `🎣 *PESCARIA NAS ÁGUAS DO OLIMPO!*`,
        ``,
        `👤 Pescador: *@${senderNumber}*`,
        `🛶 Equipamento: *${ITENS_PESCA.varas[melhorVara].icone} ${ITENS_PESCA.varas[melhorVara].nome}*`,
        iscaUsada ? `🪱 Isca Usada: ${ITENS_PESCA.iscas[iscaUsada].icone} ${ITENS_PESCA.iscas[iscaUsada].nome}` : `🪱 Isca: _Nenhuma (pescou com pão duro)_`,
        ``,
        `🌊 *VOCÊ FISGOU ALGO PESADO!*`,
        `🐟 *${peixeData.icone} ${peixeData.nome}*!`,
        `💰 Valor de Venda: *${formatOuro(peixeData.preco)}*`,
        `⭐ XP de Pesca: *+${xpGanho} XP*`
    ];

    if (subiuNivel) {
        resposta.push(``);
        resposta.push(`🎉 *LEVEL UP!* Parabéns, você avançou para o *Nível ${player.nivel}*!`);
    }

    resposta.push(``);
    resposta.push(`💡 _Venda seu pescado na loja com *${prefix}vender ${peixeCapturado}* ou confira sua mochila com *${prefix}inventario*!_`);

    await conn.sendMessage(from, { text: resposta.join('\n'), mentions: [sender] }, { quoted: msg });
}

module.exports = {
    run,
    aliases
};
