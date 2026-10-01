// creditos Olympio
const Grupo = require('../../modelos/grupos');
const { isUserAdmin, isBotAdmin } = require('../../funções/normalizarid');
const groupCache = require('../../funções/groupCache');

const aliases = ['antispam', 'spam'];

async function run(conn, msg, config, args, sender, senderName) {
    const from = msg.key.remoteJid;
    if (!from.endsWith('@g.us')) {
        return await conn.sendMessage(from, { text: '❌ Este comando só funciona em grupos!' }, { quoted: msg });
    }

    try {
        const groupMetadata = await conn.groupMetadata(from);
        if (!isUserAdmin(groupMetadata, sender)) {
            return await conn.sendMessage(from, { text: '❌ Apenas administradores podem usar este comando!' }, { quoted: msg });
        }

        if (!isBotAdmin(groupMetadata, conn.user.id)) {
            return await conn.sendMessage(from, {
                text: '⚠️ *Atenção:* Eu preciso ser Administrador do grupo para que o Anti-Spam funcione (banir spammers)!\n\nMe dê admin e tente novamente.'
            }, { quoted: msg });
        }

        let grupoDB = await Grupo.findOne({ groupId: from });
        if (!grupoDB) {
            grupoDB = new Grupo({ groupId: from });
        }

        const sub = (args[0] || '').toLowerCase();
        if (sub === 'on' || sub === '1' || sub === 'ativar' || sub === 'ligar') {
            grupoDB.antispam = true;
        } else if (sub === 'off' || sub === '0' || sub === 'desativar' || sub === 'desligar') {
            grupoDB.antispam = false;
        } else {
            grupoDB.antispam = !grupoDB.antispam;
        }

        await grupoDB.save();
        groupCache.del(from);

        const status = grupoDB.antispam ? 'ATIVADO 🛡️' : 'DESATIVADO 🔓';
        const text = grupoDB.antispam
            ? `✅ *Anti-Spam foi ${status}!*\n\nLimite: 6 mensagens em 3 segundos. Membros que spamarem serão removidos automaticamente.`
            : `✅ *Anti-Spam foi ${status}!*\n\nO limite de velocidade de mensagens não está mais ativo.`;

        await conn.sendMessage(from, { text }, { quoted: msg });
    } catch (e) {
        console.error('Erro no comando antispam:', e);
        await conn.sendMessage(from, { text: 'Erro ao salvar configuração do Anti-Spam.' }, { quoted: msg });
    }
}

module.exports = {
    run,
    aliases
};
