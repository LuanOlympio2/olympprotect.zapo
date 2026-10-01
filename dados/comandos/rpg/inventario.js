// creditos Olympio
const { getOrCriaPlayer, verificarModoRpg, formatOuro } = require('../../funções/rpg/rpgHelper');
const { MINERIOS, PLANTACOES, INGREDIENTES_LOJA, RECEITAS_CULINARIA } = require('../../funções/rpg/dadosRpg');

const aliases = ['inventario', 'inv', 'mochila', 'bolsa'];

async function run(conn, msg, config, args, sender, senderName) {
    const from = msg.key.remoteJid;
    const prefix = config.prefix || '!';

    if (!(await verificarModoRpg(conn, from, msg, prefix))) return;

    const senderNumber = sender.replace(/[^0-9]/g, '');
    const player = await getOrCriaPlayer(senderNumber, senderName);

    const itens = player.inventario || {};
    const chavesItens = Object.keys(itens).filter(k => itens[k] > 0);

    let linhasMinerios = [];
    let linhasColheitas = [];
    let linhasCulinaria = [];
    let linhasOutros = [];

    chavesItens.forEach(itemId => {
        const qtd = itens[itemId];
        if (MINERIOS[itemId]) {
            linhasMinerios.push(`  ${MINERIOS[itemId].icone} ${MINERIOS[itemId].nome}: *${qtd}x* (Valor un: ${MINERIOS[itemId].preco} 🪙)`);
        } else if (PLANTACOES[itemId]) {
            linhasColheitas.push(`  ${PLANTACOES[itemId].icone} ${PLANTACOES[itemId].nome}: *${qtd}x* (Valor un: ${PLANTACOES[itemId].precoVenda} 🪙)`);
        } else if (RECEITAS_CULINARIA[itemId]) {
            linhasCulinaria.push(`  ${RECEITAS_CULINARIA[itemId].icone} ${RECEITAS_CULINARIA[itemId].nome}: *${qtd}x* (Valor un: ${RECEITAS_CULINARIA[itemId].precoVenda} 🪙)`);
        } else if (INGREDIENTES_LOJA[itemId]) {
            linhasCulinaria.push(`  ${INGREDIENTES_LOJA[itemId].icone} ${INGREDIENTES_LOJA[itemId].nome}: *${qtd}x*`);
        } else {
            linhasOutros.push(`  📦 ${itemId}: *${qtd}x*`);
        }
    });

    const sementes = player.sementes || {};
    let linhasSementes = [];
    Object.keys(sementes).forEach(semId => {
        const qtd = sementes[semId];
        if (qtd > 0 && PLANTACOES[semId]) {
            linhasSementes.push(`  🌱 Semente de ${PLANTACOES[semId].nome}: *${qtd}x*`);
        }
    });

    let texto = `╭─〔 🎒 *MOCHILA & INVENTÁRIO* 〕\n│ • *Dono:* ${player.nome}\n│ • *Ouro:* ${formatOuro(player.ouro)}\n`;

    if (chavesItens.length === 0 && linhasSementes.length === 0) {
        texto += `│ _Sua mochila está completamente vazia!_\n│ _Trabalhe, colha ou explore para conseguir itens._\n`;
    } else {
        if (linhasMinerios.length > 0) {
            texto += `│ ⛏️ *MINÉRIOS:*\n` + linhasMinerios.map(l => `│ ${l}`).join('\n') + `\n`;
        }
        if (linhasColheitas.length > 0) {
            texto += `│ 🌾 *COLHEITAS:*\n` + linhasColheitas.map(l => `│ ${l}`).join('\n') + `\n`;
        }
        if (linhasSementes.length > 0) {
            texto += `│ 🌱 *SEMENTES:*\n` + linhasSementes.map(l => `│ ${l}`).join('\n') + `\n`;
        }
        if (linhasCulinaria.length > 0) {
            texto += `│ 🍲 *COMIDAS & INGREDIENTES:*\n` + linhasCulinaria.map(l => `│ ${l}`).join('\n') + `\n`;
        }
        if (linhasOutros.length > 0) {
            texto += `│ 📦 *OUTROS ITENS:*\n` + linhasOutros.map(l => `│ ${l}`).join('\n') + `\n`;
        }
    }

    texto += `╰────────────────────────\n`;
    texto += `💡 _Comandos úteis:_\n• *${prefix}vender [item] [qtd]* - Vender na loja\n• *${prefix}vender tudo* - Vender todos minérios e colheitas\n• *${prefix}cozinhar* - Preparar pratos valiosos\n• *${prefix}forjar* - Forjar equipamentos novos`;

    await conn.sendMessage(from, { text: texto }, { quoted: msg });
}

module.exports = {
    run,
    aliases
};
