// creditos Olympio
const { getOrCriaPlayer, verificarModoRpg } = require('../../funções/rpg/rpgHelper');
const { normalizeId, resolveToPhoneJid, compareIds, cleanDeviceJid } = require('../../funções/normalizarid');
const lidCache = require('../../funções/lidCache');
const groupMetadataManager = require('../../funções/groupMetadataManager');

const aliases = ['namorar', 'pedirnamoro', 'namoro'];

const pedidosNamoro = new Map();

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
    if (participants.length > 0) {
        participants.forEach((p) => {
            if (!p) return;
            const phone = p.phoneNumber || (!p.id?.includes('@lid') ? p.id : null);
            const lid = p.lid || (p.id?.includes('@lid') ? p.id : null);
            if (phone && lid) {
                const cleanPhone = phone.includes('@') ? cleanDeviceJid(phone) : `${phone.split(':')[0]}@s.whatsapp.net`;
                const cleanLid = cleanDeviceJid(lid);
                lidCache.set(cleanPhone, cleanLid);
            }
        });
    }

    const senderPhoneJid = resolveToPhoneJid(sender, participants);
    const senderNumber = normalizeId(senderPhoneJid) || sender.replace(/[^0-9]/g, '');
    const player = await getOrCriaPlayer(senderNumber, senderName);

    let target = null;
    const contextInfo = msg.message?.extendedTextMessage?.contextInfo;
    if (contextInfo?.mentionedJid?.length > 0) {
        target = contextInfo.mentionedJid[0];
    } else if (contextInfo?.participant) {
        target = contextInfo.participant;
    } else if (args[0]) {
        const cleanArg = args[0].replace(/[^0-9]/g, '');
        if (cleanArg.length >= 8) {
            target = `${cleanArg}@s.whatsapp.net`;
        }
    }

    if (!target) {
        return await conn.sendMessage(from, {
            text: `💘 Para pedir alguém em namoro, mencione a pessoa ou responda à mensagem dela!\n\nExemplo: *${prefix}namorar @pessoa*`
        }, { quoted: msg });
    }

    const targetPhoneJid = resolveToPhoneJid(target, participants);
    const targetNumber = normalizeId(targetPhoneJid) || target.replace(/[^0-9]/g, '');

    if (targetNumber === senderNumber || compareIds(target, sender) || compareIds(targetPhoneJid, senderPhoneJid)) {
        return await conn.sendMessage(from, {
            text: `💔 Você não pode namorar a si mesmo! Procure outro aventureiro no grupo.`
        }, { quoted: msg });
    }

    const targetPlayer = await getOrCriaPlayer(targetNumber, 'Aventureiro');

    if (!player.relacionamento) {
        player.relacionamento = { status: 'solteiro', parceiro: null };
    }
    if (!targetPlayer.relacionamento) {
        targetPlayer.relacionamento = { status: 'solteiro', parceiro: null };
    }

    if (player.relacionamento.status === 'casado') {
        const parceiroNum = normalizeId(player.relacionamento.parceiro) || '';
        return await conn.sendMessage(from, {
            text: `💍 Você já é casado(a) com *@${parceiroNum}*!\nPara namorar outra pessoa, você precisa se divorciar com *${prefix}divorcio* (ou se arriscar em *${prefix}trair* 👀).`,
            mentions: player.relacionamento.parceiro ? [player.relacionamento.parceiro] : []
        }, { quoted: msg });
    }

    if (player.relacionamento.status === 'namorando') {
        const parceiroNum = normalizeId(player.relacionamento.parceiro) || '';
        return await conn.sendMessage(from, {
            text: `❤️ Você já está namorando *@${parceiroNum}*!\nSe quiser terminar, digite *${prefix}divorcio*.`,
            mentions: player.relacionamento.parceiro ? [player.relacionamento.parceiro] : []
        }, { quoted: msg });
    }

    if (targetPlayer.relacionamento.status === 'casado') {
        return await conn.sendMessage(from, {
            text: `💍 *@${targetNumber}* já é casado(a) com outra pessoa!`,
            mentions: Array.from(new Set([`${targetNumber}@s.whatsapp.net`, target]))
        }, { quoted: msg });
    }

    if (targetPlayer.relacionamento.status === 'namorando') {
        return await conn.sendMessage(from, {
            text: `💔 *@${targetNumber}* já tem um compromisso e está namorando!`,
            mentions: Array.from(new Set([`${targetNumber}@s.whatsapp.net`, target]))
        }, { quoted: msg });
    }

    const chavePedido = `${from}_${senderNumber}_${targetNumber}`;
    const chaveInversa = `${from}_${targetNumber}_${senderNumber}`;

    if (pedidosNamoro.has(chaveInversa)) {
        pedidosNamoro.delete(chaveInversa);

        const agora = Date.now();

        player.relacionamento.status = 'namorando';
        player.relacionamento.parceiro = `${targetNumber}@s.whatsapp.net`;
        player.relacionamento.parceiroNome = targetPlayer.nome || 'Amor';
        player.relacionamento.inicioNamoro = agora;

        targetPlayer.relacionamento.status = 'namorando';
        targetPlayer.relacionamento.parceiro = `${senderNumber}@s.whatsapp.net`;
        targetPlayer.relacionamento.parceiroNome = player.nome || 'Amor';
        targetPlayer.relacionamento.inicioNamoro = agora;

        await player.save();
        await targetPlayer.save();

        const allMentions = Array.from(new Set([
            `${senderNumber}@s.whatsapp.net`,
            `${targetNumber}@s.whatsapp.net`,
            sender,
            target
        ].filter(Boolean)));

        return await conn.sendMessage(from, {
            text: `💖👩‍❤️‍👨 *PEDIDO DE NAMORO ACEITO! OFICIALMENTE JUNTOS!* 💐✨\n\n🎉 Parabéns ao novo casal do Olimpo:\n❤️ *@${senderNumber}* & *@${targetNumber}*\n\n📜 _Início do Namoro: Agora mesmo!_\n⏳ *Lembrete da Tradição:* Para poderem se casar (*${prefix}casar*), vocês precisam namorar por pelo menos *2 horas*!\n\n_Que Afrodite abençoe essa bela união!_ 🌹`,
            mentions: allMentions
        }, { quoted: msg });
    }

    pedidosNamoro.set(chavePedido, { de: senderNumber, para: targetNumber, data: Date.now() });

    setTimeout(() => {
        if (pedidosNamoro.has(chavePedido)) pedidosNamoro.delete(chavePedido);
    }, 3 * 60 * 1000);

    const allMentions = Array.from(new Set([
        `${senderNumber}@s.whatsapp.net`,
        `${targetNumber}@s.whatsapp.net`,
        sender,
        target
    ].filter(Boolean)));

    await conn.sendMessage(from, {
        text: `💌 *PEDIDO DE NAMORO ENVIADO!* 🌹\n\n👤 *@${senderNumber}* pediu *@${targetNumber}* em namoro!\n\n👉 *@${targetNumber}*, para aceitar o pedido, digite:\n*${prefix}namorar @${senderNumber}*\n\n_O pedido expira em 3 minutos._`,
        mentions: allMentions
    }, { quoted: msg });
}

module.exports = {
    run,
    aliases
};
