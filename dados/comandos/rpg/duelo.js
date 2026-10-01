// creditos Olympio
const { getOrCriaPlayer, verificarModoRpg, formatOuro } = require('../../funções/rpg/rpgHelper');
const { normalizeId, resolveToPhoneJid, compareIds, cleanDeviceJid } = require('../../funções/normalizarid');
const lidCache = require('../../funções/lidCache');
const groupMetadataManager = require('../../funções/groupMetadataManager');

const aliases = ['duelo', 'pvp', 'desafio', 'lutar'];

if (!global.duelosRpg) global.duelosRpg = new Map();

async function run(conn, msg, config, args, sender, senderName) {
    const from = msg.key.remoteJid;
    const prefix = config.prefix || '!';

    if (!(await verificarModoRpg(conn, from, msg, prefix))) return;

    if (!from.endsWith('@g.us')) {
        return await conn.sendMessage(from, { text: '❌ Os duelos na arena só podem ser travados em grupos!' }, { quoted: msg });
    }

    let groupMetadata = groupMetadataManager.get(from) || await conn.groupMetadata(from).catch(() => null);
    if (groupMetadata) {
        groupMetadataManager.set(from, groupMetadata);
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

    const subcomando = args[0]?.toLowerCase();

    if (subcomando === 'recusar' || subcomando === 'rejeitar' || subcomando === 'nao' || subcomando === 'não') {
        const desafioExistente = global.duelosRpg.get(from);
        if (desafioExistente) {
            const isAlvo = desafioExistente.alvo === senderNumber ||
                compareIds(desafioExistente.alvo, senderNumber) ||
                compareIds(desafioExistente.alvoJid, sender) ||
                (desafioExistente.rawAlvoJid && compareIds(desafioExistente.rawAlvoJid, sender));

            if (isAlvo) {
                global.duelosRpg.delete(from);
                return await conn.sendMessage(from, {
                    text: `🏳️ *@${senderNumber}* amarelou e recusou o duelo covardemente!`,
                    mentions: [`${senderNumber}@s.whatsapp.net`, sender]
                }, { quoted: msg });
            }
        }
        return await conn.sendMessage(from, { text: '❌ Não há nenhum duelo pendente direcionado a você para recusar.' }, { quoted: msg });
    }

    if (subcomando === 'aceitar' || subcomando === 'sim') {
        const desafio = global.duelosRpg.get(from);
        if (!desafio) {
            return await conn.sendMessage(from, { text: '❌ Não há nenhum duelo pendente neste grupo.' }, { quoted: msg });
        }

        const isAlvo = desafio.alvo === senderNumber ||
            compareIds(desafio.alvo, senderNumber) ||
            compareIds(desafio.alvoJid, sender) ||
            (desafio.rawAlvoJid && compareIds(desafio.rawAlvoJid, sender));

        if (!isAlvo) {
            return await conn.sendMessage(from, { text: '❌ Não há nenhum duelo pendente direcionado a você neste grupo.' }, { quoted: msg });
        }

        if (Date.now() > desafio.expiraEm) {
            global.duelosRpg.delete(from);
            return await conn.sendMessage(from, { text: '⏳ O tempo para aceitar o duelo expirou!' }, { quoted: msg });
        }

        const desafiante = await getOrCriaPlayer(desafio.desafiante);
        const desafiado = player;

        if ((desafiante.ouro || 0) < desafio.aposta || (desafiado.ouro || 0) < desafio.aposta) {
            global.duelosRpg.delete(from);
            return await conn.sendMessage(from, { text: '❌ Um dos duelistas não possui mais o ouro apostado!' }, { quoted: msg });
        }

        global.duelosRpg.delete(from);

        let atq1 = desafiante.ataque || 10;
        let atq2 = desafiado.ataque || 10;

        if (desafiante.petAtivo === 'dragao') atq1 += 120;
        if (desafiante.petAtivo === 'tiranossauro') atq1 += 150;
        if (desafiado.petAtivo === 'dragao') atq2 += 120;
        if (desafiado.petAtivo === 'tiranossauro') atq2 += 150;

        let hp1 = desafiante.hp || 100;
        let hp2 = desafiado.hp || 100;

        let turnos = 0;
        while (hp1 > 0 && hp2 > 0 && turnos < 15) {
            turnos++;
            const dano1 = Math.max(10, atq1 - Math.floor((desafiado.defesa || 5) * 0.4) + Math.floor(Math.random() * 15));
            hp2 -= dano1;
            if (hp2 <= 0) break;

            const dano2 = Math.max(10, atq2 - Math.floor((desafiante.defesa || 5) * 0.4) + Math.floor(Math.random() * 15));
            hp1 -= dano2;
        }

        const desafianteVenceu = hp2 <= 0 || (hp1 >= hp2);
        const vencedor = desafianteVenceu ? desafiante : desafiado;
        const perdedor = desafianteVenceu ? desafiado : desafiante;
        const vencedorNum = desafianteVenceu ? desafio.desafiante : senderNumber;
        const perdedorNum = desafianteVenceu ? senderNumber : desafio.desafiante;

        perdedor.ouro = Math.max(0, (perdedor.ouro || 0) - desafio.aposta);
        vencedor.ouro = (vencedor.ouro || 0) + desafio.aposta;

        if (typeof vencedor.ganharXP === 'function') {
            vencedor.ganharXP(100);
        }
        perdedor.hp = Math.max(1, (perdedor.hp || 100) - 30);

        await desafiante.save();
        await desafiado.save();

        let resposta = [
            `⚔️💥 *DUELO FINALIZADO NA ARENA DE COMBATE!* 💥⚔️`,
            ``,
            `🤺 Duelistas: @${desafio.desafiante} ⚔️ @${senderNumber}`,
            `💰 Aposta em Jogo: ${formatOuro(desafio.aposta * 2)}`,
            ``,
            `🏆 *VENCEDOR:* *@${vencedorNum}*!`,
            `💀 *DERROTADO:* *@${perdedorNum}*!`,
            ``,
            `🎉 O campeão levou o prêmio de *+${formatOuro(desafio.aposta * 2)}* e honra eterna!`,
            `🪙 Novo saldo do campeão: *${formatOuro(vencedor.ouro)}*`
        ].join('\n');

        const duelMentions = Array.from(new Set([
            `${desafio.desafiante}@s.whatsapp.net`,
            `${senderNumber}@s.whatsapp.net`,
            desafio.desafianteJid,
            sender
        ].filter(Boolean)));

        return await conn.sendMessage(from, { text: resposta, mentions: duelMentions }, { quoted: msg });
    }

    const contextInfo = msg.message?.extendedTextMessage?.contextInfo;
    let alvoJid = null;
    if (contextInfo?.mentionedJid?.length > 0) {
        alvoJid = contextInfo.mentionedJid[0];
    } else if (contextInfo?.participant) {
        alvoJid = contextInfo.participant;
    } else {
        const targetArg = args.find(a => /^\d{8,}/.test(a.replace(/[^0-9]/g, '')));
        if (targetArg) {
            alvoJid = `${targetArg.replace(/[^0-9]/g, '')}@s.whatsapp.net`;
        }
    }

    const apostaArg = args.find(a => /^\d+$/.test(a));
    const aposta = Math.max(10, parseInt(apostaArg, 10) || 50);

    if (!alvoJid) {
        return await conn.sendMessage(from, {
            text: `⚔️ *ARENA DE DUELOS PVP* ⚔️\n\nDesafie outro guerreiro valendo ouro!\n👉 *${prefix}duelo @amigo <aposta>*\nExemplo: *${prefix}duelo @amigo 200*`
        }, { quoted: msg });
    }

    const targetPhoneJid = resolveToPhoneJid(alvoJid, participants);
    const alvoNumber = normalizeId(targetPhoneJid) || alvoJid.replace(/[^0-9]/g, '');

    if (alvoNumber === senderNumber || compareIds(alvoJid, sender) || compareIds(targetPhoneJid, senderPhoneJid)) {
        return await conn.sendMessage(from, { text: '❌ Você não pode duelar contra si mesmo!' }, { quoted: msg });
    }

    if ((player.ouro || 0) < aposta) {
        return await conn.sendMessage(from, {
            text: `❌ Você não possui ouro suficiente para essa aposta de *${formatOuro(aposta)}*!\nSaldo disponível: *${formatOuro(player.ouro || 0)}*.`
        }, { quoted: msg });
    }

    const alvoPlayer = await getOrCriaPlayer(alvoNumber, 'Guerreiro');
    if ((alvoPlayer.ouro || 0) < aposta) {
        return await conn.sendMessage(from, {
            text: `❌ O guerreiro *@${alvoNumber}* não possui *${formatOuro(aposta)}* para bancar o desafio!`,
            mentions: Array.from(new Set([`${alvoNumber}@s.whatsapp.net`, alvoJid]))
        }, { quoted: msg });
    }

    global.duelosRpg.set(from, {
        desafiante: senderNumber,
        desafianteJid: `${senderNumber}@s.whatsapp.net`,
        alvo: alvoNumber,
        alvoJid: `${alvoNumber}@s.whatsapp.net`,
        rawAlvoJid: alvoJid,
        aposta: aposta,
        expiraEm: Date.now() + 2 * 60 * 1000
    });

    let resposta = [
        `⚔️🔥 *DESAFIO DE DUELO LANÇADO NA ARENA!* 🔥⚔️`,
        ``,
        `🤺 *@${senderNumber}* desafiou *@${alvoNumber}* para um duelo de sangue e honra!`,
        `💰 Aposta da Partida: *${formatOuro(aposta)}* de cada lado! (Prêmio: ${formatOuro(aposta * 2)})`,
        ``,
        `👉 *@${alvoNumber}*, você tem *2 minutos* para responder:`,
        `• Digite *${prefix}duelo aceitar* para entrar na arena!`,
        `• Digite *${prefix}duelo recusar* para fugir da batalha.`
    ].join('\n');

    const challengeMentions = Array.from(new Set([
        `${senderNumber}@s.whatsapp.net`,
        `${alvoNumber}@s.whatsapp.net`,
        sender,
        alvoJid
    ].filter(Boolean)));

    await conn.sendMessage(from, { text: resposta, mentions: challengeMentions }, { quoted: msg });
}

module.exports = {
    run,
    aliases
};
