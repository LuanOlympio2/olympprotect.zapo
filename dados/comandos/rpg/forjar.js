// creditos Olympio
const { getOrCriaPlayer, verificarModoRpg, formatOuro } = require('../../funções/rpg/rpgHelper');
const { FORJA, MINERIOS } = require('../../funções/rpg/dadosRpg');

const aliases = ['forjar', 'forja', 'craft', 'ferreiro'];

async function run(conn, msg, config, args, sender, senderName) {
    const from = msg.key.remoteJid;
    const prefix = config.prefix || '!';

    if (!(await verificarModoRpg(conn, from, msg, prefix))) return;

    const senderNumber = sender.replace(/[^0-9]/g, '');
    const player = await getOrCriaPlayer(senderNumber, senderName);

    const categoriaArg = args[0]?.toLowerCase();
    const itemIdArg = args[1]?.toLowerCase();

    const categoriasValidas = {
        picareta: 'picaretas',
        picaretas: 'picaretas',
        espada: 'espadas',
        espadas: 'espadas',
        arma: 'espadas',
        escudo: 'escudos',
        escudos: 'escudos',
        armadura: 'armaduras',
        armaduras: 'armaduras'
    };

    if (!categoriaArg || !categoriasValidas[categoriaArg]) {
        let texto = `╭─〔 ⚒️ *FORJA DO FERREIRO REAL* 〕\n`;
        texto += `│ _Forje picaretas melhores para colher mais minérios,_\n│ _e armas/armaduras poderosas para suas batalhas!_\n`;

        texto += `├─〔 *Picaretas de Mineração* 〕\n`;
        Object.keys(FORJA.picaretas).forEach(id => {
            const p = FORJA.picaretas[id];
            const matList = Object.keys(p.materiais).map(m => `${p.materiais[m]}x ${MINERIOS[m]?.nome || m}`).join(', ') || 'Nenhum';
            texto += `│ • ${p.icone} *${p.nome}* [\`${id}\`]\n`;
            texto += `│   Preço: ${formatOuro(p.custoOuro)} | Minérios: ${matList} | +${p.bonusMinerio}% Minérios\n`;
        });

        texto += `├─〔 *Espadas de Combate* 〕\n`;
        Object.keys(FORJA.espadas).forEach(id => {
            const e = FORJA.espadas[id];
            const matList = Object.keys(e.materiais).map(m => `${e.materiais[m]}x ${MINERIOS[m]?.nome || m}`).join(', ');
            texto += `│ • ${e.icone} *${e.nome}* [\`${id}\`]\n`;
            texto += `│   Preço: ${formatOuro(e.custoOuro)} | Minérios: ${matList} | +${e.ataque} Ataque\n`;
        });

        texto += `├─〔 *Escudos Defensivos* 〕\n`;
        Object.keys(FORJA.escudos).forEach(id => {
            const sc = FORJA.escudos[id];
            const matList = Object.keys(sc.materiais).map(m => `${sc.materiais[m]}x ${MINERIOS[m]?.nome || m}`).join(', ');
            texto += `│ • ${sc.icone} *${sc.nome}* [\`${id}\`]\n`;
            texto += `│   Preço: ${formatOuro(sc.custoOuro)} | Minérios: ${matList} | +${sc.defesa} Defesa\n`;
        });

        texto += `├─〔 *Armaduras Corporais* 〕\n`;
        Object.keys(FORJA.armaduras).forEach(id => {
            const a = FORJA.armaduras[id];
            const matList = Object.keys(a.materiais).map(m => `${a.materiais[m]}x ${MINERIOS[m]?.nome || m}`).join(', ');
            texto += `│ • ${a.icone} *${a.nome}* [\`${id}\`]\n`;
            texto += `│   Preço: ${formatOuro(a.custoOuro)} | Minérios: ${matList} | +${a.hpMax} HP, +${a.defesa} Defesa\n`;
        });

        texto += `╰────────────────────────\n`;
        texto += `💡 Como forjar:\n👉 *${prefix}forjar <categoria> <id_item>*\nExemplo: *${prefix}forjar picareta picareta_ferro*\nExemplo: *${prefix}forjar espada espada_ferro*`;

        return await conn.sendMessage(from, { text: texto }, { quoted: msg });
    }

    const catKey = categoriasValidas[categoriaArg];
    if (!itemIdArg || !FORJA[catKey][itemIdArg]) {
        return await conn.sendMessage(from, {
            text: `❌ Item não encontrado nessa categoria da forja!\n\nDigite *${prefix}forjar* para consultar a lista completa.`
        }, { quoted: msg });
    }

    const itemData = FORJA[catKey][itemIdArg];

    if (player.ouro < itemData.custoOuro) {
        return await conn.sendMessage(from, {
            text: `❌ Ouro insuficiente!\n\nVocê precisa de *${formatOuro(itemData.custoOuro)}*, mas possui apenas *${formatOuro(player.ouro)}*.`
        }, { quoted: msg });
    }

    let faltamMinerios = [];
    for (const [minId, qtdMin] of Object.entries(itemData.materiais)) {
        const tem = player.inventario?.[minId] || 0;
        if (tem < qtdMin) {
            const nomeMin = MINERIOS[minId]?.nome || minId;
            faltamMinerios.push(`• ${nomeMin}: precisa de ${qtdMin}, você tem ${tem}`);
        }
    }

    if (faltamMinerios.length > 0) {
        return await conn.sendMessage(from, {
            text: `❌ Minérios insuficientes para forjar *${itemData.nome}*!\n\nFaltando:\n${faltamMinerios.join('\n')}\n\n💡 _Consiga minérios trabalhando como minerador (*${prefix}empregos escolher minerador*) ou comprando na loja!_`
        }, { quoted: msg });
    }

    player.ouro -= itemData.custoOuro;
    for (const [minId, qtdMin] of Object.entries(itemData.materiais)) {
        player.removerItem(minId, qtdMin);
    }

    if (!player.equipamentos) player.equipamentos = {};

    let msgBonus = '';
    if (catKey === 'picaretas') {
        player.equipamentos.picareta = itemIdArg;
        msgBonus = `⛏️ Bônus de extração: +${itemData.bonusMinerio}% ao minerar!`;
    } else if (catKey === 'espadas') {
        player.equipamentos.arma = itemIdArg;
        player.ataque = 10 + itemData.ataque;
        msgBonus = `⚔️ Ataque aumentado para ${player.ataque}!`;
    } else if (catKey === 'escudos') {
        player.equipamentos.escudo = itemIdArg;
        player.defesa = 5 + itemData.defesa;
        msgBonus = `🛡️ Defesa aumentada para ${player.defesa}!`;
    } else if (catKey === 'armaduras') {
        player.equipamentos.armadura = itemIdArg;
        player.hpMax = 100 + itemData.hpMax;
        player.hp = player.hpMax;
        msgBonus = `❤️ Vida Máxima aumentada para ${player.hpMax}!`;
    }

    player.ganharXP(50);
    await player.save();

    await conn.sendMessage(from, {
        text: `⚒️ *ITEM FORJADO COM SUCESSO!* ⚒️\n\n🎉 Parabéns, *@${senderNumber}*!\nVocê forjou e equipou: *${itemData.icone} ${itemData.nome}*!\n\n${msgBonus}\n💰 Saldo restante: ${formatOuro(player.ouro)}`,
        mentions: [sender]
    }, { quoted: msg });
}

module.exports = {
    run,
    aliases
};
