const Grupo = require('../../modelos/grupos');
const { isUserAdmin, isBotAdmin } = require('../../funções/normalizarid');
const groupCache = require('../../funções/groupCache');
const aliases = ['antilink', 'antilinkurl'];
async function run(conn, msg, config, args, sender) {
    const from = msg.key.remoteJid;
    if (!from.endsWith('@g.us')) {
        return await conn.sendMessage(from, { text: '❌ Esse comando só funciona em grupos.' }, { quoted: msg });
    }
    try {
        const groupMetadata = await conn.groupMetadata(from).catch(() => null);
        if (!groupMetadata) {
            return await conn.sendMessage(from, { text: '❌ Erro ao obter dados do grupo.' }, { quoted: msg });
        }
        const rawSender = msg.key?.participant || sender;
        if (!isUserAdmin(groupMetadata, sender, conn) && !isUserAdmin(groupMetadata, rawSender, conn)) {
            return await conn.sendMessage(from, { text: '❌ Apenas administradores podem usar esse comando.' }, { quoted: msg });
        }
        if (!isBotAdmin(groupMetadata, conn)) {
            return await conn.sendMessage(from, {
                text: '⚠️ Eu preciso ser administrador para apagar links normais e punir quem insistir.'
            }, { quoted: msg });
        }
        let grupoDB = await Grupo.findOne({ groupId: from });
        if (!grupoDB) {
            grupoDB = new Grupo({ groupId: from });
        }
        grupoDB.antilinkNormal = !grupoDB.antilinkNormal;
        await grupoDB.save();
        groupCache.del(from);
        const status = grupoDB.antilinkNormal ? 'ATIVADO' : 'DESATIVADO';
        await conn.sendMessage(from, {
            text: `🛡️ *Anti-Link ${status}.*\n\nAgora o bot vai agir contra URLs comuns enviadas no grupo.`
        }, { quoted: msg });
    } catch (e) {
        console.error('Erro no comando antilink:', e);
        await conn.sendMessage(from, { text: '❌ Erro ao salvar a configuração do Anti-Link.' }, { quoted: msg });
    }
}
module.exports = {
    run,
    aliases
};
