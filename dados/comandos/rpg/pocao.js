// creditos Olympio
const { getOrCriaPlayer, verificarModoRpg } = require('../../funções/rpg/rpgHelper');
const { RECEITAS_ALQUIMIA } = require('../../funções/rpg/dadosRpg');

const aliases = ['pocao', 'potion', 'curar', 'beber'];

async function run(conn, msg, config, args, sender, senderName) {
    const from = msg.key.remoteJid;
    const prefix = config.prefix || '!';

    if (!(await verificarModoRpg(conn, from, msg, prefix))) return;

    const senderNumber = sender.replace(/[^0-9]/g, '');
    const player = await getOrCriaPlayer(senderNumber, senderName);

    player.regenerarEstamina();

    let acaoOuId = args[0]?.toLowerCase();
    let itemId = acaoOuId;

    if (acaoOuId === 'usar' || acaoOuId === 'beber' || acaoOuId === 'tomar') {
        itemId = args[1]?.toLowerCase();
    }

    if (!itemId || itemId === 'auto') {
        const pocoesVida = ['pocao_vida_grande', 'pocao_vida_media', 'pocao_vida_pequena', 'elixir_olimpico'];
        let encontrou = null;

        for (const pId of pocoesVida) {
            if (player.temItem(pId, 1)) {
                encontrou = pId;
                break;
            }
        }

        if (!encontrou) {
            let textoInventario = [];
            Object.keys(RECEITAS_ALQUIMIA).forEach(id => {
                const qtd = player.inventario?.[id] || 0;
                if (qtd > 0) {
                    const r = RECEITAS_ALQUIMIA[id];
                    textoInventario.push(`• ${r.icone} *${r.nome}* (\`${id}\`): *${qtd}x*`);
                }
            });

            let msgResposta = `🧪 *SEU BOLSO DE POÇÕES E ELIXIRES:*\n\n`;
            if (textoInventario.length > 0) {
                msgResposta += textoInventario.join('\n') + `\n\n`;
                msgResposta += `👉 Para consumir uma poção:\n*${prefix}pocao usar <id>*\nExemplo: *${prefix}pocao usar pocao_vida_pequena*`;
            } else {
                msgResposta += `Você não possui nenhuma poção no inventário!\n\n💡 Fabrique suas próprias poções digitando *${prefix}alquimia*!`;
            }

            return await conn.sendMessage(from, { text: msgResposta }, { quoted: msg });
        }

        itemId = encontrou;
    }

    if (!RECEITAS_ALQUIMIA[itemId]) {
        return await conn.sendMessage(from, {
            text: `❌ Poção ou elixir não reconhecido!\nDigite *${prefix}pocao* para ver seus frascos disponíveis.`
        }, { quoted: msg });
    }

    if (!player.temItem(itemId, 1)) {
        return await conn.sendMessage(from, {
            text: `❌ Você não possui nenhum exemplar de *${RECEITAS_ALQUIMIA[itemId].nome}* no inventário!`
        }, { quoted: msg });
    }

    const pocao = RECEITAS_ALQUIMIA[itemId];
    player.removerItem(itemId, 1);

    let efeitoTexto = '';

    if (pocao.tipo === 'cura_hp') {
        const hpAntigo = player.hp;
        player.hp = Math.min(player.hpMax, player.hp + pocao.restauraHP);
        const curado = player.hp - hpAntigo;
        efeitoTexto = `❤️ Vida Restaurada: *+${curado} HP* (Atual: ${player.hp}/${player.hpMax})`;

    } else if (pocao.tipo === 'cura_mp') {
        const mpAntigo = player.mp;
        player.mp = Math.min(player.mpMax, player.mp + pocao.restauraMP);
        const curado = player.mp - mpAntigo;
        efeitoTexto = `🔮 Mana Restaurada: *+${curado} MP* (Atual: ${player.mp}/${player.mpMax})`;

    } else if (pocao.tipo === 'cura_estamina') {
        const estAntiga = player.estamina;
        player.estamina = Math.min(player.estaminaMax, player.estamina + pocao.restauraEstamina);
        const recuperado = player.estamina - estAntiga;
        efeitoTexto = `⚡ Estamina Recuperada: *+${recuperado} Pontos* (Atual: ${player.estamina}/${player.estaminaMax})`;

    } else if (pocao.tipo === 'buff_ataque') {
        player.ataque = (player.ataque || 10) + pocao.buffAtaque;
        efeitoTexto = `🔥 Fúria Berserk Ativada! Seu ataque aumentou em *+${pocao.buffAtaque}* permanentemente nesta sessão!`;

    } else if (pocao.tipo === 'cura_total') {
        player.hp = player.hpMax;
        player.mp = player.mpMax;
        player.estamina = player.estaminaMax;
        efeitoTexto = `✨ Néctar Supremo dos Deuses! Seu *HP, MP e Estamina* foram 100% regenerados!`;
    }

    await player.save();

    await conn.sendMessage(from, {
        text: `🧪 *FRASCO CONSUMIDO COM SUCESSO!* 🍷\n\n👤 Aventureiro: *@${senderNumber}*\n🍶 Poção Bebida: *${pocao.icone} ${pocao.nome}*\n\n${efeitoTexto}`,
        mentions: [sender]
    }, { quoted: msg });
}

module.exports = {
    run,
    aliases
};
