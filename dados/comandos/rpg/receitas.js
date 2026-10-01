// creditos Olympio
const { verificarModoRpg, formatOuro } = require('../../funções/rpg/rpgHelper');
const { RECEITAS_CULINARIA, PLANTACOES, INGREDIENTES_LOJA, MINERIOS } = require('../../funções/rpg/dadosRpg');

const aliases = ['receitas', 'culinaria', 'livrodereceitas', 'cozinha'];

async function run(conn, msg, config, args, sender, senderName) {
    const from = msg.key.remoteJid;
    const prefix = config.prefix || '!';

    if (!(await verificarModoRpg(conn, from, msg, prefix))) return;

    let texto = `╭─〔 🍳 *LIVRO DE RECEITAS DA FAZENDA* 〕\n`;
    texto += `│ _Cozinhe ingredientes para vender pratos prontos_\n│ _por um valor muito maior do que os itens separados!_\n`;

    Object.keys(RECEITAS_CULINARIA).forEach(key => {
        const r = RECEITAS_CULINARIA[key];
        texto += `│ ${r.icone} *${r.nome.toUpperCase()}* [ID: \`${key}\`]\n`;
        texto += `│ 💰 Preço de Venda: *${formatOuro(r.precoVenda)}*\n`;
        texto += `│ 📜 Ingredientes:\n`;

        Object.keys(r.ingredientes).forEach(ingId => {
            const qtd = r.ingredientes[ingId];
            let nomeIng = ingId;
            if (PLANTACOES[ingId]) nomeIng = `${PLANTACOES[ingId].icone} ${PLANTACOES[ingId].nome}`;
            else if (INGREDIENTES_LOJA[ingId]) nomeIng = `${INGREDIENTES_LOJA[ingId].icone} ${INGREDIENTES_LOJA[ingId].nome}`;
            else if (MINERIOS[ingId]) nomeIng = `${MINERIOS[ingId].icone} ${MINERIOS[ingId].nome}`;
            texto += `│   • ${nomeIng} x${qtd}\n`;
        });

        texto += `│ ✨ Efeito: ${r.descricao}\n`;
    });

    texto += `╰────────────────────────\n`;
    texto += `💡 Como preparar:\n👉 *${prefix}cozinhar <id_da_receita> [quantidade]*\nExemplo: *${prefix}cozinhar pao 2*`;

    await conn.sendMessage(from, { text: texto }, { quoted: msg });
}

module.exports = {
    run,
    aliases
};
