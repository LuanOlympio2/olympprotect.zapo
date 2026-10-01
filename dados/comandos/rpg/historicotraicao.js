// creditos Olympio
const { getOrCriaPlayer, verificarModoRpg } = require('../../funções/rpg/rpgHelper');

const aliases = ['historicotraicao', 'historico', 'chifre', 'chifres', 'traicoes', 'infidelidade'];

async function run(conn, msg, config, args, sender, senderName) {
    const from = msg.key.remoteJid;
    const prefix = config.prefix || '!';

    if (!(await verificarModoRpg(conn, from, msg, prefix))) return;

    let target = sender;
    if (msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length > 0) {
        target = msg.message.extendedTextMessage.contextInfo.mentionedJid[0];
    } else if (msg.message?.extendedTextMessage?.contextInfo?.participant) {
        target = msg.message.extendedTextMessage.contextInfo.participant;
    }

    const targetNumber = target.replace(/[^0-9]/g, '');
    const player = await getOrCriaPlayer(targetNumber, senderName);

    const rel = player.relacionamento || {};
    const status = rel.status || 'solteiro';
    const parceiroNum = rel.parceiro ? rel.parceiro.replace(/[^0-9]/g, '') : null;
    const cometidas = rel.traicoesCometidas || 0;
    const sofridas = rel.traicoesSofridas || 0;
    const lista = rel.historicoTraicoes || [];

    let statusTexto = '💔 Solteiro(a)';
    if (status === 'namorando') statusTexto = `❤️ Namorando com @${parceiroNum}`;
    if (status === 'casado') statusTexto = `💍 Casado(a) com @${parceiroNum}`;

    let texto = [
        `╭─〔 📜 *DOSSIÊ DE FIDELIDADE & TRAIÇÕES* 〕`,
        `│ 👤 *Investigado(a):* @${targetNumber}`,
        `│ • *Estado Civil:* ${statusTexto}`,
        `│ 🗡️ *Traições Cometidas:* ${cometidas}`,
        `│ 🐂 *Chifres Recebidos:* ${sofridas}`,];

    if (lista.length === 0) {
        texto.push(`│ ✨ *Ficha Impecável:* Nenhuma traição registrada até o momento!`);
    } else {
        texto.push(`│ 📂 *HISTÓRICO COMPLETO:*`);
        const recentes = lista.slice(-8).reverse();
        recentes.forEach((r, idx) => {
            const dataStr = new Date(r.data).toLocaleDateString('pt-BR', { hour: '2-digit', minute: '2-digit' });
            if (r.tipo === 'flagra') {
                texto.push(`│ ${idx + 1}. 🚨 *FLAGRA PÚBLICO!* [${dataStr}]`);
                texto.push(`│    Traiu ${r.parceiroNaEpoca} com ${r.amante}`);
            } else if (r.tipo === 'sigilo') {
                texto.push(`│ ${idx + 1}. 🤫 *Escapada no Sigilo* [${dataStr}]`);
                texto.push(`│    Encontro clandestino com ${r.amante}`);
            } else if (r.tipo === 'chifre_recebido') {
                texto.push(`│ ${idx + 1}. 🐂 *Chifre Recebido* [${dataStr}]`);
                texto.push(`│    Foi traído(a) por ${r.traidor} com ${r.amante}`);
            }
        });
    }

    texto.push(`│`);
    texto.push(`╰────────────────────────`);
    texto.push(``);
    texto.push(`💡 *COMANDOS DE RELACIONAMENTO:*`);
    texto.push(`• *${prefix}namorar @alguem* - Iniciar namoro`);
    texto.push(`• *${prefix}casar @parceiro* - Matrimônio (após 2h de namoro!)`);
    texto.push(`• *${prefix}trair @amante* - Arriscar uma aventura secreta`);
    texto.push(`• *${prefix}divorcio* - Terminar a união`);

    let mentions = [target];
    if (rel.parceiro) mentions.push(rel.parceiro);

    await conn.sendMessage(from, {
        text: texto.join('\n'),
        mentions
    }, { quoted: msg });
}

module.exports = {
    run,
    aliases
};
