// creditos Olympio
const { getOrCriaPlayer, verificarModoRpg, formatOuro } = require('../../funções/rpg/rpgHelper');
const { EMPREGOS } = require('../../funções/rpg/dadosRpg');

const aliases = ['empregos', 'emprego', 'profissao', 'profissoes'];

async function run(conn, msg, config, args, sender, senderName) {
    const from = msg.key.remoteJid;
    const prefix = config.prefix || '!';

    if (!(await verificarModoRpg(conn, from, msg, prefix))) return;

    const senderNumber = sender.replace(/[^0-9]/g, '');
    const player = await getOrCriaPlayer(senderNumber, senderName);

    const subcomando = args[0]?.toLowerCase();

    if (subcomando === 'escolher' || subcomando === 'entrar' || subcomando === 'mudar') {
        const escolha = args[1]?.toLowerCase();
        if (!escolha || !EMPREGOS[escolha] || escolha === 'desempregado') {
            return await conn.sendMessage(from, {
                text: `❌ Profissão inválida!\n\nUse: *${prefix}empregos escolher <nome>*\nExemplo: *${prefix}empregos escolher minerador*`
            }, { quoted: msg });
        }

        player.emprego = escolha;
        await player.save();

        const emp = EMPREGOS[escolha];
        return await conn.sendMessage(from, {
            text: `🎉 Parabéns, *@${senderNumber}*!\n\nAgora você é um(a) *${emp.icone} ${emp.nome}*!\n\n💰 *Salário Base:* ${formatOuro(emp.salarioBase)}\n📦 *Recurso extra:* ${emp.descricao}\n\nDigite *${prefix}trabalhar* para iniciar seu expediente!`,
            mentions: [sender]
        }, { quoted: msg });
    }

    let texto = `╭─〔 💼 *CENTRAL DE PROFISSÕES* 〕\n│ Seu emprego atual: *${(EMPREGOS[player.emprego] || EMPREGOS.desempregado).nome}*\n`;

    Object.keys(EMPREGOS).forEach(key => {
        if (key === 'desempregado') return;
        const e = EMPREGOS[key];
        texto += `│ ${e.icone} *${e.nome.toUpperCase()}* [ID: \`${key}\`]\n`;
        texto += `│ 💰 Salário: ${formatOuro(e.salarioBase)} por turno\n`;
        texto += `│ 📝 ${e.descricao}\n`;
    });

    texto += `╰────────────────────────\n`;
    texto += `💡 Para escolher uma profissão:\n👉 *${prefix}empregos escolher <id>*\nExemplo: *${prefix}empregos escolher minerador*`;

    await conn.sendMessage(from, { text: texto }, { quoted: msg });
}

module.exports = {
    run,
    aliases
};
