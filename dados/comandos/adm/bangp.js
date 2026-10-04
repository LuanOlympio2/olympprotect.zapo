const Grupo = require('../../modelos/grupos');
const { isUserAdmin } = require('../../funções/normalizarid');
const groupCache = require('../../funções/groupCache');
module.exports = {
    name: 'bangp',
    aliases: ['bangp'],
    category: 'adm',
    description: 'Faz o bot obedecer apenas o dono dentro deste grupo.',
    run: async (conn, msg, config, args, sender) => {
        const from = msg.key.remoteJid;
        if (!from.endsWith('@g.us')) {
            return conn.sendMessage(from, { text: '❌ Esse comando só funciona em grupos.' }, { quoted: msg });
        }
        try {
            const metadata = await conn.groupMetadata(from).catch(() => null);
            if (!metadata) {
                return conn.sendMessage(from, { text: '❌ Erro ao obter dados do grupo.' }, { quoted: msg });
            }
            const rawSender = msg.key?.participant || sender;
            if (!isUserAdmin(metadata, sender, conn) && !isUserAdmin(metadata, rawSender, conn)) {
                return conn.sendMessage(from, { text: '❌ Apenas administradores podem ativar o BangP.' }, { quoted: msg });
            }
            let grupo = await Grupo.findOne({ groupId: from });
            if (!grupo) grupo = new Grupo({ groupId: from });
            grupo.bangp = !grupo.bangp;
            await grupo.save();
            groupCache.del(from);
            const status = grupo.bangp ? 'ATIVADO' : 'DESATIVADO';
            await conn.sendMessage(from, {
                text: `💣 *BangP ${status}.*\n\nQuando ligado, só o dono do bot consegue usar comandos neste grupo.`
            }, { quoted: msg });
        } catch (e) {
            console.error('Erro no comando bangp:', e);
            await conn.sendMessage(from, { text: '❌ Erro ao alterar o BangP.' }, { quoted: msg });
        }
    }
};
