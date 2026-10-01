// creditos Olympio
const { getOrCriaPlayer, verificarModoRpg, formatTempoRestante, formatOuro } = require('../../funções/rpg/rpgHelper');
const { normalizeId, resolveToPhoneJid } = require('../../funções/normalizarid');
const groupMetadataManager = require('../../funções/groupMetadataManager');

const aliases = ['parceiro', 'relacionamento', 'conjuge'];

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

    let target = sender;
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

    const targetPhoneJid = resolveToPhoneJid(target, participants);
    const targetNumber = normalizeId(targetPhoneJid) || target.replace(/[^0-9]/g, '');
    const player = await getOrCriaPlayer(targetNumber, senderName);

    const rel = player.relacionamento || {};
    const status = rel.status || 'solteiro';

    if (status === 'solteiro' || !rel.parceiro) {
        return await conn.sendMessage(from, {
            text: `💔 *@${targetNumber}* está atualmente *Solteiro(a)*!\n\n💡 Use *${prefix}namorar @pessoa* para pedir alguém em namoro!`,
            mentions: [target]
        }, { quoted: msg });
    }

    const parceiroNum = rel.parceiro.replace(/[^0-9]/g, '');
    const agora = Date.now();

    let tempoJuntosStr = '';
    if (status === 'casado') {
        const tempoCasamento = agora - (rel.inicioCasamento || agora);
        tempoJuntosStr = `💍 Casados há: *${formatTempoRestante(tempoCasamento)}*`;
    } else {
        const tempoNamoro = agora - (rel.inicioNamoro || agora);
        const DUAS_HORAS = 2 * 60 * 60 * 1000;
        const podeCasar = tempoNamoro >= DUAS_HORAS;
        tempoJuntosStr = `❤️ Namorando há: *${formatTempoRestante(tempoNamoro)}*\n│ 💒 Matrimônio: ${podeCasar ? '✅ Já podem se casar!' : `⏳ Faltam *${formatTempoRestante(DUAS_HORAS - tempoNamoro)}*`}`;
    }

    let texto = [
        `╭─〔 💖 *REGISTRO MATRIMONIAL DO OLIMPO* 〕`,
        `│ 👤 *Membro:* @${targetNumber}`,
        `│ 💘 *Parceiro(a):* @${parceiroNum}`,
        `│ 📜 *Status Oficial:* *${status === 'casado' ? 'Casados' : 'Namorando'}*`,
        `│ ${tempoJuntosStr}`,
        `│ 💍 *Aliança:* ${rel.anel || 'Nenhuma (Aliança necessária para casar)'}`,];

    const filhos = rel.filhos || [];
    if (filhos.length > 0) {
        texto.push(`│ 👨‍👩‍👧 *Filhos Adotados (${filhos.length}/3):*`);
        filhos.forEach(f => {
            texto.push(`│ • ${f.icone} *${f.nome}* (+${formatOuro(f.ouroDiario)}/dia)`);
        });
        texto.push(`│`);
    }

    const traicoes = rel.traicoesCometidas || 0;
    const chifres = rel.traicoesSofridas || 0;
    texto.push(`│ ⚖️ *Fidelidade do Casal:*`);
    texto.push(`│ • Escapadas cometidas por @${targetNumber}: *${traicoes}*`);
    texto.push(`│ • Chifres levados por @${targetNumber}: *${chifres}*`);
    texto.push(`│`);
    texto.push(`╰────────────────────────`);
    texto.push(``);
    texto.push(`💡 *AÇÕES DISPONÍVEIS:*`);
    if (status === 'namorando') texto.push(`• *${prefix}casar @${parceiroNum}* - Casar após 2 horas de namoro`);
    texto.push(`• *${prefix}adotar* - Adotar crianças no orfanato`);
    texto.push(`• *${prefix}historicotraicao* - Ver dossiê de traições`);
    texto.push(`• *${prefix}divorcio* - Terminar a relação`);

    await conn.sendMessage(from, {
        text: texto.join('\n'),
        mentions: [target, rel.parceiro]
    }, { quoted: msg });
}

module.exports = {
    run,
    aliases
};
