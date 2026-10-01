// creditos Olympio
const { getOrCriaPlayer, verificarModoRpg, formatOuro, formatTempoRestante } = require('../../funções/rpg/rpgHelper');
const { CRIMES } = require('../../funções/rpg/dadosRpg');

const aliases = ['crime', 'delito', 'submundo', 'infracao'];
const COOLDOWN_CRIME = 10 * 60 * 1000; 

async function run(conn, msg, config, args, sender, senderName) {
    const from = msg.key.remoteJid;
    const prefix = config.prefix || '!';

    if (!(await verificarModoRpg(conn, from, msg, prefix))) return;

    const senderNumber = sender.replace(/[^0-9]/g, '');
    const player = await getOrCriaPlayer(senderNumber, senderName);

    if (player.presoAte && Date.now() < player.presoAte) {
        const tempoPreso = formatTempoRestante(player.presoAte - Date.now());
        return await conn.sendMessage(from, {
            text: `⛓️ *Você já está trancafiado na Prisão Imperial!*\n\nAinda restam *${tempoPreso}* de cela ou pague sua fiança com *${prefix}fianca*.`
        }, { quoted: msg });
    }

    const crimeId = args[0]?.toLowerCase();

    if (!crimeId || !CRIMES[crimeId]) {
        let texto = [
            `╭─〔 🗡️ *SUBMUNDO DO CRIME DO OLIMPO* 〕`,
            `│ _O submundo oferece riqueza fácil, mas guardas e calabouços espreitam..._`,
            `│ 📜 *DELITOS PLANEJÁVEIS:*`
        ];

        Object.keys(CRIMES).forEach(id => {
            const c = CRIMES[id];
            texto.push(`│ 💀 *${c.nome}* [ID: \`${id}\`]`);
            texto.push(`│   🎯 Risco de Prisão: *${Math.round(c.risco * 100)}%* | Nível Mínimo: ${c.nivelMin}`);
            texto.push(`│   ⚡ Custo: ${c.estamina} Estamina | ⏳ Pena de Cela: ${c.tempoPresoMin}m`);
            texto.push(`│   💰 Lucro Estimado: ${formatOuro(c.recompensaOuro[0])} ~ ${formatOuro(c.recompensaOuro[1])}`);
            texto.push(`│   ⚖️ Penalidade: -${c.karmaPerda} de Karma se falhar`);
            texto.push(`│   📝 _${c.desc}_`);
            texto.push(`│`);
        });

        texto.push(`╰────────────────────────`);
        texto.push(``);
        texto.push(`👉 Para cometer um crime: *${prefix}crime <id>*`);
        texto.push(`Exemplo: *${prefix}crime bater_carteira*`);

        return await conn.sendMessage(from, { text: texto.join('\n') }, { quoted: msg });
    }

    const agora = Date.now();
    const ultimoCrime = player.cooldowns?.crime || 0;
    if (agora - ultimoCrime < COOLDOWN_CRIME) {
        const restante = formatTempoRestante(COOLDOWN_CRIME - (agora - ultimoCrime));
        return await conn.sendMessage(from, {
            text: `⏳ *@${senderNumber}*, os guardas imperiais ainda estão em alerta após o último delito!\n\nEspere a poeira baixar em *${restante}*.`,
            mentions: [sender]
        }, { quoted: msg });
    }

    const crime = CRIMES[crimeId];

    if (player.nivel < crime.nivelMin) {
        return await conn.sendMessage(from, {
            text: `❌ Nível insuficiente! Você precisa ser pelo menos *Nível ${crime.nivelMin}* para cometer o delito *${crime.nome}*.`
        }, { quoted: msg });
    }

    player.regenerarEstamina();
    if (player.estamina < crime.estamina) {
        return await conn.sendMessage(from, {
            text: `⚡ Estamina insuficiente! Você precisa de *${crime.estamina} de Estamina*, mas possui apenas *${player.estamina}/${player.estaminaMax}*.`
        }, { quoted: msg });
    }

    player.consumirEstamina(crime.estamina);
    player.cooldowns.crime = agora;

    let chanceFalha = crime.risco;
    if (player.petAtivo === 'gato') {
        chanceFalha = Math.max(0.1, chanceFalha - 0.15);
    }

    const sorteio = Math.random();

    if (sorteio < chanceFalha) {
        const minutosPrisao = crime.tempoPresoMin;
        player.presoAte = agora + (minutosPrisao * 60 * 1000);
        player.karma = (player.karma || 0) - crime.karmaPerda;

        const multa = Math.min(player.ouro, Math.floor(player.ouro * 0.25));
        player.ouro -= multa;

        await player.save();

        let resposta = [
            `🚨 *EMBOSCADA DA GUARDA IMPERIAL! VOCÊ FOI PRESO!* ⛓️`,
            ``,
            `👤 Criminoso: *@${senderNumber}*`,
            `💀 Crime Tentado: *${crime.nome}*`,
            `⚖️ Karma Perdido: *-${crime.karmaPerda}* (Karma Atual: ${player.karma})`,
            `🏛️ Pena de Reclusão: *${minutosPrisao} minutos* de cela na masmorra imperial!`
        ];

        if (multa > 0) {
            resposta.push(`💸 Multa e Confisco da Carteira: *-${formatOuro(multa)}*`);
        }

        resposta.push(``);
        resposta.push(`💡 _Dica: Você pode pagar sua fiança com *${prefix}fianca* ou aguardar o fim da pena._`);

        return await conn.sendMessage(from, {
            text: resposta.join('\n'),
            mentions: [sender]
        }, { quoted: msg });
    }

    const ouroMin = crime.recompensaOuro[0];
    const ouroMax = crime.recompensaOuro[1];
    const ouroGanho = Math.floor(Math.random() * (ouroMax - ouroMin + 1)) + ouroMin;
    const xpGanho = Math.floor(ouroGanho * 0.25) + 15;

    player.ouro += ouroGanho;
    player.karma = (player.karma || 0) - Math.ceil(crime.karmaPerda / 2); 

    if (!player.estatisticas) player.estatisticas = {};
    player.estatisticas.crimesCometidos = (player.estatisticas.crimesCometidos || 0) + 1;

    const subiuNivel = player.ganharXP(xpGanho);
    await player.save();

    let resposta = [
        `🥷 *GOLPE PERFEITO NO SUBMUNDO!* 💰`,
        ``,
        `👤 Infrator: *@${senderNumber}*`,
        `🗡️ Delito Executado: *${crime.nome}*`,
        `💰 Ouro Ilícito Saqueado: *+${formatOuro(ouroGanho)}*`,
        `⭐ XP Subterrâneo: +${xpGanho} XP`,
        `⚖️ Impacto Moral: *-${Math.ceil(crime.karmaPerda / 2)} Karma* (Atual: ${player.karma})`
    ];

    if (subiuNivel) {
        resposta.push(``);
        resposta.push(`🎉 *LEVEL UP!* Você atingiu o *Nível ${player.nivel}*!`);
    }

    resposta.push(``);
    resposta.push(`💡 _Guarde o ouro rápido no banco (*${prefix}depositar*) antes que outro ladrão tente te roubar!_`);

    return await conn.sendMessage(from, {
        text: resposta.join('\n'),
        mentions: [sender]
    }, { quoted: msg });
}

module.exports = {
    run,
    aliases
};
