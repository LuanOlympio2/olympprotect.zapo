// creditos Olympio
const { getOrCriaPlayer, verificarModoRpg } = require('../../funções/rpg/rpgHelper');

const aliases = ['upar', 'pontos', 'atributos', 'distribuir'];

async function run(conn, msg, config, args, sender, senderName) {
    const from = msg.key.remoteJid;
    const prefix = config.prefix || '!';

    if (!(await verificarModoRpg(conn, from, msg, prefix))) return;

    const senderNumber = sender.replace(/[^0-9]/g, '');
    const player = await getOrCriaPlayer(senderNumber, senderName);

    player.regenerarEstamina();

    const atributo = args[0]?.toLowerCase();
    const quantidade = Math.max(1, parseInt(args[1], 10) || 1);

    const mapeamento = {
        forca: 'ataque',
        ataque: 'ataque',
        atq: 'ataque',
        defesa: 'defesa',
        def: 'defesa',
        resistencia: 'defesa',
        vida: 'hp',
        hp: 'hp',
        mana: 'mp',
        mp: 'mp',
        estamina: 'estamina',
        energia: 'estamina',
        sta: 'estamina'
    };

    if (!atributo || !mapeamento[atributo]) {
        let texto = [
            `╭─〔 🎖️ *DISTRIBUIÇÃO DE ATRIBUTOS* 〕`,
            `│ • *Guerreiro:* ${player.nome}`,
            `│ • *Nível:* ${player.nivel} • *Pontos Livres:* *${player.pontosAtributo || 0}*`,
            `├─〔 *Estatísticas* 〕`,
            `│ • *Ataque:* ${player.ataque} • *Defesa:* ${player.defesa}`,
            `│ • *Vida Máx:* ${player.hpMax} • *Mana Máx:* ${player.mpMax}`,
            `│ • *Estamina Máx:* ${player.estaminaMax}`,
            `│ • *Karma:* ${player.karma}`,
            `╰────────────────────────`,
            ``,
            `💡 *COMO DISTRIBUIR SEUS PONTOS:*`,
            `• *${prefix}upar forca [qtd]* ➔ +3 de Ataque por ponto`,
            `• *${prefix}upar defesa [qtd]* ➔ +2 de Defesa por ponto`,
            `• *${prefix}upar vida [qtd]* ➔ +20 de HP Máx por ponto`,
            `• *${prefix}upar mana [qtd]* ➔ +15 de MP Máx por ponto`,
            `• *${prefix}upar estamina [qtd]* ➔ +10 de Estamina Máx por ponto`,
            ``,
            `_Exemplo: *${prefix}upar estamina 2*_`
        ].join('\n');

        return await conn.sendMessage(from, { text: texto }, { quoted: msg });
    }

    if ((player.pontosAtributo || 0) < quantidade) {
        return await conn.sendMessage(from, {
            text: `❌ Pontos de atributo insuficientes!\n\nVocê tem *${player.pontosAtributo || 0} pontos*, mas tentou distribuir *${quantidade}*.\nSuba de nível trabalhando ou explorando para ganhar mais pontos!`
        }, { quoted: msg });
    }

    const statAlvo = mapeamento[atributo];
    player.pontosAtributo -= quantidade;

    let alteracaoTexto = '';
    if (statAlvo === 'ataque') {
        const ganho = quantidade * 3;
        player.ataque += ganho;
        alteracaoTexto = `⚔️ Ataque aumentado em *+${ganho}*! (Novo: ${player.ataque})`;
    } else if (statAlvo === 'defesa') {
        const ganho = quantidade * 2;
        player.defesa += ganho;
        alteracaoTexto = `🛡️ Defesa aumentada em *+${ganho}*! (Novo: ${player.defesa})`;
    } else if (statAlvo === 'hp') {
        const ganho = quantidade * 20;
        player.hpMax += ganho;
        player.hp += ganho;
        alteracaoTexto = `❤️ Vida Máxima aumentada em *+${ganho}*! (Novo: ${player.hpMax})`;
    } else if (statAlvo === 'mp') {
        const ganho = quantidade * 15;
        player.mpMax += ganho;
        player.mp += ganho;
        alteracaoTexto = `🌀 Mana Máxima aumentada em *+${ganho}*! (Novo: ${player.mpMax})`;
    } else if (statAlvo === 'estamina') {
        const ganho = quantidade * 10;
        player.estaminaMax += ganho;
        player.estamina += ganho;
        alteracaoTexto = `⚡ Estamina Máxima aumentada em *+${ganho}*! (Novo: ${player.estaminaMax})`;
    }

    await player.save();

    await conn.sendMessage(from, {
        text: `✨ *PONTOS DISTRIBUÍDOS COM SUCESSO!* ✨\n\n👤 *@${senderNumber}*\n${alteracaoTexto}\n🌟 Pontos restantes: *${player.pontosAtributo}*`,
        mentions: [sender]
    }, { quoted: msg });
}

module.exports = {
    run,
    aliases
};
