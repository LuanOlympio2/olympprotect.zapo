// creditos Olympio
const { getOrCriaPlayer, verificarModoRpg, formatOuro } = require('../../funções/rpg/rpgHelper');
const { RECEITAS_ALQUIMIA } = require('../../funções/rpg/dadosRpg');

const aliases = ['alquimia', 'caldeirao', 'pocao_criar', 'pocao_receitas'];

async function run(conn, msg, config, args, sender, senderName) {
    const from = msg.key.remoteJid;
    const prefix = config.prefix || '!';

    if (!(await verificarModoRpg(conn, from, msg, prefix))) return;

    const senderNumber = sender.replace(/[^0-9]/g, '');
    const player = await getOrCriaPlayer(senderNumber, senderName);

    const subComando = args[0]?.toLowerCase();

    if (!subComando || subComando === 'receitas' || subComando === 'lista') {
        let texto = [
            `╭─〔 🧪 *LABORATÓRIO DE ALQUIMIA DO OLIMPO* 〕`,
            `│ _Misture essências raras para destilar poções milagrosas!_`,
            `│ 📜 *RECEITAS DISPONÍVEIS:*`
        ];

        Object.keys(RECEITAS_ALQUIMIA).forEach(id => {
            const r = RECEITAS_ALQUIMIA[id];
            let mats = Object.entries(r.ingredientes).map(([item, qtd]) => `${qtd}x ${item}`).join(', ');
            texto.push(`│ ${r.icone} *${r.nome}* [ID: \`${id}\`]`);
            texto.push(`│   🧪 Efeito: _${r.descricao}_`);
            texto.push(`│   🌿 Requer: ${mats}`);
            texto.push(`│   💵 Venda na loja: ${formatOuro(r.precoVenda)}`);
            texto.push(`│`);
        });

        texto.push(`╰────────────────────────`);
        texto.push(``);
        texto.push(`💡 *COMO FABRICAR:*`);
        texto.push(`• *${prefix}alquimia fabricar <id> [quantidade]*`);
        texto.push(`Exemplo: *${prefix}alquimia fabricar pocao_vida_pequena 3*`);
        texto.push(`• *${prefix}pocao* - Ver suas poções e usá-las`);

        return await conn.sendMessage(from, { text: texto.join('\n') }, { quoted: msg });
    }

    if (subComando === 'fabricar' || subComando === 'criar' || subComando === 'destilar') {
        const receitaId = args[1]?.toLowerCase();
        const quantidade = Math.max(1, parseInt(args[2], 10) || 1);

        if (!receitaId || !RECEITAS_ALQUIMIA[receitaId]) {
            return await conn.sendMessage(from, {
                text: `❌ Receita de alquimia inválida!\nDigite *${prefix}alquimia* para consultar o livro de fórmulas.`
            }, { quoted: msg });
        }

        const receita = RECEITAS_ALQUIMIA[receitaId];

        for (const [ing, qtdNecessaria] of Object.entries(receita.ingredientes)) {
            const totalPreciso = qtdNecessaria * quantidade;
            if (!player.temItem(ing, totalPreciso)) {
                const temQtd = player.inventario?.[ing] || 0;
                return await conn.sendMessage(from, {
                    text: `❌ Ingredientes insuficientes no inventário!\n\nVocê precisa de *${totalPreciso}x ${ing}*, mas possui apenas *${temQtd}x*.\n💡 Consiga ingredientes explorando, cultivando na fazenda ou na *${prefix}loja*.`
                }, { quoted: msg });
            }
        }

        for (const [ing, qtdNecessaria] of Object.entries(receita.ingredientes)) {
            player.removerItem(ing, qtdNecessaria * quantidade);
        }

        player.adicionarItem(receitaId, quantidade);

        if (!player.estatisticas) player.estatisticas = {};
        player.estatisticas.pocoesCriadas = (player.estatisticas.pocoesCriadas || 0) + quantidade;

        const xpGanho = 20 * quantidade;
        const subiuNivel = player.ganharXP(xpGanho);
        await player.save();

        let resposta = [
            `⚗️ *ALQUIMIA CONCLUÍDA COM SUCESSO!*`,
            ``,
            `👤 Alquimista: *@${senderNumber}*`,
            `🧪 Produzido: *${quantidade}x ${receita.icone} ${receita.nome}*`,
            `✨ Efeito: _${receita.descricao}_`,
            `⭐ XP de Alquimia: +${xpGanho} XP`
        ];

        if (subiuNivel) {
            resposta.push(``);
            resposta.push(`🎉 *LEVEL UP!* Você atingiu o *Nível ${player.nivel}*!`);
        }

        resposta.push(``);
        resposta.push(`💡 _Beba suas poções com *${prefix}pocao usar ${receitaId}* ou venda por bom lucro com *${prefix}vender ${receitaId}*!_`);

        return await conn.sendMessage(from, {
            text: resposta.join('\n'),
            mentions: [sender]
        }, { quoted: msg });
    }
}

module.exports = {
    run,
    aliases
};
