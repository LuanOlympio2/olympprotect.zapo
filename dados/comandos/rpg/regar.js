// creditos Olympio
const { getOrCriaPlayer, verificarModoRpg } = require('../../funções/rpg/rpgHelper');

const aliases = ['regar', 'irrigar', 'molhar'];

async function run(conn, msg, config, args, sender, senderName) {
    const from = msg.key.remoteJid;
    const prefix = config.prefix || '!';

    if (!(await verificarModoRpg(conn, from, msg, prefix))) return;

    const senderNumber = sender.replace(/[^0-9]/g, '');
    const player = await getOrCriaPlayer(senderNumber, senderName);

    const lotes = player.fazenda?.lotes || [];

    if (lotes.length === 0) {
        return await conn.sendMessage(from, {
            text: `💧 Seus canteiros estão todos vazios! Plante algo com *${prefix}plantar* antes de regar.`
        }, { quoted: msg });
    }

    let regouAlgum = false;
    lotes.forEach(l => {
        if (!l.regado) {
            l.regado = true;
            regouAlgum = true;
        }
    });

    if (!regouAlgum) {
        return await conn.sendMessage(from, {
            text: `💧 Todos os seus canteiros já estão devidamente regados e bem cuidados!`
        }, { quoted: msg });
    }

    player.regenerarEstamina();
    player.consumirEstamina(5);

    await player.save();

    await conn.sendMessage(from, {
        text: `💧 *CANTEIROS IRRIGADOS!* 🚿\n\n👤 Fazendeiro: *@${senderNumber}*\n✨ Todos os seus canteiros foram regados com água fresca da fonte!\n⚡ O tempo de crescimento foi acelerado em *25%*!`,
        mentions: [sender]
    }, { quoted: msg });
}

module.exports = {
    run,
    aliases
};
