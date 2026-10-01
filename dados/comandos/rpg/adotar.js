// creditos Olympio
const { getOrCriaPlayer, verificarModoRpg, formatOuro } = require('../../funções/rpg/rpgHelper');
const { ITENS_ORFANATO } = require('../../funções/rpg/dadosRpg');

const aliases = ['adotar', 'orfanato', 'filho', 'filhos'];

async function run(conn, msg, config, args, sender, senderName) {
    const from = msg.key.remoteJid;
    const prefix = config.prefix || '!';

    if (!(await verificarModoRpg(conn, from, msg, prefix))) return;

    const senderNumber = sender.replace(/[^0-9]/g, '');
    const player = await getOrCriaPlayer(senderNumber, senderName);

    const tipoId = args[0]?.toLowerCase();

    if (!tipoId || !ITENS_ORFANATO[tipoId]) {
        let texto = [
            `╭─〔 🏠 *ORFANATO SAGRADO DE HÉSTIA* 〕`,
            `│ _Dê amor e um lar acolhedor para as crianças do Olimpo!_`,
            `│ _Filhos adotados trazem bênçãos e moedas diárias de gratidão._`,
            `│ 👶 *CRIANÇAS PARA ADOÇÃO:*`
        ];

        Object.keys(ITENS_ORFANATO).forEach(id => {
            const o = ITENS_ORFANATO[id];
            texto.push(`│ ${o.icone} *${o.nome}* [ID: \`${id}\`]`);
            texto.push(`│   💰 Doação para o Orfanato: ${formatOuro(o.custo)}`);
            texto.push(`│   🪙 Renda Diária Gerada: *+${formatOuro(o.ouroDiario)}/dia*`);
            texto.push(`│   📝 _${o.desc}_`);
            texto.push(`│`);
        });

        texto.push(`╰────────────────────────`);
        texto.push(``);

        const filhosAtuais = player.relacionamento?.filhos || [];
        if (filhosAtuais.length > 0) {
            texto.push(`👨‍👩‍👧 *SEUS FILHOS ATUAIS (${filhosAtuais.length}/3):*`);
            filhosAtuais.forEach((f, idx) => {
                texto.push(`• ${idx + 1}. ${f.icone} *${f.nome}* (${f.tipo}) - Adotado em ${new Date(f.adotadoEm).toLocaleDateString('pt-BR')}`);
            });
            texto.push(``);
        }

        texto.push(`👉 Para adotar: *${prefix}adotar <id> [Nome da Criança]*`);
        texto.push(`Exemplo: *${prefix}adotar menino Pedro*`);

        return await conn.sendMessage(from, { text: texto.join('\n') }, { quoted: msg });
    }

    if (!player.relacionamento.filhos) player.relacionamento.filhos = [];

    if (player.relacionamento.filhos.length >= 3) {
        return await conn.sendMessage(from, {
            text: `❌ Sua família já atingiu o limite máximo de *3 filhos adotados*! Dê muito amor e carinho a eles.`
        }, { quoted: msg });
    }

    const orfInfo = ITENS_ORFANATO[tipoId];

    if (player.ouro < orfInfo.custo) {
        return await conn.sendMessage(from, {
            text: `❌ Ouro insuficiente para a taxa de adoção e enxoval!\nVocê precisa de *${formatOuro(orfInfo.custo)}*, mas possui *${formatOuro(player.ouro)}*.`
        }, { quoted: msg });
    }

    const nomePersonalizado = args.slice(1).join(' ').trim() || orfInfo.nome;

    player.ouro -= orfInfo.custo;
    const novoFilho = {
        tipo: tipoId,
        nome: nomePersonalizado,
        icone: orfInfo.icone,
        ouroDiario: orfInfo.ouroDiario,
        adotadoEm: Date.now()
    };

    player.relacionamento.filhos.push(novoFilho);

    if (player.relacionamento.parceiro) {
        const parceiroNumber = player.relacionamento.parceiro.replace(/[^0-9]/g, '');
        const parceiroPlayer = await getOrCriaPlayer(parceiroNumber, 'Parceiro');
        if (!parceiroPlayer.relacionamento.filhos) parceiroPlayer.relacionamento.filhos = [];
        if (parceiroPlayer.relacionamento.filhos.length < 3) {
            parceiroPlayer.relacionamento.filhos.push(novoFilho);
            await parceiroPlayer.save();
        }
    }

    await player.save();

    await conn.sendMessage(from, {
        text: `🎉🏠 *PARABÉNS PELA ADOÇÃO! O LAR ESTÁ EM FESTA!* 🍼✨\n\n👤 Guardião: *@${senderNumber}*\n👶 Criança Adotada: *${orfInfo.icone} ${nomePersonalizado}*\n🪙 Doação ao Orfanato: *${formatOuro(orfInfo.custo)}*\n💰 Renda Diária: *+${formatOuro(orfInfo.ouroDiario)}* todo dia no comando diário!\n\n_Que essa criança traga infinita alegria ao seu lar no Olimpo!_ 💖`,
        mentions: [sender]
    }, { quoted: msg });
}

module.exports = {
    run,
    aliases
};
