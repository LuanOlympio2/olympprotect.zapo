// creditos Olympio
const { verificarModoRpg, formatOuro } = require('../../funções/rpg/rpgHelper');
const JSONDatabase = require('../../funções/jsonDB');

const aliases = ['rankrpg', 'toprpg', 'rankingrpg', 'placar', 'top'];

const RpgPlayerModel = JSONDatabase.model('rpg_players.json');

async function run(conn, msg, config, args, sender, senderName) {
    const from = msg.key.remoteJid;
    const prefix = config.prefix || '!';

    if (!(await verificarModoRpg(conn, from, msg, prefix))) return;

    const todosJogadores = await RpgPlayerModel.find().exec();

    if (!todosJogadores || todosJogadores.length === 0) {
        return await conn.sendMessage(from, { text: '📜 O Hall da Fama ainda está vazio! Comece a jogar para aparecer no ranking.' }, { quoted: msg });
    }

    const jogadoresComPontos = todosJogadores.map(p => {
        const nivel = p.nivel || 1;
        const fortuna = (p.ouro || 0) + (p.ouroBanco || 0);
        const masmorra = p.andarMasmorra || 1;
        const pontuacaoGeral = (nivel * 500) + Math.floor(fortuna / 5) + (masmorra * 150);

        return {
            userId: p.userId,
            nome: p.nome || 'Aventureiro',
            nivel: nivel,
            fortuna: fortuna,
            masmorra: masmorra,
            classe: p.classe || 'Aventureiro',
            pontos: pontuacaoGeral
        };
    });

    jogadoresComPontos.sort((a, b) => b.pontos - a.pontos);
    const top10 = jogadoresComPontos.slice(0, 10);

    const medalhas = ['🥇', '🥈', '🥉', '4º', '5º', '6º', '7º', '8º', '9º', '10º'];

    let linhasRanking = top10.map((j, idx) => {
        const medalha = medalhas[idx];
        return `│ ${medalha} *${j.nome}* (@${j.userId})\n│    🎖️ Nível: ${j.nivel} | 🪜 Andar: ${j.masmorra} | 💰 ${formatOuro(j.fortuna)}\n│    ⭐ Prestígio Geral: *${j.pontos.toLocaleString('pt-BR')} pts*\n│`;
    });

    let texto = [
        `╭─〔 🏆 *HALL DA FAMA GERAL DO OLIMPO* 〕`,
        `│ _Os 10 aventureiros mais lendários, ricos e temidos!_`,
        linhasRanking.join('\n'),
        `╰────────────────────────`,
        ``,
        `💡 _Evolua com *${prefix}trabalhar*, *${prefix}masmorra* e *${prefix}cacar* para subir no ranking mundial!_`
    ].join('\n');

    const mentions = top10.map(j => `${j.userId}@s.whatsapp.net`);
    await conn.sendMessage(from, { text: texto, mentions }, { quoted: msg });
}

module.exports = {
    run,
    aliases
};
