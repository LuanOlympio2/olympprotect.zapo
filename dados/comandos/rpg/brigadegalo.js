// creditos Olympio
const { getOrCriaPlayer, verificarModoRpg, formatOuro } = require('../../funções/rpg/rpgHelper');

const aliases = ['brigadegalo', 'galo', 'rinha'];

const GOLPES_GALO = [
    'desferiu uma voadora com espora afiada no peito!',
    'acertou uma sequência de bicadas ferozes na crista!',
    'saltou alto desviando do golpe e contra-atacou com as asas!',
    'aplicou um rasante devastador levantando poeira no chão da arena!',
    'desferiu uma bicada certeira no bico do adversário!'
];

async function run(conn, msg, config, args, sender, senderName) {
    const from = msg.key.remoteJid;
    const prefix = config.prefix || '!';

    if (!(await verificarModoRpg(conn, from, msg, prefix))) return;

    const senderNumber = sender.replace(/[^0-9]/g, '');
    const player = await getOrCriaPlayer(senderNumber, senderName);

    const escolha = args[0]?.toLowerCase();
    const aposta = parseInt(args[1], 10);

    const opcoes = {
        vermelho: 'vermelho',
        red: 'vermelho',
        indio: 'vermelho',
        preto: 'preto',
        black: 'preto',
        carijo: 'preto'
    };

    if (!escolha || !opcoes[escolha] || !aposta || aposta <= 0) {
        return await conn.sendMessage(from, {
            text: `🐓 *ARENA DE COMBATE DE GALOS DA TAVERNA* 🐓\n\nEscolha seu campeão e faça sua aposta:\n\n🔴 *Galo Índio Vermelho* [ID: \`vermelho\`]\n🔵 *Galo Carijó Preto* [ID: \`preto\`]\n\n👉 *${prefix}brigadegalo <vermelho|preto> <valor>*\nExemplo: *${prefix}brigadegalo vermelho 200*\nExemplo: *${prefix}brigadegalo preto 500*`
        }, { quoted: msg });
    }

    if (player.ouro < aposta) {
        return await conn.sendMessage(from, {
            text: `❌ Ouro insuficiente!\n\nVocê apostou *${formatOuro(aposta)}*, mas possui apenas *${formatOuro(player.ouro)}*.`
        }, { quoted: msg });
    }

    const galoEscolhido = opcoes[escolha];
    const vencedor = Math.random() < 0.5 ? 'vermelho' : 'preto';
    const golpeSorteado = GOLPES_GALO[Math.floor(Math.random() * GOLPES_GALO.length)];

    const nomeVencedor = vencedor === 'vermelho' ? '🔴 Galo Índio Vermelho' : '🔵 Galo Carijó Preto';
    const ganhou = galoEscolhido === vencedor;

    const critico = Math.random() < 0.20;

    let resultadoFinal = '';
    if (ganhou) {
        const multiplicador = critico ? 2.5 : 2.0;
        const totalRecebido = Math.floor(aposta * multiplicador);
        const lucro = totalRecebido - aposta;

        player.ouro += lucro;
        resultadoFinal = critico
            ? `🔥 *VITÓRIA BRUTAL DO SEU CAMPEÃO!* 🔥\nSeu galo deu um nocaute espetacular! Pagamento de *${multiplicador}x* (+${formatOuro(totalRecebido)})!`
            : `🎉 *SEU GALO VENCEU A LUTA!* 🎉\nA torcida da taverna vai à loucura! Você faturou *+${formatOuro(totalRecebido)}*!`;
    } else {
        player.ouro -= aposta;
        resultadoFinal = `💀 *SEU GALO FOI DERRUBADO!* 💀\nO oponente venceu por nocaute e você perdeu *-${formatOuro(aposta)}*.`;
    }

    await player.save();

    let resposta = [
        `🐓💥 *CLÁSSICO DA RINHA NA TAVERNA MEDIEVAL* 💥🐓`,
        ``,
        `🔴 *Galo Índio Vermelho* ⚔️ 🔵 *Galo Carijó Preto*`,
        ``,
        `🗣️ *O Juiz deu o sinal e a poeira subiu!*`,
        `🥊 _O ${nomeVencedor} ${golpeSorteado}_`,
        ``,
        `🏆 *VENCEDOR:* ${nomeVencedor}!`,
        ``,
        resultadoFinal,
        `🪙 Saldo Atual: *${formatOuro(player.ouro)}*`
    ].join('\n');

    await conn.sendMessage(from, { text: resposta, mentions: [sender] }, { quoted: msg });
}

module.exports = {
    run,
    aliases
};
