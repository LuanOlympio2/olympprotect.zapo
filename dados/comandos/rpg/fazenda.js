// creditos Olympio
const { getOrCriaPlayer, verificarModoRpg, formatOuro, formatTempoRestante } = require('../../funções/rpg/rpgHelper');
const { PLANTACOES } = require('../../funções/rpg/dadosRpg');
const { getClimaAtual } = require('../../funções/rpg/climaSistema');

const aliases = ['fazenda', 'plantacao', 'horta', 'canteiros'];

async function run(conn, msg, config, args, sender, senderName) {
    const from = msg.key.remoteJid;
    const prefix = config.prefix || '!';

    if (!(await verificarModoRpg(conn, from, msg, prefix))) return;

    const senderNumber = sender.replace(/[^0-9]/g, '');
    const player = await getOrCriaPlayer(senderNumber, senderName);

    if (!player.fazenda) player.fazenda = { lotes: [] };
    if (!player.fazenda.lotesMax) player.fazenda.lotesMax = 4; 

    const clima = getClimaAtual();
    const agora = Date.now();

    const subcomando = args[0]?.toLowerCase();

    if (subcomando === 'expandir' || subcomando === 'aumentar') {
        const proximoLote = player.fazenda.lotesMax + 1;
        if (proximoLote > 10) {
            return await conn.sendMessage(from, { text: '🌾 Sua fazenda já atingiu a capacidade máxima de 10 canteiros!' }, { quoted: msg });
        }
        const custoExpansao = proximoLote * 800;
        if (player.ouro < custoExpansao) {
            return await conn.sendMessage(from, {
                text: `❌ Ouro insuficiente para expandir!\n\nLiberar o ${proximoLote}º canteiro custa *${formatOuro(custoExpansao)}*, você tem *${formatOuro(player.ouro)}*.`
            }, { quoted: msg });
        }
        player.ouro -= custoExpansao;
        player.fazenda.lotesMax = proximoLote;
        await player.save();
        return await conn.sendMessage(from, {
            text: `🎉 *FAZENDA EXPANDIDA!* 🌾\n\nAgora você possui *${proximoLote} canteiros* de cultivo disponíveis!\n💰 Custo pago: ${formatOuro(custoExpansao)}`,
            mentions: [sender]
        }, { quoted: msg });
    }

    let linhasLotes = [];
    const lotesOcupados = player.fazenda.lotes || [];

    for (let i = 0; i < player.fazenda.lotesMax; i++) {
        const lote = lotesOcupados[i];
        const num = i + 1;
        if (!lote) {
            linhasLotes.push(`│ [Canteiro ${num}] 🟫 *TERRA FÉRTIL VAZIA* (Pronta para semear)`);
        } else {
            const plantaInfo = PLANTACOES[lote.semente] || { nome: lote.semente, icone: '🌱', tempoMinutos: 5 };
            let tempoTotalMs = (lote.tempoTotalMin || plantaInfo.tempoMinutos) * 60 * 1000;

            if (lote.regado || clima.id === 'chuva') {
                tempoTotalMs = Math.floor(tempoTotalMs * 0.75); 
            }

            const tempoDecorrido = agora - lote.plantadoEm;
            const pronto = tempoDecorrido >= tempoTotalMs;

            if (pronto) {
                linhasLotes.push(`│ [Canteiro ${num}] ${plantaInfo.icone} *${plantaInfo.nome}* ➔ ✨ *PRONTO PARA COLHER!*`);
            } else {
                const restanteMs = tempoTotalMs - tempoDecorrido;
                const tempoStr = formatTempoRestante(restanteMs);
                const regaStr = (lote.regado || clima.id === 'chuva') ? '💧 Regado' : '☀️ Seco';
                linhasLotes.push(`│ [Canteiro ${num}] 🌱 *${plantaInfo.nome}* (${regaStr}) ➔ ⏱️ ${tempoStr}`);
            }
        }
    }

    const sementes = player.sementes || {};
    const sementesTexto = Object.keys(sementes)
        .filter(k => sementes[k] > 0)
        .map(k => `${PLANTACOES[k]?.icone || '🌱'} ${PLANTACOES[k]?.nome || k}: *${sementes[k]}x*`)
        .join(', ') || '_Nenhuma semente no estoque (Compre em !loja sementes)_';

    let texto = [
        `╭─〔 🌾 *FAZENDA IMPERIAL DO OLIMPO* 〕`,
        `│ • *Fazendeiro:* ${player.nome}`,
        `│ • *Clima:* ${clima.icone} ${clima.nome}`,
        clima.id === 'chuva' ? `│ • _A chuva está irrigando todos os canteiros!_` : null,
        `│ • *Canteiros:* ${player.fazenda.lotesMax}/10`,
        `├─〔 *Canteiros de Cultivo* 〕`,
        linhasLotes.join('\n'),
        `├─〔 *Sementes na Sacola* 〕`,
        `│ ${sementesTexto}`,
        `╰────────────────────────`,
        ``,
        `💡 *COMANDOS DA FAZENDA:*`,
        `• *${prefix}plantar <semente>* - Semear num canteiro vazio`,
        `• *${prefix}regar* - Irrigar canteiros para acelerar o crescimento em 25%`,
        `• *${prefix}colher* - Colher safras prontas e enviar ao inventário`,
        `• *${prefix}fazenda expandir* - Comprar novos canteiros de terra`
    ].filter(Boolean).join('\n');

    await conn.sendMessage(from, { text: texto }, { quoted: msg });
}

module.exports = {
    run,
    aliases
};
