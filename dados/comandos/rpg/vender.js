// creditos Olympio
const { getOrCriaPlayer, verificarModoRpg, formatOuro } = require('../../funções/rpg/rpgHelper');
const { MINERIOS, PLANTACOES, RECEITAS_CULINARIA, INGREDIENTES_LOJA, PEIXES } = require('../../funções/rpg/dadosRpg');

const aliases = ['vender', 'sell'];

function getPrecoVenda(itemId) {
    if (MINERIOS[itemId]) return { preco: MINERIOS[itemId].preco, nome: MINERIOS[itemId].nome, icone: MINERIOS[itemId].icone };
    if (PLANTACOES[itemId]) return { preco: PLANTACOES[itemId].precoVenda, nome: PLANTACOES[itemId].nome, icone: PLANTACOES[itemId].icone };
    if (RECEITAS_CULINARIA[itemId]) return { preco: RECEITAS_CULINARIA[itemId].precoVenda, nome: RECEITAS_CULINARIA[itemId].nome, icone: RECEITAS_CULINARIA[itemId].icone };
    if (PEIXES[itemId]) return { preco: PEIXES[itemId].preco, nome: PEIXES[itemId].nome, icone: PEIXES[itemId].icone };
    if (INGREDIENTES_LOJA[itemId]) return { preco: Math.floor(INGREDIENTES_LOJA[itemId].preco * 0.7), nome: INGREDIENTES_LOJA[itemId].nome, icone: INGREDIENTES_LOJA[itemId].icone };
    return null;
}

async function run(conn, msg, config, args, sender, senderName) {
    const from = msg.key.remoteJid;
    const prefix = config.prefix || '!';

    if (!(await verificarModoRpg(conn, from, msg, prefix))) return;

    const senderNumber = sender.replace(/[^0-9]/g, '');
    const player = await getOrCriaPlayer(senderNumber, senderName);

    const itemId = args[0]?.toLowerCase();

    if (itemId === 'tudo' || itemId === 'all') {
        const inventario = player.inventario || {};
        let totalOuroGanho = 0;
        let itensVendidos = [];

        Object.keys(inventario).forEach(id => {
            const qtd = inventario[id];
            if (qtd > 0) {
                const info = getPrecoVenda(id);
                if (info) {
                    const ganho = info.preco * qtd;
                    totalOuroGanho += ganho;
                    itensVendidos.push(`• ${info.icone} ${info.nome} x${qtd}: +${formatOuro(ganho)}`);
                    delete inventario[id];
                }
            }
        });

        if (totalOuroGanho === 0) {
            return await conn.sendMessage(from, {
                text: `❌ Você não possui nenhum item vendível no seu inventário!\n\nTrabalhe ou cozinhe pratos para lucrar.`
            }, { quoted: msg });
        }

        player.ouro += totalOuroGanho;
        await player.save();

        let resposta = [
            `💰 *LIQUIDAÇÃO COMPLETA NO MERCADO!*`,
            ``,
            `👤 Vendedor: *@${senderNumber}*`,
            `📦 Itens Vendidos:`,
            itensVendidos.join('\n'),
            ``,
            `💵 *Lucro Total:* ${formatOuro(totalOuroGanho)}`,
            `🪙 Saldo Final: ${formatOuro(player.ouro)}`
        ].join('\n');

        return await conn.sendMessage(from, { text: resposta, mentions: [sender] }, { quoted: msg });
    }

    if (!itemId) {
        return await conn.sendMessage(from, {
            text: `❌ Especifique o que deseja vender!\n\nExemplo: *${prefix}vender ferro 5*\nExemplo: *${prefix}vender pao 2*\nOu venda todos os recursos de uma vez: *${prefix}vender tudo*`
        }, { quoted: msg });
    }

    const info = getPrecoVenda(itemId);
    if (!info) {
        return await conn.sendMessage(from, {
            text: `❌ Esse item não pode ser vendido ou não é reconhecido pelo mercado!`
        }, { quoted: msg });
    }

    const tem = player.inventario?.[itemId] || 0;
    if (tem <= 0) {
        return await conn.sendMessage(from, {
            text: `❌ Você não possui *${info.nome}* no seu inventário!`
        }, { quoted: msg });
    }

    const quantidade = args[1]?.toLowerCase() === 'tudo' ? tem : Math.min(tem, Math.max(1, parseInt(args[1], 10) || 1));
    const valorTotal = info.preco * quantidade;

    player.removerItem(itemId, quantidade);
    player.ouro += valorTotal;
    await player.save();

    await conn.sendMessage(from, {
        text: `💰 *VENDA CONCLUÍDA!*\n\n👤 Vendedor: *@${senderNumber}*\n📦 Item: *${quantidade}x ${info.icone} ${info.nome}*\n💵 Ouro Recebido: *+${formatOuro(valorTotal)}*\n🪙 Saldo Atual: *${formatOuro(player.ouro)}*`,
        mentions: [sender]
    }, { quoted: msg });
}

module.exports = {
    run,
    aliases
};
