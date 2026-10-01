// creditos Olympio
const { getOrCriaPlayer, verificarModoRpg, formatOuro, formatTempoRestante } = require('../../funções/rpg/rpgHelper');
const { LOCAIS_EXPLORACAO, MINERIOS, PLANTACOES, INGREDIENTES_LOJA } = require('../../funções/rpg/dadosRpg');

const aliases = ['explorar', 'explore', 'expedicao', 'procurar'];
const COOLDOWN_EXPLORAR = 4 * 60 * 1000; 

async function run(conn, msg, config, args, sender, senderName) {
    const from = msg.key.remoteJid;
    const prefix = config.prefix || '!';

    if (!(await verificarModoRpg(conn, from, msg, prefix))) return;

    const senderNumber = sender.replace(/[^0-9]/g, '');
    const player = await getOrCriaPlayer(senderNumber, senderName);

    if (player.presoAte && Date.now() < player.presoAte) {
        return await conn.sendMessage(from, {
            text: `⛓️ *Você está trancado na prisão e não pode explorar nada!*\nUse *${prefix}fianca* para sair.`
        }, { quoted: msg });
    }

    const agora = Date.now();
    const ultimaExploracao = player.cooldowns?.explorar || 0;
    if (agora - ultimaExploracao < COOLDOWN_EXPLORAR) {
        const restante = formatTempoRestante(COOLDOWN_EXPLORAR - (agora - ultimaExploracao));
        return await conn.sendMessage(from, {
            text: `⏳ Você ainda está recuperando as energias da sua última expedição!\nAguarde *${restante}*.`
        }, { quoted: msg });
    }

    player.regenerarEstamina();
    let custoEstamina = 20;
    if (player.petAtivo === 'coelho') custoEstamina = 12; 

    if (player.estamina < custoEstamina) {
        return await conn.sendMessage(from, {
            text: `⚡ *Você está sem fôlego para explorar!*\n\nExplorar consome *${custoEstamina} de Estamina*, você tem *${player.estamina}/${player.estaminaMax}*.\nDescanse alguns instantes ou use *${prefix}upar estamina* para ter mais fôlego!`
        }, { quoted: msg });
    }

    player.consumirEstamina(custoEstamina);

    const localAtual = LOCAIS_EXPLORACAO.find(l => l.id === player.localizacao) || LOCAIS_EXPLORACAO[0];

    let msgEvento = '';
    let ouroGanho = 0;
    let itemDropado = null;
    let danoSofro = 0;

    const sorte = Math.random();

    const esquivou = player.petAtivo === 'velociraptor' && Math.random() < 0.35;
    const protegeuCachorro = player.petAtivo === 'cachorro' && Math.random() < 0.30;

    if (sorte < localAtual.riscoMorte && player.localizacao !== 'vila_iniciantes' && !esquivou && !protegeuCachorro) {
        const danoBruto = Math.floor(localAtual.nivelRecomendado * 10) + Math.floor(Math.random() * 20);
        danoSofro = Math.max(5, danoBruto - Math.floor(player.defesa * 0.4));

        if (player.petAtivo === 'tartaruga') {
            danoSofro = Math.max(3, Math.floor(danoSofro * 0.7));
        }

        player.hp = Math.max(1, player.hp - danoSofro);
        msgEvento = `⚠️ *PERIGO NA EXPEDIÇÃO!*\nVocê foi emboscado por criaturas ferozes de *${localAtual.nome}* e sofreu *${danoSofro} de dano*!\n(Sua defesa absorveu parte do impacto).`;
    } else if (esquivou) {
        msgEvento = `🦎 *ESQUIVA VELOZ DO VELOCIRAPTOR!*\nCriaturas tentaram uma emboscada, mas seu Velociraptor te alertou e você desviou com perfeição!`;
    } else if (protegeuCachorro) {
        msgEvento = `🐶 *GUARDA FIEL DO CÃO PASTOR!*\nSeu cão pastor rosnou e espantou os monstros antes que eles te atacassem!`;
    } else {
        const chanceFogueira = Math.random();
        if (chanceFogueira < 0.20) {
            player.estamina = player.estaminaMax;
            const curaHP = Math.min(player.hpMax - player.hp, 40);
            player.hp += curaHP;
            player.mp = Math.min(player.mpMax, player.mp + 30);
            player.ultimaRegenEstamina = agora;
            msgEvento = `🔥 *REFÚGIO NA NATUREZA!*\nVocê encontrou uma fogueira acesa entre as rochas e por ali descansou com serenidade!\n⚡ Estamina restaurada ao máximo (${player.estaminaMax}/${player.estaminaMax})!\n❤️ Vida recuperada: +${curaHP} HP!`;
        } else {
            const chanceDrop = Math.random();
            if (chanceDrop > 0.45 && localAtual.dropsPossiveis.length > 0) {
                const dropId = localAtual.dropsPossiveis[Math.floor(Math.random() * localAtual.dropsPossiveis.length)];
                const qtdDrop = Math.floor(Math.random() * 2) + 1;
                player.adicionarItem(dropId, qtdDrop);

                let nomeDrop = dropId;
                let iconeDrop = '📦';
                if (MINERIOS[dropId]) { nomeDrop = MINERIOS[dropId].nome; iconeDrop = MINERIOS[dropId].icone; }
                else if (PLANTACOES[dropId]) { nomeDrop = PLANTACOES[dropId].nome; iconeDrop = PLANTACOES[dropId].icone; }
                else if (INGREDIENTES_LOJA[dropId]) { nomeDrop = INGREDIENTES_LOJA[dropId].nome; iconeDrop = INGREDIENTES_LOJA[dropId].icone; }

                itemDropado = `${iconeDrop} ${nomeDrop} x${qtdDrop}`;
            }

            ouroGanho = Math.floor(localAtual.nivelRecomendado * 12) + Math.floor(Math.random() * 40) + 15;
            player.ouro += ouroGanho;
            msgEvento = `✨ *SUCESSO NA EXPEDIÇÃO!*\nVocê vasculhou as redondezas de *${localAtual.nome}* e encontrou segredos valiosos!`;
        }
    }

    const xpGanho = 30 + (localAtual.nivelRecomendado * 5);
    const subiuNivel = player.ganharXP(xpGanho);
    player.cooldowns.explorar = agora;

    await player.save();

    let resposta = [
        `🧭 *RELATÓRIO DE EXPLORAÇÃO*`,
        ``,
        `📍 *Local:* ${localAtual.icone} ${localAtual.nome}`,
        `👤 *Explorador:* @${senderNumber}`,
        ``,
        msgEvento,
        ``
    ];

    if (ouroGanho > 0) resposta.push(`🪙 *Ouro Encontrado:* +${formatOuro(ouroGanho)}`);
    if (itemDropado) resposta.push(`🎁 *Tesouro Resgatado:* ${itemDropado}`);
    if (danoSofro > 0) resposta.push(`❤️ *Vida Atual:* ${player.hp}/${player.hpMax}`);

    resposta.push(`⭐ *XP de Aventura:* +${xpGanho} XP`);

    if (subiuNivel) {
        resposta.push(``);
        resposta.push(`🎉 *LEVEL UP!* Parabéns, você avançou para o *Nível ${player.nivel}*!`);
    }

    resposta.push(``);
    resposta.push(`💡 _Venda seus tesouros com *${prefix}vender* ou consulte sua mochila com *${prefix}inventario*!_`);

    await conn.sendMessage(from, { text: resposta.join('\n'), mentions: [sender] }, { quoted: msg });
}

module.exports = {
    run,
    aliases
};
