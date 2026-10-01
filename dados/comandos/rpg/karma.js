// creditos Olympio
const { getOrCriaPlayer, verificarModoRpg } = require('../../funções/rpg/rpgHelper');

const aliases = ['karma', 'reputacao', 'moral'];

async function run(conn, msg, config, args, sender, senderName) {
    const from = msg.key.remoteJid;
    const prefix = config.prefix || '!';

    if (!(await verificarModoRpg(conn, from, msg, prefix))) return;

    const senderNumber = sender.replace(/[^0-9]/g, '');
    const player = await getOrCriaPlayer(senderNumber, senderName);

    const karma = player.karma || 0;

    let alinhamento = '';
    let descricao = '';
    let bonus = '';

    if (karma >= 50) {
        alinhamento = '🌟 SANTO DIVINO DO OLIMPO';
        descricao = 'Sua honra e bondade ecoam por todo o mundo grego. Os deuses sorriem para você.';
        bonus = '• Desconto passivo em lojas imperiais\n• Bênção de sorte em explorações';
    } else if (karma >= 15) {
        alinhamento = '🛡️ CAVALEIRO HONORÁVEL';
        descricao = 'Cidadão de alta moral e respeito pelas leis do Olimpo.';
        bonus = '• Cidadão de confiança nos templos e guildas';
    } else if (karma >= -15) {
        alinhamento = '⚖️ ALMA NEUTRA';
        descricao = 'Você caminha na linha tênue entre a lei e o interesse próprio.';
        bonus = '• Sem bônus ou penalidades ativas';
    } else if (karma >= -49) {
        alinhamento = '🗡️ FORA DA LEI PROCURADO';
        descricao = 'Seus crimes chamam a atenção da guarda e de caçadores de recompensa.';
        bonus = '• Fiança 20% mais cara em caso de prisão';
    } else {
        alinhamento = '☠️ SENHOR DO CRIME / INIMIGO PÚBLICO';
        descricao = 'Um dos criminosos mais temidos e procurados em todo o continente.';
        bonus = '• Cartazes de procurado espalhados\n• Fiança dobrada';
    }

    let texto = [
        `╭─〔 ⚖️ *STATUS DE KARMA & REPUTAÇÃO* 〕`,
        `│ 👤 *Aventureiro:* ${player.nome}`,
        `│ 🔮 *Pontuação Moral:* *${karma > 0 ? '+' : ''}${karma} Pontos*`,
        `│ 🏛️ *Título:* ${alinhamento}`,
        `│ 📜 *Reputação:*`,
        `│ _${descricao}_`,
        `│ ✨ *Efeitos Ativos:*`,
        `│ ${bonus}`,
        `╰────────────────────────`,
        ``,
        `💡 *COMO ALTERAR SEU KARMA:*`,
        `• *Diminuir:* Cometa crimes (*${prefix}crime*) ou roube amigos (*${prefix}roubar*).`,
        `• *Aumentar:* Doe moedas no Templo de Atena (*${prefix}redencao <ouro>*) ou ajude a comunidade.`
    ].join('\n');

    await conn.sendMessage(from, { text: texto }, { quoted: msg });
}

module.exports = {
    run,
    aliases
};
