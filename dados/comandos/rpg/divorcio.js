// creditos Olympio
const { getOrCriaPlayer, verificarModoRpg, formatOuro } = require('../../funções/rpg/rpgHelper');
const { normalizeId } = require('../../funções/normalizarid');

const aliases = ['divorcio', 'terminar', 'separar'];

async function run(conn, msg, config, args, sender, senderName) {
    const from = msg.key.remoteJid;
    const prefix = config.prefix || '!';

    if (!(await verificarModoRpg(conn, from, msg, prefix))) return;

    const senderNumber = normalizeId(sender) || sender.replace(/[^0-9]/g, '');
    const player = await getOrCriaPlayer(senderNumber, senderName);

    const rel = player.relacionamento;
    if (!rel || rel.status === 'solteiro' || !rel.parceiro) {
        return await conn.sendMessage(from, {
            text: `💔 Você já é solteiro(a)! Não há nenhum relacionamento ativo para terminar.`
        }, { quoted: msg });
    }

    const exJid = rel.parceiro;
    const exNumber = normalizeId(exJid) || exJid.replace(/[^0-9]/g, '');
    const exPlayer = await getOrCriaPlayer(exNumber, 'Ex-Parceiro');
    const eraCasamento = rel.status === 'casado';

    let pensaoOuro = 0;
    if (eraCasamento && player.ouro > 0) {
        pensaoOuro = Math.floor(player.ouro * 0.20);
        player.ouro -= pensaoOuro;
        exPlayer.ouro += pensaoOuro;
    }

    player.relacionamento.status = 'solteiro';
    player.relacionamento.parceiro = null;
    player.relacionamento.parceiroNome = null;
    player.relacionamento.inicioNamoro = 0;
    player.relacionamento.inicioCasamento = 0;
    player.relacionamento.anel = null;

    exPlayer.relacionamento.status = 'solteiro';
    exPlayer.relacionamento.parceiro = null;
    exPlayer.relacionamento.parceiroNome = null;
    exPlayer.relacionamento.inicioNamoro = 0;
    exPlayer.relacionamento.inicioCasamento = 0;
    exPlayer.relacionamento.anel = null;

    await player.save();
    await exPlayer.save();

    let resposta = [
        `💔 *FIM DO RELACIONAMENTO NO OLIMPO!* 🌧️`,
        ``,
        `👤 Solicitante: *@${senderNumber}*`,
        `👤 Ex-Parceiro(a): *@${exNumber}*`,
        `📜 Vínculo Encerrado: *${eraCasamento ? 'Casamento Matrimonial' : 'Namoro'}*`,
        `💔 Ambos agora retornaram ao estado civil de *Solteiro(a)*.`
    ];

    if (pensaoOuro > 0) {
        resposta.push(``);
        resposta.push(`⚖️ *Partilha de Bens do Divórcio:* *@${senderNumber}* pagou *${formatOuro(pensaoOuro)}* (20% da carteira) de pensão/indenização a *@${exNumber}*!`);
    }

    resposta.push(``);
    resposta.push(`🕊️ _A fila anda no Olimpo!_`);

    await conn.sendMessage(from, {
        text: resposta.join('\n'),
        mentions: [sender, exJid]
    }, { quoted: msg });
}

module.exports = {
    run,
    aliases
};
