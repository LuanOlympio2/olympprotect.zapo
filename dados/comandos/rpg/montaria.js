// creditos Olympio
const { getOrCriaPlayer, verificarModoRpg, formatOuro } = require('../../funções/rpg/rpgHelper');

const aliases = ['montaria', 'montarias', 'estabulos', 'carruagem'];

const MONTARIAS = {
    cavalo_guerra: {
        id: 'cavalo_guerra',
        nome: 'Cavalo de Guerra Espartano',
        preco: 2000,
        icone: '🐎',
        descricao: 'Corcel vigoroso treinado para marcha forçada. Reduz em 50% o tempo de recarga de viagens.'
    },
    carruagem: {
        id: 'carruagem',
        nome: 'Carruagem Blindada Real',
        preco: 5000,
        icone: '🛒',
        descricao: 'Carruagem reforçada de ferro. Protege o ouro em viagens contra salteadores da estrada.'
    },
    grifo: {
        id: 'grifo',
        nome: 'Grifo Alado Dourado',
        preco: 12000,
        icone: '🦅',
        descricao: 'Majestosa fera voadora. Reduz o custo de estamina de viagens para apenas 5 pontos.'
    },
    dragao_montaria: {
        id: 'dragao_montaria',
        nome: 'Dragão Carmesim dos Céus',
        preco: 28000,
        icone: '🐉',
        descricao: 'O ápice da soberania nos céus. Concede +80 de Ataque bônus e viagens aéreas com 0 estamina!'
    }
};

async function run(conn, msg, config, args, sender, senderName) {
    const from = msg.key.remoteJid;
    const prefix = config.prefix || '!';

    if (!(await verificarModoRpg(conn, from, msg, prefix))) return;

    const senderNumber = sender.replace(/[^0-9]/g, '');
    const player = await getOrCriaPlayer(senderNumber, senderName);

    const subcomando = args[0]?.toLowerCase();

    if (subcomando === 'loja' || subcomando === 'estabulos' || subcomando === 'lista') {
        let texto = `╭─〔 🐴 *ESTÁBULOS IMPERIAIS DO OLIMPO* 〕\n`;
        texto += `│ _Compre montarias épicas para acelerar suas viagens_\n│ _e ganhar vantagens exclusivas pelas terras do reino!_\n`;

        Object.keys(MONTARIAS).forEach(id => {
            const m = MONTARIAS[id];
            texto += `│ ${m.icone} *${m.nome.toUpperCase()}* [ID: \`${m.id}\`]\n`;
            texto += `│   💰 Preço: ${formatOuro(m.preco)}\n`;
            texto += `│   📜 _${m.descricao}_\n`;
        });

        texto += `╰────────────────────────\n`;
        texto += `👉 Compre com: *${prefix}montaria comprar <id>*\nExemplo: *${prefix}montaria comprar cavalo_guerra*`;

        return await conn.sendMessage(from, { text: texto }, { quoted: msg });
    }

    if (subcomando === 'comprar' || subcomando === 'adotar') {
        const montariaId = args[1]?.toLowerCase();
        if (!montariaId || !MONTARIAS[montariaId]) {
            return await conn.sendMessage(from, {
                text: `❌ Montaria não encontrada!\nDigite *${prefix}montaria loja* para ver o catálogo dos estábulos.`
            }, { quoted: msg });
        }

        const mInfo = MONTARIAS[montariaId];

        if (player.montaria === montariaId) {
            return await conn.sendMessage(from, { text: `❌ Você já possui a montaria *${mInfo.icone} ${mInfo.nome}* equipada!` }, { quoted: msg });
        }

        if (player.ouro < mInfo.preco) {
            return await conn.sendMessage(from, {
                text: `❌ Ouro insuficiente!\nVocê precisa de *${formatOuro(mInfo.preco)}*, mas tem *${formatOuro(player.ouro)}*.`
            }, { quoted: msg });
        }

        player.ouro -= mInfo.preco;
        player.montaria = montariaId;

        await player.save();

        return await conn.sendMessage(from, {
            text: `🎉 *MONTARIA ADQUIRIDA COM SUCESSO!* 🏇\n\n👤 Cavaleiro: *@${senderNumber}*\n🐴 Montaria Ativa: *${mInfo.icone} ${mInfo.nome}*\n✨ Bônus Ativo: ${mInfo.descricao}\n💰 Saldo restante: ${formatOuro(player.ouro)}`,
            mentions: [sender]
        }, { quoted: msg });
    }

    const montariaAtiva = player.montaria ? MONTARIAS[player.montaria] : null;

    let texto = [
        `╭─〔 🏇 *SEUS ESTÁBULOS PESSOAIS* 〕`,
        `│ 👤 *Cavaleiro:* ${player.nome}`,
        `│ 🐴 *Montaria Equipada:* ${montariaAtiva ? `${montariaAtiva.icone} *${montariaAtiva.nome}*` : '_Nenhuma montaria (a pé)_'}`
    ];

    if (montariaAtiva) {
        texto.push(`│ 📜 *Vantagem:* ${montariaAtiva.descricao}`);
    }

    texto.push(`│`);
    texto.push(`╰────────────────────────`);
    texto.push(``);
    texto.push(`💡 *AÇÕES:*`);
    texto.push(`• *${prefix}montaria loja* - Visitar os estábulos para comprar montarias`);
    texto.push(`• *${prefix}montaria comprar <id>* - Adquirir uma nova montaria`);

    await conn.sendMessage(from, { text: texto.join('\n') }, { quoted: msg });
}

module.exports = {
    run,
    aliases
};
