// creditos Olympio
const { getOrCriaPlayer, verificarModoRpg, formatOuro } = require('../../funções/rpg/rpgHelper');
const { RECEITAS_CULINARIA, PLANTACOES, INGREDIENTES_LOJA, MINERIOS } = require('../../funções/rpg/dadosRpg');

const aliases = ['cozinhar', 'cook', 'fogao', 'preparar'];

async function run(conn, msg, config, args, sender, senderName) {
    const from = msg.key.remoteJid;
    const prefix = config.prefix || '!';

    if (!(await verificarModoRpg(conn, from, msg, prefix))) return;

    const senderNumber = sender.replace(/[^0-9]/g, '');
    const player = await getOrCriaPlayer(senderNumber, senderName);

    const receitaId = args[0]?.toLowerCase();
    const quantidade = Math.max(1, parseInt(args[1], 10) || 1);

    if (!receitaId || !RECEITAS_CULINARIA[receitaId]) {
        return await conn.sendMessage(from, {
            text: `❌ Prato ou receita não encontrada!\n\nUse: *${prefix}receitas* para ver o livro de receitas.\nExemplo de preparo: *${prefix}cozinhar pao 1*`
        }, { quoted: msg });
    }

    const receita = RECEITAS_CULINARIA[receitaId];
    const ingredientesNecessarios = receita.ingredientes;

    let faltamItens = [];
    for (const [ingId, qtdUnitaria] of Object.entries(ingredientesNecessarios)) {
        const totalNecessario = qtdUnitaria * quantidade;
        const tem = player.inventario?.[ingId] || 0;
        if (tem < totalNecessario) {
            let nomeIng = ingId;
            if (PLANTACOES[ingId]) nomeIng = PLANTACOES[ingId].nome;
            else if (INGREDIENTES_LOJA[ingId]) nomeIng = INGREDIENTES_LOJA[ingId].nome;
            else if (MINERIOS[ingId]) nomeIng = MINERIOS[ingId].nome;
            faltamItens.push(`• ${nomeIng}: precisa de ${totalNecessario}, você tem ${tem}`);
        }
    }

    if (faltamItens.length > 0) {
        return await conn.sendMessage(from, {
            text: `❌ Ingredientes insuficientes para cozinhar *${quantidade}x ${receita.nome}*!\n\nFaltando:\n${faltamItens.join('\n')}\n\n💡 _Plante na fazenda ou compre ingredientes na loja com *${prefix}loja*!_`
        }, { quoted: msg });
    }

    for (const [ingId, qtdUnitaria] of Object.entries(ingredientesNecessarios)) {
        player.removerItem(ingId, qtdUnitaria * quantidade);
    }

    player.adicionarItem(receitaId, quantidade);
    const xpGanho = 15 * quantidade;
    const subiuNivel = player.ganharXP(xpGanho);

    await player.save();

    let resposta = [
        `🍳 *FOGÃO A LENHA DA FAZENDA!*`,
        ``,
        `👨‍🍳 *@${senderNumber}*, você preparou com maestria:`,
        `🍽️ *${quantidade}x ${receita.icone} ${receita.nome}*!`,
        ``,
        `💰 *Valor de Venda Total:* ${formatOuro(receita.precoVenda * quantidade)}`,
        `⭐ *XP Culinário:* +${xpGanho} XP`,
        ``,
        `💡 _Você pode consumir este prato para restaurar Vida/Mana ou vender na loja com *${prefix}vender ${receitaId} ${quantidade}* por um lucro incrível!_`
    ];

    if (subiuNivel) {
        resposta.push(``);
        resposta.push(`🎉 *LEVEL UP!* Parabéns, você avançou para o *Nível ${player.nivel}*!`);
    }

    await conn.sendMessage(from, {
        text: resposta.join('\n'),
        mentions: [sender]
    }, { quoted: msg });
}

module.exports = {
    run,
    aliases
};
