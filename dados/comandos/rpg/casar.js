// creditos Olympio
const { getOrCriaPlayer, verificarModoRpg, formatTempoRestante, formatOuro } = require('../../funções/rpg/rpgHelper');
const { normalizeId, resolveToPhoneJid, compareIds } = require('../../funções/normalizarid');
const groupMetadataManager = require('../../funções/groupMetadataManager');

const aliases = ['casar', 'casamento', 'matrimonio', 'unir'];

const pedidosCasamento = new Map();

async function run(conn, msg, config, args, sender, senderName) {
    const from = msg.key.remoteJid;
    const prefix = config.prefix || '!';

    if (!(await verificarModoRpg(conn, from, msg, prefix))) return;

    const isGroup = from.endsWith('@g.us');
    let groupMetadata = null;
    if (isGroup) {
        groupMetadata = groupMetadataManager.get(from) || await conn.groupMetadata(from).catch(() => null);
        if (groupMetadata) {
            groupMetadataManager.set(from, groupMetadata);
        }
    }
    const participants = groupMetadata?.participants || [];

    const senderPhoneJid = resolveToPhoneJid(sender, participants);
    const senderNumber = normalizeId(senderPhoneJid) || sender.replace(/[^0-9]/g, '');
    const player = await getOrCriaPlayer(senderNumber, senderName);

    let target = null;
    if (msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length > 0) {
        target = msg.message.extendedTextMessage.contextInfo.mentionedJid[0];
    } else if (msg.message?.extendedTextMessage?.contextInfo?.participant) {
        target = msg.message.extendedTextMessage.contextInfo.participant;
    } else if (args[0]) {
        const cleanArg = args[0].replace(/[^0-9]/g, '');
        if (cleanArg.length >= 8) {
            target = `${cleanArg}@s.whatsapp.net`;
        }
    }

    if (!target) {
        return await conn.sendMessage(from, {
            text: `💍 Para pedir seu amor em casamento, mencione o parceiro(a)!\n\nExemplo: *${prefix}casar @parceiro*`
        }, { quoted: msg });
    }

    const targetPhoneJid = resolveToPhoneJid(target, participants);
    const targetNumber = normalizeId(targetPhoneJid) || target.replace(/[^0-9]/g, '');
    const targetPlayer = await getOrCriaPlayer(targetNumber, 'Aventureiro');

    if (player.relacionamento?.status === 'casado') {
        return await conn.sendMessage(from, {
            text: `💍 Você já é casado(a) com *@${player.relacionamento.parceiro?.replace(/[^0-9]/g, '')}*!`,
            mentions: [player.relacionamento.parceiro]
        }, { quoted: msg });
    }

    const parceiroAtual = player.relacionamento?.parceiro;
    if (player.relacionamento?.status !== 'namorando' || !parceiroAtual || parceiroAtual.replace(/[^0-9]/g, '') !== targetNumber) {
        return await conn.sendMessage(from, {
            text: `❌ Você não está namorando *@${targetNumber}*!\n\nA tradição do Olimpo exige que vocês comecem um namoro primeiro com *${prefix}namorar @${targetNumber}*.`,
            mentions: [target]
        }, { quoted: msg });
    }

    const DUAS_HORAS_MS = 2 * 60 * 60 * 1000;
    const agora = Date.now();
    const tempoNamoro = agora - (player.relacionamento?.inicioNamoro || agora);

    if (tempoNamoro < DUAS_HORAS_MS) {
        const tempoRestante = DUAS_HORAS_MS - tempoNamoro;
        const tempoDecorridoStr = formatTempoRestante(tempoNamoro);
        const tempoRestanteStr = formatTempoRestante(tempoRestante);

        return await conn.sendMessage(from, {
            text: [
                `⏳ *CALMA, APAIXONADOS! AINDA NÃO É O MOMENTO!* 🕊️`,
                ``,
                `📜 _As leis sagradas do Templo de Hera determinam que o casal deve namorar por pelo menos *2 horas ininterruptas* antes de dar o sagrado passo do matrimônio!_`,
                ``,
                `⏱️ *Tempo de namoro de vocês:* ${tempoDecorridoStr}`,
                `⏳ *Tempo que ainda falta aguardar:* *${tempoRestanteStr}*`,
                ``,
                `💡 Aproveitem esse tempo para viajar juntos, explorar e conseguir a *${prefix}loja especiais* (Aliança de Ouro)!`
            ].join('\n'),
            mentions: [sender, target]
        }, { quoted: msg });
    }

    const temAlianca = player.temItem('alianca_ouro', 1) || targetPlayer.temItem('alianca_ouro', 1);
    const taxaCerimonia = 5000;

    if (!temAlianca && player.ouro < taxaCerimonia) {
        return await conn.sendMessage(from, {
            text: `❌ Para realizar a cerimônia matrimonial, vocês precisam de um *Par de Alianças de Ouro* (disponível em *${prefix}loja especiais*) ou *${formatOuro(taxaCerimonia)}* na carteira para encomendar as alianças ao sumo-sacerdote!`
        }, { quoted: msg });
    }

    const chavePedido = `${from}_${senderNumber}_${targetNumber}`;
    const chaveInversa = `${from}_${targetNumber}_${senderNumber}`;

    if (pedidosCasamento.has(chaveInversa)) {
        pedidosCasamento.delete(chaveInversa);

        if (player.temItem('alianca_ouro', 1)) {
            player.removerItem('alianca_ouro', 1);
        } else if (targetPlayer.temItem('alianca_ouro', 1)) {
            targetPlayer.removerItem('alianca_ouro', 1);
        } else {
            player.ouro -= taxaCerimonia;
        }

        player.relacionamento.status = 'casado';
        player.relacionamento.inicioCasamento = agora;
        player.relacionamento.anel = 'Aliança de Ouro Imperial';

        targetPlayer.relacionamento.status = 'casado';
        targetPlayer.relacionamento.inicioCasamento = agora;
        targetPlayer.relacionamento.anel = 'Aliança de Ouro Imperial';

        player.ganharXP(500);
        targetPlayer.ganharXP(500);

        await player.save();
        await targetPlayer.save();

        let anuncio = [
            `╭─〔 💒 *CERIMÔNIA DE CASAMENTO NO MONTE OLIMPO* 〕`,
            `│ 🕊️ _Sob o olhar benevolente de Hera e Zeus, duas almas tornam-se uma!_`,
            `│ 👰🤵 *OS NOIVOS:*`,
            `│ • *@${senderNumber}* & *@${targetNumber}*`,
            `│ 💍 *Alianças Seladas:* Aliança de Ouro Imperial 24k`,
            `│ 📜 *Status Oficial:* Casados no Reino do Olimpo`,
            `│ ⭐ *Bênção Nupcial:* +500 XP para ambos os cônjuges!`,
            `│ 💖 _"Que nada além do tempo separe esta sublime união!"_`,
            `╰────────────────────────`,
            ``,
            `🎉 Todos saúdem o mais novo casal imperial! 🥂✨`,
            `💡 _Vocês agora podem adotar filhos com *${prefix}adotar* e ver seu status com *${prefix}parceiro*!_`
        ];

        return await conn.sendMessage(from, {
            text: anuncio.join('\n'),
            mentions: [sender, target]
        }, { quoted: msg });
    }

    pedidosCasamento.set(chavePedido, { de: sender, para: target, data: agora });

    setTimeout(() => {
        if (pedidosCasamento.has(chavePedido)) pedidosCasamento.delete(chavePedido);
    }, 5 * 60 * 1000);

    await conn.sendMessage(from, {
        text: `💒 *PEDIDO SOLENE DE CASAMENTO!* 💍🌹\n\n👤 *@${senderNumber}* se ajoelhou e pediu a mão de *@${targetNumber}* em casamento diante de todo o grupo!\n\n👉 *@${targetNumber}*, se você aceita se casar, digite:\n*${prefix}casar @${senderNumber}*\n\n_Os sinos do Olimpo aguardam a resposta por 5 minutos!_`,
        mentions: [sender, target]
    }, { quoted: msg });
}

module.exports = {
    run,
    aliases
};
