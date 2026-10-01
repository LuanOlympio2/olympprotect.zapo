// creditos Olympio
const { verificarModoRpg, formatTempoRestante } = require('../../funções/rpg/rpgHelper');
const { getClimaAtual } = require('../../funções/rpg/climaSistema');

const aliases = ['clima', 'tempo', 'previsao'];

async function run(conn, msg, config, args, sender, senderName) {
    const from = msg.key.remoteJid;
    const prefix = config.prefix || '!';

    if (!(await verificarModoRpg(conn, from, msg, prefix))) return;

    const clima = getClimaAtual();
    const tempoRestante = formatTempoRestante(clima.tempoRestanteMs);

    let texto = [
        `╭─〔 🌍 *CONDIÇÕES CLIMÁTICAS DO MUNDO* 〕`,
        `│ ${clima.icone} *${clima.nome.toUpperCase()}*`,
        `│ 📜 _${clima.descricao}_`,
        `│ ⏳ Próxima mudança em: *${tempoRestante}*`,
        `│ ⚡ *EFEITOS ATIVOS NO RPG:*`
    ];

    Object.entries(clima.efeitos).forEach(([area, desc]) => {
        let iconeArea = '📌';
        if (area === 'fazenda') iconeArea = '🌾';
        if (area === 'pesca') iconeArea = '🎣';
        if (area === 'caca') iconeArea = '🏹';
        if (area === 'roubo') iconeArea = '🦹';
        if (area === 'exploracao') iconeArea = '🧭';
        if (area === 'trabalho') iconeArea = '💼';
        if (area === 'masmorra') iconeArea = '🏰';
        texto.push(`│ ${iconeArea} *${area.toUpperCase()}:* ${desc}`);
    });

    texto.push(`│`);
    texto.push(`╰────────────────────────`);
    texto.push(``);
    texto.push(`💡 _O clima influencia suas chances de pesca, rendimento agrícola, perigos da estrada e poder das feras!_`);

    await conn.sendMessage(from, { text: texto.join('\n') }, { quoted: msg });
}

module.exports = {
    run,
    aliases
};
