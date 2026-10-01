// creditos Olympio
const RpgPlayer = require('../../modelos/RpgPlayer');
const Grupo = require('../../modelos/grupos');

async function getOrCriaPlayer(senderNumber, senderName) {
    let player = await RpgPlayer.findOne({ userId: senderNumber });
    if (!player) {
        player = new RpgPlayer({
            userId: senderNumber,
            nome: senderName || 'Aventureiro'
        });
        await player.save();
    } else if (senderName && player.nome !== senderName) {
        player.nome = senderName;
    }
    return player;
}

async function verificarModoRpg(conn, from, msg, prefix) {
    if (!from.endsWith('@g.us')) return true; 

    const grupoDB = await Grupo.findOne({ groupId: from });
    if (!grupoDB || !grupoDB.modorpg) {
        await conn.sendMessage(from, {
            text: `⚠️ *Modo RPG desativado neste grupo!*\n\nUm administrador precisa ativar o RPG usando o comando *${prefix || '!'}modorpg*.`
        }, { quoted: msg });
        return false;
    }
    return true;
}

function formatOuro(valor) {
    return `${Number(valor || 0).toLocaleString('pt-BR')} 🪙`;
}

function formatTempoRestante(ms) {
    const totalSegundos = Math.max(0, Math.floor(ms / 1000));
    const minutos = Math.floor(totalSegundos / 60);
    const segundos = totalSegundos % 60;
    if (minutos > 0) {
        return `${minutos}min e ${segundos}s`;
    }
    return `${segundos}s`;
}

module.exports = {
    getOrCriaPlayer,
    verificarModoRpg,
    formatOuro,
    formatTempoRestante
};
