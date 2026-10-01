// creditos Olympio
const { getOrCriaPlayer, verificarModoRpg, formatOuro } = require('../../funções/rpg/rpgHelper');
const { CHEFES_MUNDIAIS } = require('../../funções/rpg/dadosRpg');
const JSONDatabase = require('../../funções/jsonDB');

const aliases = ['boss', 'chefe', 'raid', 'tita'];

const BossModel = JSONDatabase.model('rpg_boss.json');

async function getOrInitBoss() {
    let bossData = await BossModel.findOne({ id: 'boss_atual' });
    if (!bossData || bossData.hpAtual <= 0) {
        const indice = Math.floor(Math.random() * CHEFES_MUNDIAIS.length);
        const template = CHEFES_MUNDIAIS[indice];
        bossData = new BossModel({
            id: 'boss_atual',
            bossId: template.id,
            nome: template.nome,
            hpAtual: template.hpMax,
            hpMax: template.hpMax,
            ataque: template.ataque,
            recompensaOuro: template.recompensaOuro,
            xpTotal: template.xpTotal,
            icone: template.icone,
            descricao: template.descricao,
            fraqueza: template.fraqueza,
            ranking: {}
        });
        await bossData.save();
    }
    return bossData;
}

async function run(conn, msg, config, args, sender, senderName) {
    const from = msg.key.remoteJid;
    const prefix = config.prefix || '!';

    if (!(await verificarModoRpg(conn, from, msg, prefix))) return;

    const senderNumber = sender.replace(/[^0-9]/g, '');
    const player = await getOrCriaPlayer(senderNumber, senderName);

    const boss = await getOrInitBoss();
    const acao = args[0]?.toLowerCase();

    const barraTam = 12;
    const pct = Math.max(0, Math.min(1, boss.hpAtual / boss.hpMax));
    const preenchido = Math.round(pct * barraTam);
    const barraHP = '🟥'.repeat(preenchido) + '⬜'.repeat(barraTam - preenchido);

    if (acao !== 'atacar' && acao !== 'golpe' && acao !== 'lutar') {
        const rankingEntries = Object.entries(boss.ranking || {})
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5);

        let textoRanking = rankingEntries.length > 0
            ? rankingEntries.map((e, i) => `│ ${i + 1}º @${e[0]}: *${e[1].toLocaleString('pt-BR')} de dano*`).join('\n')
            : `│ _Ninguém atingiu o chefe ainda! Seja o primeiro!_`;

        let texto = [
            `╭─〔 🌋 *RAID DO CHEFÃO MUNDIAL* 〕`,
            `│ ${boss.icone} *${boss.nome.toUpperCase()}*`,
            `│ 📜 _${boss.descricao}_`,
            `│ ❤️ *Vida Restante:* ${boss.hpAtual.toLocaleString('pt-BR')} / ${boss.hpMax.toLocaleString('pt-BR')} (${Math.round(pct * 100)}%)`,
            `│ [${barraHP}]`,
            `│ ⚔️ Poder de Ataque do Boss: ${boss.ataque}`,
            `│ ⚡ Fraqueza Declarada: *${boss.fraqueza}*`,
            `│ 💰 Tesouro da Derrota: *${formatOuro(boss.recompensaOuro)}*`,
            `│ 🏆 *TOP ATACANTES DA RAID:*`,
            textoRanking,
            `╰────────────────────────`,
            ``,
            `💡 *Para desferir um golpe épico contra o Titã:*`,
            `👉 *${prefix}chefe atacar*`
        ].join('\n');

        const mentions = rankingEntries.map(e => `${e[0]}@s.whatsapp.net`);
        return await conn.sendMessage(from, { text: texto, mentions }, { quoted: msg });
    }

    if (player.presoAte && Date.now() < player.presoAte) {
        return await conn.sendMessage(from, {
            text: `⛓️ *Você está trancado na prisão e não pode participar da raid!*`
        }, { quoted: msg });
    }

    if (player.hp <= 30) {
        return await conn.sendMessage(from, {
            text: `❤️ *Vida muito baixa (${player.hp}/${player.hpMax})!*\nO golpe do Titã te mataria! Descanse com *${prefix}descansar*.`
        }, { quoted: msg });
    }

    player.regenerarEstamina();
    const custoEstamina = 25;
    if (player.estamina < custoEstamina) {
        return await conn.sendMessage(from, {
            text: `⚡ *Estamina insuficiente!*\nAtacar o Titã consome *${custoEstamina} de Estamina* (Você tem ${player.estamina}/${player.estaminaMax}).\nDescanse com *${prefix}descansar*!`
        }, { quoted: msg });
    }
    player.consumirEstamina(custoEstamina);

    let danoJogador = player.ataque + Math.floor(Math.random() * 20);

    if (player.petAtivo === 'dragao') danoJogador += 120;
    if (player.petAtivo === 'tiranossauro') danoJogador += 160;
    if (player.petAtivo === 'velociraptor') danoJogador += 80;

    const critico = Math.random() < 0.25;
    if (critico) danoJogador = Math.floor(danoJogador * 1.8);

    const danoContraAtaque = Math.max(10, Math.floor(boss.ataque * 0.4) - Math.floor(player.defesa * 0.3));
    player.hp = Math.max(1, player.hp - danoContraAtaque);

    boss.hpAtual -= danoJogador;
    if (!boss.ranking) boss.ranking = {};
    boss.ranking[senderNumber] = (boss.ranking[senderNumber] || 0) + danoJogador;

    const derrotouBoss = boss.hpAtual <= 0;

    if (derrotouBoss) {
        boss.hpAtual = 0;
        const totalDano = Object.values(boss.ranking).reduce((a, b) => a + b, 0);
        const meuDano = boss.ranking[senderNumber] || danoJogador;
        const proporcao = Math.min(1, meuDano / Math.max(1, totalDano));
        const ouroMeu = Math.floor(boss.recompensaOuro * proporcao) + 1000;
        const xpMeu = Math.floor(boss.xpTotal * proporcao) + 200;

        player.ouro += ouroMeu;
        player.ganharXP(xpMeu);
        await player.save();

        await BossModel.findOne({ id: 'boss_atual' });
        const novoTemplate = CHEFES_MUNDIAIS[Math.floor(Math.random() * CHEFES_MUNDIAIS.length)];
        boss.bossId = novoTemplate.id;
        boss.nome = novoTemplate.nome;
        boss.hpAtual = novoTemplate.hpMax;
        boss.hpMax = novoTemplate.hpMax;
        boss.ataque = novoTemplate.ataque;
        boss.recompensaOuro = novoTemplate.recompensaOuro;
        boss.xpTotal = novoTemplate.xpTotal;
        boss.icone = novoTemplate.icone;
        boss.descricao = novoTemplate.descricao;
        boss.fraqueza = novoTemplate.fraqueza;
        boss.ranking = {};
        await boss.save();

        let msgVitoria = [
            `🎉💥 *O TITÃ CAIU! O CHEFÃO FOI DERROTADO!* 💥🎉`,
            ``,
            `⚔️ *@${senderNumber}* desferiu o *GOLPE FATAL* de *${danoJogador} de dano*!`,
            ``,
            `💰 Sua fatia do tesouro lendário: *+${formatOuro(ouroMeu)}*`,
            `⭐ XP Conquistado: *+${xpMeu} XP*`,
            ``,
            `🌋 *Um novo desafio colossual já se ergueu no horizonte do Olimpo!*`,
            `Digite *${prefix}chefe* para conhecer o novo Titã!`
        ].join('\n');

        return await conn.sendMessage(from, { text: msgVitoria, mentions: [sender] }, { quoted: msg });
    }

    await boss.save();
    player.ganharXP(15);
    await player.save();

    let resposta = [
        `⚔️ *GOLPE DESFERIDO NA RAID!*`,
        ``,
        `👤 Aventureiro: *@${senderNumber}*`,
        `💥 Dano Causado: *${danoJogador} de dano* ${critico ? '🔥 *(GOLPE CRÍTICO!)*' : ''}`,
        `👹 Contra-ataque do Titã: *-${danoContraAtaque} HP* (Vida Restante: ${player.hp}/${player.hpMax})`,
        ``,
        `❤️ Vida do Boss: *${Math.max(0, boss.hpAtual).toLocaleString('pt-BR')} / ${boss.hpMax.toLocaleString('pt-BR')}*`,
        `[${barraHP}]`,
        `📊 Seu dano total acumulado: *${boss.ranking[senderNumber].toLocaleString('pt-BR')}*`,
        ``,
        `💡 _Continue atacando com *${prefix}chefe atacar* ou cure-se com *${prefix}descansar*!_`
    ].join('\n');

    await conn.sendMessage(from, { text: resposta, mentions: [sender] }, { quoted: msg });
}

module.exports = {
    run,
    aliases
};
