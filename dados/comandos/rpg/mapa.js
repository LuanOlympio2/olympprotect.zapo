// creditos Olympio
const { verificarModoRpg, formatOuro } = require('../../funções/rpg/rpgHelper');
const { LOCAIS_EXPLORACAO } = require('../../funções/rpg/dadosRpg');

const aliases = ['mapa', 'reinos', 'locais', 'viagens'];

async function run(conn, msg, config, args, sender, senderName) {
    const from = msg.key.remoteJid;
    const prefix = config.prefix || '!';

    if (!(await verificarModoRpg(conn, from, msg, prefix))) return;

    let texto = `╭─〔 🗺️ *MAPA MUNDI & REINOS DO OLIMPO* 〕\n`;
    texto += `│ _Mais de 15 regiões para explorar com perigos e tesouros!_\n`;

    LOCAIS_EXPLORACAO.forEach((local, index) => {
        const perigoPorcentagem = Math.round(local.riscoMorte * 100);
        texto += `│ ${index + 1}. ${local.icone} *${local.nome.toUpperCase()}* [ID: \`${local.id}\`]\n`;
        texto += `│   🎖️ Nível Mínimo: ${local.nivelRecomendado} | 💰 Custo Viagem: ${formatOuro(local.custoViagem)}\n`;
        texto += `│   ⚠️ Risco de Dano: ${perigoPorcentagem}%\n`;
        texto += `│   📜 _${local.descricao}_\n`;
    });

    texto += `╰────────────────────────\n`;
    texto += `💡 Como viajar para uma região:\n👉 *${prefix}viajar <id_do_local>*\nExemplo: *${prefix}viajar floresta_sombria*\nExemplo: *${prefix}viajar minas_abandonadas*\n\n💡 Para explorar o local onde você está:\n👉 *${prefix}explorar*`;

    await conn.sendMessage(from, { text: texto }, { quoted: msg });
}

module.exports = {
    run,
    aliases
};
