// creditos Olympio
const { getOrCriaPlayer, verificarModoRpg, formatOuro } = require('../../funções/rpg/rpgHelper');
const { PLANTACOES, INGREDIENTES_LOJA } = require('../../funções/rpg/dadosRpg');

const aliases = ['comprar', 'buy'];

async function run(conn, msg, config, args, sender, senderName) {
    const from = msg.key.remoteJid;
    const prefix = config.prefix || '!';

    if (!(await verificarModoRpg(conn, from, msg, prefix))) return;

    const senderNumber = sender.replace(/[^0-9]/g, '');
    const player = await getOrCriaPlayer(senderNumber, senderName);

    const itemId = args[0]?.toLowerCase();
    const quantidade = Math.max(1, parseInt(args[1], 10) || 1);

    if (!itemId) {
        return await conn.sendMessage(from, {
            text: `❌ Especifique o item que deseja comprar!\n\nExemplo: *${prefix}comprar trigo 5*\nExemplo: *${prefix}comprar leite 2*\nConsulte a loja com *${prefix}loja*.`
        }, { quoted: msg });
    }

    let precoUnitario = null;
    let nomeItem = itemId;
    let icone = '📦';
    let isSemente = false;
    const { ITENS_PESCA, ITENS_ESPECIAIS_LOJA } = require('../../funções/rpg/dadosRpg');

    let isEspecial = false;

    if (PLANTACOES[itemId]) {
        precoUnitario = PLANTACOES[itemId].precoSemente;
        nomeItem = `Semente de ${PLANTACOES[itemId].nome}`;
        icone = PLANTACOES[itemId].icone;
        isSemente = true;
    } else if (INGREDIENTES_LOJA[itemId]) {
        precoUnitario = INGREDIENTES_LOJA[itemId].preco;
        nomeItem = INGREDIENTES_LOJA[itemId].nome;
        icone = INGREDIENTES_LOJA[itemId].icone;
    } else if (ITENS_PESCA?.varas?.[itemId]) {
        precoUnitario = ITENS_PESCA.varas[itemId].preco;
        nomeItem = ITENS_PESCA.varas[itemId].nome;
        icone = ITENS_PESCA.varas[itemId].icone;
        isVara = true;
    } else if (ITENS_PESCA?.iscas?.[itemId]) {
        precoUnitario = ITENS_PESCA.iscas[itemId].preco;
        nomeItem = ITENS_PESCA.iscas[itemId].nome;
        icone = ITENS_PESCA.iscas[itemId].icone;
    } else if (ITENS_ESPECIAIS_LOJA?.[itemId]) {
        precoUnitario = ITENS_ESPECIAIS_LOJA[itemId].preco;
        nomeItem = ITENS_ESPECIAIS_LOJA[itemId].nome;
        icone = ITENS_ESPECIAIS_LOJA[itemId].icone;
        isEspecial = true;
    }

    if (precoUnitario === null) {
        return await conn.sendMessage(from, {
            text: `❌ Item não disponível para compra na loja!\n\nConsulte o catálogo digitando *${prefix}loja*.`
        }, { quoted: msg });
    }

    const custoTotal = precoUnitario * quantidade;

    if (player.ouro < custoTotal) {
        return await conn.sendMessage(from, {
            text: `❌ Ouro insuficiente!\n\nVocê precisa de *${formatOuro(custoTotal)}*, mas possui apenas *${formatOuro(player.ouro)}*.`
        }, { quoted: msg });
    }

    player.ouro -= custoTotal;

    if (itemId === 'cofre') {
        player.cofres = (player.cofres || 0) + quantidade;
        await player.save();

        return await conn.sendMessage(from, {
            text: `🗄️ *COFRE(S) BLINDADO(S) INSTALADO(S)!* 🔒\n\n👤 Comprador: *@${senderNumber}*\n📦 Adquirido: *+${quantidade} Cofre(s) de Aço Imperial*\n💰 Valor Pago: *${formatOuro(custoTotal)}*\n🏛️ Novo Teto do Banco: *${formatOuro(player.getLimiteBanco())}* (+${quantidade}M de capacidade expandida!)\n🪙 Saldo na Carteira: *${formatOuro(player.ouro)}*`,
            mentions: [sender]
        }, { quoted: msg });
    }

    if (isSemente) {
        if (!player.sementes) player.sementes = {};
        player.sementes[itemId] = (player.sementes[itemId] || 0) + quantidade;
    } else {
        player.adicionarItem(itemId, quantidade);
    }

    await player.save();

    await conn.sendMessage(from, {
        text: `🛒 *COMPRA REALIZADA COM SUCESSO!*\n\n👤 Comprador: *@${senderNumber}*\n📦 Item: *${quantidade}x ${icone} ${nomeItem}*\n💰 Total Pago: *${formatOuro(custoTotal)}*\n🪙 Saldo Atual: *${formatOuro(player.ouro)}*`,
        mentions: [sender]
    }, { quoted: msg });
}

module.exports = {
    run,
    aliases
};
