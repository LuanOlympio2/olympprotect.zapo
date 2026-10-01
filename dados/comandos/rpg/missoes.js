// creditos Olympio
const { getOrCriaPlayer, verificarModoRpg, formatOuro } = require('../../funções/rpg/rpgHelper');

const aliases = ['missoes', 'missao', 'quests', 'tarefas', 'contratos'];

async function run(conn, msg, config, args, sender, senderName) {
    const from = msg.key.remoteJid;
    const prefix = config.prefix || '!';

    if (!(await verificarModoRpg(conn, from, msg, prefix))) return;

    const senderNumber = sender.replace(/[^0-9]/g, '');
    const player = await getOrCriaPlayer(senderNumber, senderName);

    const andarMasmorra = player.andarMasmorra || 1;
    const nivel = player.nivel || 1;

    let texto = [
        `╭─〔 📜 *MURAL DE CONTRATOS DO IMPÉRIO* 〕`,
        `│ 👤 *Mercenário:* ${player.nome}`,
        `│ 🎖️ *Nível do Herói:* ${nivel}`,
        `│ 📌 *CONTRATO 1: LIMPEZA DE MASMORRAS*`,
        `│ • Objetivo: Alcançar ou superar o Andar ${Math.max(5, Math.ceil(andarMasmorra / 5) * 5)}`,
        `│ • Status: ${andarMasmorra >= 5 ? '✅ *CONCLUÍDO!*' : `⏳ Andar Atual: ${andarMasmorra}`}`,
        `│ • Recompensa: ${formatOuro(1200)} + 150 XP`,
        `│ 📌 *CONTRATO 2: ABASTECIMENTO DA FEIRA*`,
        `│ • Objetivo: Cozinhar 2x Pão Rústico ou Salada`,
        `│ • Status: ${player.temItem('pao', 2) || player.temItem('salada', 2) ? '✅ *ITENS PRONTOS NA MOCHILA!*' : '⏳ Em andamento'}`,
        `│ • Recompensa: ${formatOuro(800)} + 100 XP`,
        `│ 📌 *CONTRATO 3: DOMINÂNCIA SELVAGEM*`,
        `│ • Objetivo: Abater feras na expedição de caça (!cacar)`,
        `│ • Recompensa: ${formatOuro(600)} + 80 XP`,
        `╰────────────────────────`,
        ``,
        `💡 _Cumpra os objetivos explorando as terras com *${prefix}cacar*, *${prefix}masmorra* e *${prefix}cozinhar*!_`
    ].join('\n');

    await conn.sendMessage(from, { text: texto }, { quoted: msg });
}

module.exports = {
    run,
    aliases
};
