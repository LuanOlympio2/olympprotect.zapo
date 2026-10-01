// creditos Olympio
const { getOrCriaPlayer, verificarModoRpg, formatOuro } = require('../../funções/rpg/rpgHelper');
const { EMPREGOS, LOCAIS_EXPLORACAO, FORJA } = require('../../funções/rpg/dadosRpg');

const aliases = ['perfilrpg', 'statusrpg', 'status', 'ficha'];

async function run(conn, msg, config, args, sender, senderName) {
    const from = msg.key.remoteJid;
    const prefix = config.prefix || '!';

    if (!(await verificarModoRpg(conn, from, msg, prefix))) return;

    const senderNumber = sender.replace(/[^0-9]/g, '');
    const player = await getOrCriaPlayer(senderNumber, senderName);

    player.regenerarEstamina();

    const empregoData = EMPREGOS[player.emprego] || EMPREGOS.desempregado;
    const localData = LOCAIS_EXPLORACAO.find(l => l.id === player.localizacao) || LOCAIS_EXPLORACAO[0];
    const { PETS } = require('../../funções/rpg/dadosRpg');
    const petAtivoData = player.petAtivo ? PETS[player.petAtivo] : null;

    let karmaTitulo = '⚖️ Neutro';
    if (player.karma >= 100) karmaTitulo = '👑 Santo / Salvador Lendário';
    else if (player.karma >= 40) karmaTitulo = '🛡️ Nobre Cavaleiro';
    else if (player.karma >= 15) karmaTitulo = '✨ Cidadão Honrado';
    else if (player.karma <= -100) karmaTitulo = '☠️ Senhor das Trevas / Inimigo Público';
    else if (player.karma <= -40) karmaTitulo = '🗡️ Bandido Procurado';
    else if (player.karma <= -15) karmaTitulo = '🦹 Ladrãozo Velhaco';

    const xpNecessario = player.nivel * 100;
    const barraTamanho = 10;
    const xpPreenchido = Math.min(barraTamanho, Math.floor((player.xp / xpNecessario) * barraTamanho));
    const barraXP = '▰'.repeat(xpPreenchido) + '▱'.repeat(barraTamanho - xpPreenchido);

    const picaretaInfo = FORJA.picaretas[player.equipamentos?.picareta]?.nome || 'Picareta Rústica de Madeira';
    const armaInfo = player.equipamentos?.arma ? FORJA.espadas[player.equipamentos.arma]?.nome : 'Nenhuma (Mãos vazias)';
    const armaduraInfo = player.equipamentos?.armadura ? FORJA.armaduras[player.equipamentos.armadura]?.nome : 'Roupas Comuns';
    const escudoInfo = player.equipamentos?.escudo ? FORJA.escudos[player.equipamentos.escudo]?.nome : 'Nenhum';

    const petTexto = petAtivoData ? `${petAtivoData.icone} ${petAtivoData.nome}` : 'Nenhum (Adote em !pet loja)';

    const texto = [
        `╭─〔 ⚜️ *PERFIL DO AVENTUREIRO* 〕`,
        `│ • *Nome:* ${player.nome}`,
        `│ • *Nível:* ${player.nivel} (XP: ${player.xp}/${xpNecessario}) [${barraXP}]`,
        `│ • *Pontos Livres:* *${player.pontosAtributo || 0}* • *Ouro:* ${formatOuro(player.ouro)}`,
        `│ • *HP:* ${player.hp}/${player.hpMax} • *MP:* ${player.mp}/${player.mpMax} • *Estamina:* ${player.estamina}/${player.estaminaMax}`,
        `│ • *Ataque:* ${player.ataque} • *Defesa:* ${player.defesa}`,
        `│ • *Karma:* ${karmaTitulo} (${player.karma})`,
        `│ • *Pet:* ${petTexto}`,
        `│ • *Emprego:* ${empregoData.nome} • *Local:* ${localData.nome}`,
        `│ • *Clã:* ${player.clanId ? player.clanId : 'Nenhum'}`,
        `│ • *Estado Civil:* ${player.relacionamento?.status === 'casado' ? `Casado(a) com @${player.relacionamento.parceiro?.replace(/[^0-9]/g, '')}` : (player.relacionamento?.status === 'namorando' ? `Namorando com @${player.relacionamento.parceiro?.replace(/[^0-9]/g, '')}` : 'Solteiro(a)')}`,
        `│ • *Filhos:* ${player.relacionamento?.filhos?.length || 0}/3 • *Troféus:* ${player.conquistas?.length || 0}`,
        `├─〔 *Equipamentos* 〕`,
        `│ • Picareta: ${picaretaInfo}`,
        `│ • Arma: ${armaInfo}`,
        `│ • Armadura: ${armaduraInfo}`,
        `│ • Escudo: ${escudoInfo}`,
        `╰────────────────────────`,
        `\n💡 _Use *${prefix}upar* para distribuir pontos e *${prefix}conquistas* para ver seus troféus!_`
    ].join('\n');

    let mentions = [sender];
    if (player.relacionamento?.parceiro) mentions.push(player.relacionamento.parceiro);

    await conn.sendMessage(from, { text: texto, mentions }, { quoted: msg });
}

module.exports = {
    run,
    aliases
};
