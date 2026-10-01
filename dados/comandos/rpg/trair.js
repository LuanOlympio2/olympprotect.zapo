// creditos Olympio
const { getOrCriaPlayer, verificarModoRpg, formatTempoRestante } = require('../../funções/rpg/rpgHelper');

const aliases = ['trair', 'amante', 'pulacerca'];
const COOLDOWN_TRAIR = 15 * 60 * 1000; 

async function run(conn, msg, config, args, sender, senderName) {
    const from = msg.key.remoteJid;
    const prefix = config.prefix || '!';

    if (!(await verificarModoRpg(conn, from, msg, prefix))) return;

    const senderNumber = sender.replace(/[^0-9]/g, '');
    const player = await getOrCriaPlayer(senderNumber, senderName);

    const statusRel = player.relacionamento?.status;
    const parceiroJid = player.relacionamento?.parceiro;

    if (!statusRel || statusRel === 'solteiro' || !parceiroJid) {
        return await conn.sendMessage(from, {
            text: `💔 Você é solteiro(a)! Não tem como trair se você não namora nem é casado com ninguém.\n💡 Comece um relacionamento com *${prefix}namorar @alguem*.`
        }, { quoted: msg });
    }

    let amanteJid = null;
    if (msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length > 0) {
        amanteJid = msg.message.extendedTextMessage.contextInfo.mentionedJid[0];
    } else if (msg.message?.extendedTextMessage?.contextInfo?.participant) {
        amanteJid = msg.message.extendedTextMessage.contextInfo.participant;
    }

    if (!amanteJid) {
        return await conn.sendMessage(from, {
            text: `👀 Para tentar uma aventura proibida, mencione a pessoa pretendida como amante!\n\nExemplo: *${prefix}trair @amante*`
        }, { quoted: msg });
    }

    if (amanteJid === sender) {
        return await conn.sendMessage(from, {
            text: `❌ Você não pode trair consigo mesmo!`
        }, { quoted: msg });
    }

    const amanteNumber = amanteJid.replace(/[^0-9]/g, '');
    const parceiroNumber = parceiroJid.replace(/[^0-9]/g, '');

    if (amanteNumber === parceiroNumber) {
        return await conn.sendMessage(from, {
            text: `😂 *@${amanteNumber}* já é seu(sua) próprio(a) parceiro(a) oficial! Não é traição namorar quem você já tem!`,
            mentions: [amanteJid]
        }, { quoted: msg });
    }

    const agora = Date.now();
    const ultimoTrair = player.cooldowns?.trair || 0;
    if (agora - ultimoTrair < COOLDOWN_TRAIR) {
        const restante = formatTempoRestante(COOLDOWN_TRAIR - (agora - ultimoTrair));
        return await conn.sendMessage(from, {
            text: `⏳ *@${senderNumber}*, você acabou de ter um encontro clandestino! Fique quieto por *${restante}* para não levantar suspeitas.`,
            mentions: [sender]
        }, { quoted: msg });
    }

    player.cooldowns.trair = agora;

    const amantePlayer = await getOrCriaPlayer(amanteNumber, 'Amante');
    const parceiroPlayer = await getOrCriaPlayer(parceiroNumber, 'Cônjuge');

    if (!player.relacionamento.historicoTraicoes) player.relacionamento.historicoTraicoes = [];
    if (!parceiroPlayer.relacionamento.historicoTraicoes) parceiroPlayer.relacionamento.historicoTraicoes = [];

    const foiFlagrado = Math.random() < 0.50;

    if (foiFlagrado) {
        player.relacionamento.traicoesCometidas = (player.relacionamento.traicoesCometidas || 0) + 1;
        parceiroPlayer.relacionamento.traicoesSofridas = (parceiroPlayer.relacionamento.traicoesSofridas || 0) + 1;
        player.karma = (player.karma || 0) - 8;

        const registroTraidor = {
            tipo: 'flagra',
            amante: `@${amanteNumber}`,
            parceiroNaEpoca: `@${parceiroNumber}`,
            data: agora,
            statusNaEpoca: statusRel
        };

        const registroVitima = {
            tipo: 'chifre_recebido',
            traidor: `@${senderNumber}`,
            amante: `@${amanteNumber}`,
            data: agora,
            statusNaEpoca: statusRel
        };

        player.relacionamento.historicoTraicoes.push(registroTraidor);
        parceiroPlayer.relacionamento.historicoTraicoes.push(registroVitima);

        await player.save();
        await parceiroPlayer.save();

        let escandalo = [
            `🚨🔥 *FLAGRA DE TRAIÇÃO NO OLIMPO! ESCÂNDALO TOTAL!* 🔥🚨`,
            ``,
            `👀 O pombo-correio imperial da fofoca flagrou tudo em praça pública!`,
            ``,
            `💔 *O TRAIDOR(A):* *@${senderNumber}*`,
            `💋 *O(A) AMANTE:* *@${amanteNumber}*`,
            `🐂 *A VÍTIMA (CHIFRUDO):* *@${parceiroNumber}*`,
            ``,
            `⚖️ *Penalidade:* -8 de Karma para o infiel!`,
            `📜 *Histórico:* Essa traição foi gravada eternamente no registro criminal e conjugal!`,
            ``,
            `💔 _E agora, @${parceiroNumber}? Vai perdoar ou pedir *${prefix}divorcio*?_`,
            `💡 _Consulte o relatório com *${prefix}historicotraicao @${senderNumber}*_`
        ];

        return await conn.sendMessage(from, {
            text: escandalo.join('\n'),
            mentions: [sender, amanteJid, parceiroJid]
        }, { quoted: msg });

    } else {
        player.relacionamento.traicoesCometidas = (player.relacionamento.traicoesCometidas || 0) + 1;

        const registroSigiloso = {
            tipo: 'sigilo',
            amante: `@${amanteNumber}`,
            parceiroNaEpoca: `@${parceiroNumber}`,
            data: agora,
            statusNaEpoca: statusRel
        };

        player.relacionamento.historicoTraicoes.push(registroSigiloso);
        await player.save();

        let resposta = [
            `🤫 *ENCONTRO CLANDESTINO BEM-SUCEDIDO!* 🌙`,
            ``,
            `👤 Aventureiro(a): *@${senderNumber}*`,
            `💋 Aventura com: *@${amanteNumber}*`,
            `🙈 Seu parceiro oficial (*@${parceiroNumber}*) não desconfiou de absolutamente nada!`,
            ``,
            `📜 _No entanto, os registros divinos guardam essa escapada sigilosa no seu histórico..._`,
            `💡 Veja seus segredos com *${prefix}historicotraicao*`
        ];

        return await conn.sendMessage(from, {
            text: resposta.join('\n'),
            mentions: [sender, amanteJid, parceiroJid]
        }, { quoted: msg });
    }
}

module.exports = {
    run,
    aliases
};
