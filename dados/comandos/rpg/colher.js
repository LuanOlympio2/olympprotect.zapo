// creditos Olympio
const { getOrCriaPlayer, verificarModoRpg, formatOuro } = require('../../funções/rpg/rpgHelper');
const { PLANTACOES } = require('../../funções/rpg/dadosRpg');
const { getClimaAtual } = require('../../funções/rpg/climaSistema');

const aliases = ['colher', 'ceifar', 'harvest'];

async function run(conn, msg, config, args, sender, senderName) {
    const from = msg.key.remoteJid;
    const prefix = config.prefix || '!';

    if (!(await verificarModoRpg(conn, from, msg, prefix))) return;

    const senderNumber = sender.replace(/[^0-9]/g, '');
    const player = await getOrCriaPlayer(senderNumber, senderName);

    const lotes = player.fazenda?.lotes || [];

    if (lotes.length === 0) {
        return await conn.sendMessage(from, {
            text: `🌾 Você não possui nenhuma planta cultivada na sua fazenda!\nPlante com *${prefix}plantar <semente>*.`
        }, { quoted: msg });
    }

    const clima = getClimaAtual();
    const agora = Date.now();

    let lotesRestantes = [];
    let colheitasFeitas = [];
    let xpTotalGanho = 0;

    lotes.forEach(lote => {
        const plantaInfo = PLANTACOES[lote.semente] || { nome: lote.semente, tempoMinutos: 5 };
        let tempoTotalMs = (lote.tempoTotalMin || plantaInfo.tempoMinutos) * 60 * 1000;

        if (lote.regado || clima.id === 'chuva') {
            tempoTotalMs = Math.floor(tempoTotalMs * 0.75);
        }

        const pronto = (agora - lote.plantadoEm) >= tempoTotalMs;

        if (pronto) {
            let qtdFrutos = 2; 

            if (player.petAtivo === 'galinha') qtdFrutos += 1;
            if (player.petAtivo === 'parassauro' && lote.semente === 'erva_magica') qtdFrutos *= 2;

            player.adicionarItem(lote.semente, qtdFrutos);
            colheitasFeitas.push(`• ${plantaInfo.icone} ${plantaInfo.nome}: *+${qtdFrutos}x colhidos*`);
            xpTotalGanho += plantaInfo.tempoMinutos * 10;
        } else {
            lotesRestantes.push(lote);
        }
    });

    if (colheitasFeitas.length === 0) {
        return await conn.sendMessage(from, {
            text: `⏳ Nenhuma plantação está pronta para a colheita ainda!\nVerifique o tempo restante usando *${prefix}fazenda*.`
        }, { quoted: msg });
    }

    player.fazenda.lotes = lotesRestantes;
    const subiuNivel = player.ganharXP(xpTotalGanho);

    await player.save();

    let resposta = [
        `🌾 *COLHEITA ABUNDANTE DA FAZENDA!* 🚜`,
        ``,
        `👤 Fazendeiro: *@${senderNumber}*`,
        colheitasFeitas.join('\n'),
        ``,
        `⭐ *XP Agrícola:* +${xpTotalGanho} XP`,
        player.petAtivo === 'galinha' ? `🐔 _Bônus da Galinha Poedeira aumentou sua colheita!_` : null,
        ``,
        `💡 _Use os frutos para cozinhar em *${prefix}cozinhar* ou venda na feira com *${prefix}vender*!_`
    ].filter(Boolean);

    if (subiuNivel) {
        resposta.push(``);
        resposta.push(`🎉 *LEVEL UP!* Parabéns, você avançou para o *Nível ${player.nivel}*!`);
    }

    await conn.sendMessage(from, { text: resposta.join('\n'), mentions: [sender] }, { quoted: msg });
}

module.exports = {
    run,
    aliases
};
