// creditos Olympio
const { getOrCriaPlayer, verificarModoRpg } = require('../../funções/rpg/rpgHelper');

const aliases = ['classes', 'classe', 'vocacao', 'habilidades'];

const CLASSES = {
    guerreiro: {
        nome: 'Guerreiro de Ferro',
        icone: '🛡️',
        descricao: 'Mestre no combate corpo a corpo. Recebe bônus maciço de Vida e Defesa.',
        bonus: { hpMax: 40, defesa: 20 },
        habilidade: 'Golpe do Trovão (Dano massivo que atordoa monstros)'
    },
    mago: {
        nome: 'Mago dos Arcanos',
        icone: '🔮',
        descricao: 'Manipulador dos elementos. Recebe bônus gigantesco de Mana e Ataque mágico.',
        bonus: { mpMax: 60, ataque: 30 },
        habilidade: 'Meteoro Cósmico (Feitiço destruidor que ignora armaduras)'
    },
    arqueiro: {
        nome: 'Arqueiro Rastreador',
        icone: '🏹',
        descricao: 'Atirador de elite. Alta chance de acerto crítico e esquiva em combate.',
        bonus: { ataque: 25, defesa: 10 },
        habilidade: 'Chuva de Flechas Perfurantes (Ataque quádruplo rápido)'
    },
    assassino: {
        nome: 'Assassino das Sombras',
        icone: '🗡️',
        descricao: 'Letal e silencioso. Bônus em furtividade, agilidade e furtos de moedas.',
        bonus: { ataque: 35, defesa: 5 },
        habilidade: 'Ataque Furtivo Fatal (Chance de matar feras de primeira)'
    },
    paladino: {
        nome: 'Paladino da Luz Sagrada',
        icone: '⚜️',
        descricao: 'Cavaleiro sagrado dos Deuses. Concede cura passiva e resistência a maldições.',
        bonus: { hpMax: 30, defesa: 15, mpMax: 20 },
        habilidade: 'Bênção Purificadora (Regenera 60 HP instantaneamente)'
    },
    necromante: {
        nome: 'Necromante das Trevas',
        icone: '💀',
        descricao: 'Senhor dos mortos. Drena a força vital de monstros e converte em poder.',
        bonus: { ataque: 25, mpMax: 45 },
        habilidade: 'Dreno de Almas (Rouba vida dos inimigos para se curar)'
    }
};

async function run(conn, msg, config, args, sender, senderName) {
    const from = msg.key.remoteJid;
    const prefix = config.prefix || '!';

    if (!(await verificarModoRpg(conn, from, msg, prefix))) return;

    const senderNumber = sender.replace(/[^0-9]/g, '');
    const player = await getOrCriaPlayer(senderNumber, senderName);

    const subcomando = args[0]?.toLowerCase();

    if (subcomando === 'escolher' || subcomando === 'mudar' || subcomando === 'entrar') {
        const classeId = args[1]?.toLowerCase();
        if (!classeId || !CLASSES[classeId]) {
            return await conn.sendMessage(from, {
                text: `❌ Classe inválida!\n\nUse: *${prefix}classes escolher <nome>*\nExemplo: *${prefix}classes escolher guerreiro*\nExemplo: *${prefix}classes escolher mago*`
            }, { quoted: msg });
        }

        const classeData = CLASSES[classeId];

        player.classe = classeData.nome;
        if (classeData.bonus.hpMax) { player.hpMax += classeData.bonus.hpMax; player.hp = player.hpMax; }
        if (classeData.bonus.mpMax) { player.mpMax += classeData.bonus.mpMax; player.mp = player.mpMax; }
        if (classeData.bonus.ataque) player.ataque += classeData.bonus.ataque;
        if (classeData.bonus.defesa) player.defesa += classeData.bonus.defesa;

        await player.save();

        let resposta = [
            `✨ *VOCÊ DESPERTOU SUA VERDADEIRA VOCAÇÃO!* ✨`,
            ``,
            `👤 Aventureiro: *@${senderNumber}*`,
            `🎖️ Nova Classe: *${classeData.icone} ${classeData.nome}*`,
            `📜 Habilidade Única: *${classeData.habilidade}*`,
            ``,
            `💡 _Seus atributos foram aprimorados com os bônus da classe! Confira em *${prefix}perfilrpg*!_`
        ].join('\n');

        return await conn.sendMessage(from, { text: resposta, mentions: [sender] }, { quoted: msg });
    }

    let texto = `╭─〔 🧙‍♂️ *SALÃO DAS CLASSES & VOCAÇÕES* 〕\n`;
    texto += `│ Sua classe atual: *${player.classe || 'Aventureiro Sem Rumo'}*\n`;

    Object.keys(CLASSES).forEach(id => {
        const c = CLASSES[id];
        texto += `│ ${c.icone} *${c.nome.toUpperCase()}* [ID: \`${id}\`]\n`;
        texto += `│   📜 _${c.descricao}_\n`;
        texto += `│   ⚡ Especial: *${c.habilidade}*\n`;
    });

    texto += `╰────────────────────────\n`;
    texto += `💡 Como escolher sua vocação:\n👉 *${prefix}classes escolher <id>*\nExemplo: *${prefix}classes escolher guerreiro*\nExemplo: *${prefix}classes escolher assassino*`;

    await conn.sendMessage(from, { text: texto }, { quoted: msg });
}

module.exports = {
    run,
    aliases
};
