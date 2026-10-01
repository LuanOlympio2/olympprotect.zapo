// creditos Olympio
const { verificarModoRpg, formatOuro } = require('../../funções/rpg/rpgHelper');
const { PLANTACOES, INGREDIENTES_LOJA, MINERIOS, RECEITAS_CULINARIA } = require('../../funções/rpg/dadosRpg');

const aliases = ['loja', 'shop', 'mercado', 'emporio'];

async function run(conn, msg, config, args, sender, senderName) {
    const from = msg.key.remoteJid;
    const prefix = config.prefix || '!';

    if (!(await verificarModoRpg(conn, from, msg, prefix))) return;

    const aba = args[0]?.toLowerCase();

    if (aba === 'sementes' || aba === 'fazenda') {
        let texto = `╭─〔 🌱 *EMPÓRIO DE SEMENTES* 〕\n`;
        Object.keys(PLANTACOES).forEach(id => {
            const p = PLANTACOES[id];
            texto += `│ ${p.icone} *Semente de ${p.nome}* [ID: \`${id}\`]\n`;
            texto += `│   💰 Compra: ${formatOuro(p.precoSemente)} | 💵 Venda do fruto: ${formatOuro(p.precoVenda)}\n`;
            texto += `│   ⏱️ Tempo de colheita: ${p.tempoMinutos} minutos\n`;
        });
        texto += `╰────────────────────────\n`;
        texto += `👉 Compre com: *${prefix}comprar <id> [quantidade]*\nExemplo: *${prefix}comprar trigo 5*`;
        return await conn.sendMessage(from, { text: texto }, { quoted: msg });
    }

    if (aba === 'ingredientes' || aba === 'cozinha') {
        let texto = `╭─〔 🧂 *DESPENSA DE INGREDIENTES* 〕\n`;
        Object.keys(INGREDIENTES_LOJA).forEach(id => {
            const ing = INGREDIENTES_LOJA[id];
            texto += `│ ${ing.icone} *${ing.nome}* [ID: \`${id}\`]\n`;
            texto += `│   💰 Preço: ${formatOuro(ing.preco)}\n`;
        });
        texto += `╰────────────────────────\n`;
        texto += `👉 Compre com: *${prefix}comprar <id> [quantidade]*\nExemplo: *${prefix}comprar leite 2*`;
        return await conn.sendMessage(from, { text: texto }, { quoted: msg });
    }

    if (aba === 'pesca' || aba === 'pescador') {
        let texto = `╭─〔 🎣 *CASA DE PESCA DO VELHO MARINHEIRO* 〕\n`;
        texto += `│ 🛶 *VARAS DE PESCA:*\n`;
        const { ITENS_PESCA } = require('../../funções/rpg/dadosRpg');
        Object.keys(ITENS_PESCA.varas).forEach(id => {
            const v = ITENS_PESCA.varas[id];
            texto += `│ • ${v.icone} *${v.nome}* [ID: \`${id}\`]\n`;
            texto += `│   💰 Preço: ${formatOuro(v.preco)} | ⭐ Bônus: +${v.bonusCaptura}%\n`;
        });
        texto += `│\n│ 🪱 *ISCAS ATRATIVAS:*\n`;
        Object.keys(ITENS_PESCA.iscas).forEach(id => {
            const isca = ITENS_PESCA.iscas[id];
            texto += `│ • ${isca.icone} *${isca.nome}* [ID: \`${id}\`]\n`;
            texto += `│   💰 Preço: ${formatOuro(isca.preco)} un | 🎯 Atração: +${isca.atracao}%\n`;
        });
        texto += `╰────────────────────────\n`;
        texto += `👉 Compre com: *${prefix}comprar <id> [quantidade]*\nExemplo: *${prefix}comprar vara_bambu*\nExemplo: *${prefix}comprar isca_minhoca 10*`;
        return await conn.sendMessage(from, { text: texto }, { quoted: msg });
    }

    if (aba === 'especiais' || aba === 'especial' || aba === 'banco' || aba === 'casamento') {
        let texto = `╭─〔 🏛️ *ITENS ESPECIAIS & IMPERIAIS* 〕\n`;
        const { ITENS_ESPECIAIS_LOJA } = require('../../funções/rpg/dadosRpg');
        Object.keys(ITENS_ESPECIAIS_LOJA).forEach(id => {
            const esp = ITENS_ESPECIAIS_LOJA[id];
            texto += `│ • ${esp.icone} *${esp.nome}* [ID: \`${id}\`]\n`;
            texto += `│   💰 Preço: ${formatOuro(esp.preco)}\n`;
            texto += `│   📝 _${esp.desc}_\n`;
        });
        texto += `╰────────────────────────\n`;
        texto += `👉 Compre com: *${prefix}comprar <id> [quantidade]*\nExemplo: *${prefix}comprar cofre 1*\nExemplo: *${prefix}comprar alianca_ouro*`;
        return await conn.sendMessage(from, { text: texto }, { quoted: msg });
    }

    let texto = [
        `╭─〔 🏪 *GRANDE MERCADO DO OLIMPO* 〕`,
        `│ _Compre insumos, sementes, ingredientes e pesca,_`,
        `│ _ou venda seus recursos por ouro!_`,
        `│ 📌 *SEÇÕES DISPONÍVEIS:*`,
        `│ 🌱 *${prefix}loja sementes* - 10 tipos de sementes para plantio`,
        `│ 🧂 *${prefix}loja ingredientes* - Itens para culinária e receitas`,
        `│ 🎣 *${prefix}loja pesca* - Varas e iscas para pescadores`,
        `│ 🏛️ *${prefix}loja especiais* - Cofres para o banco e alianças de casamento`,
        `│ 💰 *TABELA RÁPIDA DE VENDA:*`,
        `│ • Minérios: Cobre (15), Ferro (30), Prata (60), Ouro (120)...`,
        `│ • Pratos Culinários: Pão (50), Salada (130), Bolo (180), Vinho (650)...`,
        `│ • Colheitas: Trigo (10), Tomate (35), Café (105), Uva (135)...`,
        `╰────────────────────────`,
        ``,
        `💡 *COMO NEGOCIAR:*`,
        `• *${prefix}comprar <item> [qtd]* - Comprar da loja`,
        `• *${prefix}vender <item> [qtd]* - Vender do inventário`,
        `• *${prefix}vender tudo* - Vender todos minérios e colheitas de uma vez!`
    ].join('\n');

    await conn.sendMessage(from, { text: texto }, { quoted: msg });
}

module.exports = {
    run,
    aliases
};
