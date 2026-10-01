// creditos Olympio
const Grupo = require('../../modelos/grupos');
const groupCache = require('../../funções/groupCache');
const { isUserAdmin, isBotAdmin } = require('../../funções/normalizarid');
const { isOwnerSender } = require('../../funções/ownerAuth');

const aliases = ['antipg', 'antipayment', 'antipagamento'];

async function run(conn, msg, config, args, sender, senderName) {
    const from = msg.key.remoteJid;

    if (!from.endsWith('@g.us')) {
        return await conn.sendMessage(from, { text: '❌ Este comando só funciona em grupos!' }, { quoted: msg });
    }

    try {
        const groupMetadata = await conn.groupMetadata(from);
        const isAdmin = isUserAdmin(groupMetadata, sender);
        const isOwner = isOwnerSender(config, sender, msg);

        if (!isAdmin && !isOwner) {
            return await conn.sendMessage(from, { text: '❌ Apenas administradores podem usar este comando!' }, { quoted: msg });
        }

        if (!isBotAdmin(groupMetadata, conn.user.id)) {
            return await conn.sendMessage(from, {
                text: '⚠️ Atenção, eu preciso ser Administrador do grupo para apagar mensagens e banir quem envia solicitações de pagamento, conceda admin e tente novamente.'
            }, { quoted: msg });
        }

        let grupoDB = await Grupo.findOne({ groupId: from });
        if (!grupoDB) {
            grupoDB = new Grupo({ groupId: from });
        }

        const sub = (args[0] || '').toLowerCase();
        if (sub === 'on' || sub === '1' || sub === 'ativar' || sub === 'ligar') {
            grupoDB.antipg = true;
        } else if (sub === 'off' || sub === '0' || sub === 'desativar' || sub === 'desligar') {
            grupoDB.antipg = false;
        } else {
            grupoDB.antipg = !grupoDB.antipg;
        }

        await grupoDB.save();
        groupCache.del(from);

        const status = grupoDB.antipg ? 'ATIVADO 🛡️' : 'DESATIVADO 🔓';
        const text = grupoDB.antipg
            ? `✅ *Anti Pagamento foi ${status}!*\n\nAgora, quem enviar mensagens de pagamento nativas será removido imediatamente.`
            : `✅ *Anti Pagamento foi ${status}!*\n\nMensagens de pagamento não serão mais bloqueadas.`;

        await conn.sendMessage(from, { text }, { quoted: msg });
    } catch (e) {
        console.error('Erro no comando antipg:', e);
        await conn.sendMessage(from, { text: '❌ Erro ao salvar configuração do Anti Pagamento.' }, { quoted: msg });
    }
}

module.exports = {
    run,
    aliases
};
