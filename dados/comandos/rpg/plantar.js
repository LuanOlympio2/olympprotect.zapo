// creditos Olympio
const { getOrCriaPlayer, verificarModoRpg } = require('../../funções/rpg/rpgHelper');
const { PLANTACOES } = require('../../funções/rpg/dadosRpg');

const aliases = ['plantar', 'semear', 'cultivar'];

async function run(conn, msg, config, args, sender, senderName) {
    const from = msg.key.remoteJid;
    const prefix = config.prefix || '!';

    if (!(await verificarModoRpg(conn, from, msg, prefix))) return;

    const senderNumber = sender.replace(/[^0-9]/g, '');
    const player = await getOrCriaPlayer(senderNumber, senderName);

    if (!player.fazenda) player.fazenda = { lotes: [], lotesMax: 4 };
    if (!player.fazenda.lotesMax) player.fazenda.lotesMax = 4;

    const sementeId = args[0]?.toLowerCase();

    if (!sementeId || !PLANTACOES[sementeId]) {
        return await conn.sendMessage(from, {
            text: `❌ Especifique uma semente válida para plantar!\n\nExemplo: *${prefix}plantar trigo*\nExemplo: *${prefix}plantar morango*\nConsulte suas sementes com *${prefix}fazenda* ou compre na *${prefix}loja sementes*.`
        }, { quoted: msg });
    }

    const qtdSemente = player.sementes?.[sementeId] || 0;
    if (qtdSemente <= 0) {
        return await conn.sendMessage(from, {
            text: `❌ Você não possui sementes de *${PLANTACOES[sementeId].nome}*!\nCompre na feira usando *${prefix}comprar ${sementeId} 1*.`
        }, { quoted: msg });
    }

    const lotes = player.fazenda.lotes || [];
    if (lotes.length >= player.fazenda.lotesMax) {
        return await conn.sendMessage(from, {
            text: `❌ Todos os seus *${player.fazenda.lotesMax} canteiros* estão ocupados no momento!\n\nColha com *${prefix}colher* ou expanda sua terra com *${prefix}fazenda expandir*.`
        }, { quoted: msg });
    }

    player.regenerarEstamina();
    const custoEstamina = 5;
    if (player.estamina < custoEstamina) {
        return await conn.sendMessage(from, {
            text: `⚡ *Você está sem energia para cavar e semear!*\nPlantar consome *${custoEstamina} de Estamina* (Você tem ${player.estamina}/${player.estaminaMax}).\nDescanse com *${prefix}descansar*.`
        }, { quoted: msg });
    }
    player.consumirEstamina(custoEstamina);

    player.sementes[sementeId] -= 1;
    if (player.sementes[sementeId] <= 0) delete player.sementes[sementeId];

    const plantaInfo = PLANTACOES[sementeId];

    player.fazenda.lotes.push({
        semente: sementeId,
        plantadoEm: Date.now(),
        tempoTotalMin: plantaInfo.tempoMinutos,
        regado: false
    });

    await player.save();

    await conn.sendMessage(from, {
        text: `🌱 *SEMENTE PLANTADA COM SUCESSO!* 🚜\n\n👤 Fazendeiro: *@${senderNumber}*\n🌾 Cultura: *${plantaInfo.icone} ${plantaInfo.nome}*\n⏱️ Tempo de colheita: *${plantaInfo.tempoMinutos} minutos*\n\n💡 _Dica: Use *${prefix}regar* para acelerar o crescimento em 25%!_`,
        mentions: [sender]
    }, { quoted: msg });
}

module.exports = {
    run,
    aliases
};
