// creditos Olympio
const { getOrCriaPlayer, verificarModoRpg, formatOuro } = require('../../funções/rpg/rpgHelper');

const aliases = ['pixrpg', 'transferir', 'pix', 'doar'];

async function run(conn, msg, config, args, sender, senderName) {
    const from = msg.key.remoteJid;
    const prefix = config.prefix || '!';

    if (!(await verificarModoRpg(conn, from, msg, prefix))) return;

    const senderNumber = sender.replace(/[^0-9]/g, '');
    const remetente = await getOrCriaPlayer(senderNumber, senderName);

    const contextInfo = msg.message?.extendedTextMessage?.contextInfo;
    const mentionedJid = contextInfo?.mentionedJid || [];
    const quotedParticipant = contextInfo?.participant;
    const destinatarioJid = mentionedJid[0] || quotedParticipant;

    const valor = parseInt(args.find(a => /^\d+$/.test(a)), 10);

    if (!destinatarioJid || !valor || valor <= 0) {
        return await conn.sendMessage(from, {
            text: `💸 *TRANSFERÊNCIA BANCÁRIA SEGURA (PIX RPG)* 💸\n\nComo transferir:\n👉 *${prefix}pixrpg @amigo <valor>*\nExemplo: *${prefix}pixrpg @amigo 300*`
        }, { quoted: msg });
    }

    const destNumber = destinatarioJid.replace(/[^0-9]/g, '');
    if (destNumber === senderNumber) {
        return await conn.sendMessage(from, { text: '❌ Você não pode transferir dinheiro para você mesmo!' }, { quoted: msg });
    }

    const saldoTotal = (remetente.ouro || 0) + (remetente.ouroBanco || 0);
    if (saldoTotal < valor) {
        return await conn.sendMessage(from, {
            text: `❌ Saldo total insuficiente!\nVocê tentou transferir *${formatOuro(valor)}*, mas seu patrimônio total é de *${formatOuro(saldoTotal)}*.`
        }, { quoted: msg });
    }

    if (remetente.ouro >= valor) {
        remetente.ouro -= valor;
    } else {
        const restante = valor - remetente.ouro;
        remetente.ouro = 0;
        remetente.ouroBanco -= restante;
    }

    const destinatario = await getOrCriaPlayer(destNumber);
    destinatario.ouroBanco = (destinatario.ouroBanco || 0) + valor; 

    remetente.karma = (remetente.karma || 0) + 2;

    await remetente.save();
    await destinatario.save();

    let resposta = [
        `💸 *PIX REALIZADO COM SUCESSO!* 🏦`,
        ``,
        `👤 Remetente: *@${senderNumber}*`,
        `🎯 Destinatário: *@${destNumber}*`,
        `💰 Valor Transferido: *+${formatOuro(valor)}*`,
        `✨ Karma Concedido: *+2 Karma Nobre*`,
        ``,
        `🔒 _O valor foi depositado diretamente no cofre seguro do destinatário!_`
    ].join('\n');

    await conn.sendMessage(from, { text: resposta, mentions: [sender, destinatarioJid] }, { quoted: msg });
}

module.exports = {
    run,
    aliases
};
