// creditos Olympio
const { getOrCriaPlayer, verificarModoRpg, formatOuro, formatTempoRestante } = require('../../funções/rpg/rpgHelper');
const { LOCAIS_EXPLORACAO } = require('../../funções/rpg/dadosRpg');

const aliases = ['viajar', 'viagem', 'travel'];
const COOLDOWN_VIAGEM = 5 * 60 * 1000; 

async function run(conn, msg, config, args, sender, senderName) {
    const from = msg.key.remoteJid;
    const prefix = config.prefix || '!';

    if (!(await verificarModoRpg(conn, from, msg, prefix))) return;

    const senderNumber = sender.replace(/[^0-9]/g, '');
    const player = await getOrCriaPlayer(senderNumber, senderName);

    if (player.presoAte && Date.now() < player.presoAte) {
        return await conn.sendMessage(from, {
            text: `⛓️ *Você está preso na masmorra e não pode viajar!*\nUse *${prefix}fianca* para se libertar.`
        }, { quoted: msg });
    }

    const destinoId = args[0]?.toLowerCase();

    if (!destinoId) {
        return await conn.sendMessage(from, {
            text: `❌ Para onde você quer viajar?\n\nDigite *${prefix}mapa* para ver os reinos disponíveis.\nExemplo: *${prefix}viajar floresta_sombria*`
        }, { quoted: msg });
    }

    const destino = LOCAIS_EXPLORACAO.find(l => l.id === destinoId);
    if (!destino) {
        return await conn.sendMessage(from, {
            text: `❌ Região desconhecida!\n\nConsulte os locais disponíveis usando *${prefix}mapa*.`
        }, { quoted: msg });
    }

    if (player.localizacao === destino.id) {
        return await conn.sendMessage(from, {
            text: `📍 Você já está em *${destino.icone} ${destino.nome}*!\nUse *${prefix}explorar* para investigar a área.`
        }, { quoted: msg });
    }

    const agora = Date.now();
    const ultimaViagem = player.cooldowns?.viajar || 0;
    if (agora - ultimaViagem < COOLDOWN_VIAGEM) {
        const restante = formatTempoRestante(COOLDOWN_VIAGEM - (agora - ultimaViagem));
        return await conn.sendMessage(from, {
            text: `🐎 Suas montarias e carruagens estão exaustas!\nAguarde *${restante}* para viajar novamente.`
        }, { quoted: msg });
    }

    if (player.nivel < destino.nivelRecomendado) {
        return await conn.sendMessage(from, {
            text: `⚠️ *ÁREA PERIGOSA DEMAIS!*\n\nVocê é nível ${player.nivel}, mas *${destino.nome}* exige no mínimo *Nível ${destino.nivelRecomendado}*!\nTreine, trabalhe ou cace monstros primeiro.`
        }, { quoted: msg });
    }

    if (player.ouro < destino.custoViagem) {
        return await conn.sendMessage(from, {
            text: `❌ Ouro insuficiente para a caravana de viagem!\n\nA passagem custa *${formatOuro(destino.custoViagem)}*, você possui *${formatOuro(player.ouro)}*.`
        }, { quoted: msg });
    }

    player.regenerarEstamina();
    let custoEstamina = 15;
    if (player.petAtivo === 'coelho') custoEstamina = 10;
    if (player.petAtivo === 'dragao') custoEstamina = 5; 

    if (player.estamina < custoEstamina) {
        return await conn.sendMessage(from, {
            text: `⚡ *Você está cansado demais para viajar!*\n\nViajar exige *${custoEstamina} de Estamina*, você tem *${player.estamina}/${player.estaminaMax}*.\nAguarde recuperar ou use *${prefix}upar estamina*.`
        }, { quoted: msg });
    }

    player.consumirEstamina(custoEstamina);

    player.ouro -= destino.custoViagem;
    player.localizacao = destino.id;
    player.cooldowns.viajar = agora;

    let eventoMsg = '';
    const sorte = Math.random();
    const protegido = player.petAtivo === 'triceratops' || player.petAtivo === 'dragao';

    if (sorte < 0.20 && destino.riscoMorte > 0.05 && !protegido) {
        const dano = Math.min(player.hp - 1, Math.floor(destino.nivelRecomendado * 8) + 15);
        const ouroPerdido = Math.min(player.ouro, Math.floor(Math.random() * 50) + 20);
        player.hp = Math.max(1, player.hp - dano);
        player.ouro -= ouroPerdido;
        eventoMsg = `\n⚠️ *EMBOSCADA NA ESTRADA!*\nBandidos atacaram sua caravana! Você perdeu *${dano} HP* e *${formatOuro(ouroPerdido)}*!`;
    } else if (sorte > 0.80) {
        const ouroEncontrado = Math.floor(Math.random() * 60) + 30;
        player.ouro += ouroEncontrado;
        eventoMsg = `\n✨ *SORTE NA VIAGEM!*\nVocê encontrou uma bolsa perdida na beira da trilha com *+${formatOuro(ouroEncontrado)}*!`;
    }

    await player.save();

    let resposta = [
        `🐎 *VIAGEM CONCLUÍDA COM SUCESSO!*`,
        ``,
        `👤 Aventureiro: *@${senderNumber}*`,
        `📍 Destino: *${destino.icone} ${destino.nome}*`,
        `💰 Custo Pago: ${formatOuro(destino.custoViagem)}`,
        `🪙 Saldo Atual: ${formatOuro(player.ouro)}`,
        eventoMsg,
        ``,
        `💡 _Digite *${prefix}explorar* para procurar tesouros nesta região!_`
    ].filter(Boolean).join('\n');

    await conn.sendMessage(from, { text: resposta, mentions: [sender] }, { quoted: msg });
}

module.exports = {
    run,
    aliases
};
