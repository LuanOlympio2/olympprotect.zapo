// creditos Olympio
const { getOrCriaPlayer, verificarModoRpg, formatOuro, formatTempoRestante } = require('../../funções/rpg/rpgHelper');

const aliases = ['roubar', 'furtar', 'assaltar', 'rob'];
const COOLDOWN_ROUBO = 10 * 60 * 1000; 
const TEMPO_PRISAO = 15 * 60 * 1000; 

async function run(conn, msg, config, args, sender, senderName) {
    const from = msg.key.remoteJid;
    const prefix = config.prefix || '!';

    if (!(await verificarModoRpg(conn, from, msg, prefix))) return;

    if (!from.endsWith('@g.us')) {
        return await conn.sendMessage(from, { text: '❌ O submundo do crime só opera em grupos!' }, { quoted: msg });
    }

    const senderNumber = sender.replace(/[^0-9]/g, '');
    const ladrao = await getOrCriaPlayer(senderNumber, senderName);

    if (ladrao.presoAte && Date.now() < ladrao.presoAte) {
        const tempoRestante = formatTempoRestante(ladrao.presoAte - Date.now());
        return await conn.sendMessage(from, {
            text: `⛓️ *@${senderNumber}*, você já está atrás das grades da Prisão Imperial!\nAguarde *${tempoRestante}* ou pague sua fiança com *${prefix}fianca*.`,
            mentions: [sender]
        }, { quoted: msg });
    }

    const contextInfo = msg.message?.extendedTextMessage?.contextInfo;
    const mentionedJid = contextInfo?.mentionedJid || [];
    const quotedParticipant = contextInfo?.participant;
    const alvoJid = mentionedJid[0] || quotedParticipant;

    if (!alvoJid) {
        return await conn.sendMessage(from, {
            text: `❌ Você precisa marcar ou responder à mensagem de quem deseja furtar!\nExemplo: *${prefix}roubar @amigo*`
        }, { quoted: msg });
    }

    const vitimaNumber = alvoJid.replace(/[^0-9]/g, '');
    if (vitimaNumber === senderNumber) {
        return await conn.sendMessage(from, { text: '❌ Você não pode roubar a si mesmo, espertinho!' }, { quoted: msg });
    }

    const agora = Date.now();
    if (!ladrao.cooldowns) ladrao.cooldowns = {};
    const ultimoRoubo = ladrao.cooldowns.roubar || 0;
    if (agora - ultimoRoubo < COOLDOWN_ROUBO) {
        const restante = formatTempoRestante(COOLDOWN_ROUBO - (agora - ultimoRoubo));
        return await conn.sendMessage(from, {
            text: `⏳ A Guarda Imperial ainda está patrulhando o local! Aguarde *${restante}* para agir novamente.`
        }, { quoted: msg });
    }

    ladrao.regenerarEstamina();
    const custoEstamina = 15;
    if (ladrao.estamina < custoEstamina) {
        return await conn.sendMessage(from, {
            text: `⚡ *Você está cansado demais para ser furtivo!*\nRoubar exige *${custoEstamina} de Estamina* (Você tem ${ladrao.estamina}/${ladrao.estaminaMax}).`
        }, { quoted: msg });
    }
    ladrao.consumirEstamina(custoEstamina);

    const vitima = await getOrCriaPlayer(vitimaNumber);

    if (vitima.ouro < 40) {
        return await conn.sendMessage(from, {
            text: `❌ *@${vitimaNumber}* é tão pobre que nem moedas nos bolsos tem para serem furtadas!`,
            mentions: [alvoJid]
        }, { quoted: msg });
    }

    let chanceSucesso = 0.45;
    if (ladrao.petAtivo === 'gato') chanceSucesso += 0.20; 
    if (vitima.petAtivo === 'cachorro') chanceSucesso -= 0.25; 

    const deuCerto = Math.random() < chanceSucesso;
    ladrao.cooldowns.roubar = agora;

    if (deuCerto) {
        const pctRoubada = (Math.floor(Math.random() * 15) + 10) / 100; 
        const ouroRoubado = Math.min(vitima.ouro, Math.floor(vitima.ouro * pctRoubada));

        vitima.ouro -= ouroRoubado;
        ladrao.ouro += ouroRoubado;
        ladrao.karma -= 5; 

        await vitima.save();
        await ladrao.save();

        let resposta = [
            `🦹 *GATUNO EM AÇÃO! FURTO BEM-SUCEDIDO!* 💰`,
            ``,
            `👤 Ladrão: *@${senderNumber}*`,
            `🎯 Vítima Saqueada: *@${vitimaNumber}*`,
            `🪙 Ouro Furtado: *+${formatOuro(ouroRoubado)}*`,
            `🎭 Karma Perdido: *-5 Karma* (Karma atual: ${ladrao.karma})`,
            ladrao.petAtivo === 'gato' ? `🐱 _O seu Gato distraiu a vítima com perfeição!_` : null,
            ``,
            `💡 _A vítima pode revidar ou tentar a sorte na masmorra!_`
        ].filter(Boolean).join('\n');

        return await conn.sendMessage(from, { text: resposta, mentions: [sender, alvoJid] }, { quoted: msg });
    } else {
        const multa = Math.min(ladrao.ouro, Math.floor(ladrao.ouro * 0.2) + 30);
        ladrao.ouro -= multa;
        ladrao.presoAte = agora + TEMPO_PRISAO;
        ladrao.karma -= 10;
        await ladrao.save();

        let resposta = [
            `🚨 *PEGO EM FLAGRANTE PELA GUARDA IMPERIAL!* ⛓️`,
            ``,
            `👮‍♂️ *@${senderNumber}* tentou roubar *@${vitimaNumber}*, mas foi encurralado!`,
            vitima.petAtivo === 'cachorro' ? `🐶 _O Cão Pastor da vítima latiu alto e alertou a todos!_` : null,
            ``,
            `⚖️ *PENA APLICADA:*`,
            `🔒 *Preso na Masmorra por 15 minutos!*`,
            `💸 Multa da Guarda: *-${formatOuro(multa)}*`,
            `🎭 Karma: *-10 Karma* (Novo Karma: ${ladrao.karma})`,
            ``,
            `💡 _Você não poderá trabalhar, pescar ou explorar enquanto estiver preso! Pague sua fiança com *${prefix}fianca*._`
        ].filter(Boolean).join('\n');

        return await conn.sendMessage(from, { text: resposta, mentions: [sender, alvoJid] }, { quoted: msg });
    }
}

module.exports = {
    run,
    aliases
};
