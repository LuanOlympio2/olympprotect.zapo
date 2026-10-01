// creditos Olympio
const { getOrCriaPlayer, verificarModoRpg, formatOuro } = require('../../funções/rpg/rpgHelper');
const { CONQUISTAS } = require('../../funções/rpg/dadosRpg');

const aliases = ['conquistas', 'achievements', 'titulos', 'trofeus'];

async function run(conn, msg, config, args, sender, senderName) {
    const from = msg.key.remoteJid;
    const prefix = config.prefix || '!';

    if (!(await verificarModoRpg(conn, from, msg, prefix))) return;

    const senderNumber = sender.replace(/[^0-9]/g, '');
    const player = await getOrCriaPlayer(senderNumber, senderName);

    if (!player.conquistas) player.conquistas = [];
    if (!player.estatisticas) player.estatisticas = {};

    let recemDesbloqueadas = [];

    Object.keys(CONQUISTAS).forEach(id => {
        if (player.conquistas.includes(id)) return; 

        const c = CONQUISTAS[id];
        let atingiu = false;

        if (id === 'primeiro_passo' && player.nivel >= 3) atingiu = true;
        if (id === 'minerador_iniciante' && (player.estatisticas.mineriosMinerados || 0) >= 15) atingiu = true;
        if (id === 'fazendeiro_verde' && (player.estatisticas.plantasColhidas || 0) >= 20) atingiu = true;
        if (id === 'mestre_cuca' && (player.estatisticas.pratosCozinhados || 0) >= 8) atingiu = true;
        if (id === 'alquimista_aprendiz' && (player.estatisticas.pocoesCriadas || 0) >= 5) atingiu = true;
        if (id === 'cacador_feras' && (player.estatisticas.monstrosDerrotados || 0) >= 10) atingiu = true;
        if (id === 'coracao_valente' && player.nivel >= 10) atingiu = true;
        if (id === 'domador' && (player.petsPossuidos?.length || 0) >= 2) atingiu = true;
        if (id === 'magnata' && (player.ouroBanco || 0) >= 1000000) atingiu = true;
        if (id === 'eterno_amor' && player.relacionamento?.status === 'casado') atingiu = true;
        if (id === 'olho_aberto' && ((player.relacionamento?.traicoesSofridas || 0) > 0 || (player.relacionamento?.historicoTraicoes?.length || 0) > 0)) atingiu = true;
        if (id === 'patriarca' && (player.relacionamento?.filhos?.length || 0) >= 1) atingiu = true;

        if (atingiu) {
            player.conquistas.push(id);
            player.ouro += c.recompensaOuro;
            player.ganharXP(c.xp);
            recemDesbloqueadas.push(c);
        }
    });

    if (recemDesbloqueadas.length > 0) {
        await player.save();
    }

    let texto = [
        `╭─〔 🏆 *SALA DE TROFÉUS & CONQUISTAS* 〕`,
        `│ • *Campeão:* ${player.nome}`,
        `│ ⭐ *Conquistas Obtidas:* *${player.conquistas.length} / ${Object.keys(CONQUISTAS).length}*`,];

    if (recemDesbloqueadas.length > 0) {
        texto.push(`│ 🎉 *NOVAS CONQUISTAS DESBLOQUEADAS AGORA:*`);
        recemDesbloqueadas.forEach(c => {
            texto.push(`│ ✨ *${c.nome}* (+${formatOuro(c.recompensaOuro)} | +${c.xp} XP | Título: "${c.titulo}")`);
        });
        texto.push(`│`);
    }

    texto.push(`│ 📜 *QUADRO GERAL DE CONQUISTAS:*`);
    Object.keys(CONQUISTAS).forEach(id => {
        const c = CONQUISTAS[id];
        const tem = player.conquistas.includes(id);
        const simbolo = tem ? '✅' : '🔒';
        texto.push(`│ ${simbolo} *${c.nome}* ${tem ? `[Título: "${c.titulo}"]` : ''}`);
        texto.push(`│    _${c.desc}_ - Prêmio: ${formatOuro(c.recompensaOuro)}`);
    });

    texto.push(`│`);
    texto.push(`╰────────────────────────`);
    texto.push(``);
    texto.push(`💡 _As conquistas recompensam seu esforço diário sem quebrar a economia do reino!_`);

    await conn.sendMessage(from, { text: texto.join('\n') }, { quoted: msg });
}

module.exports = {
    run,
    aliases
};
