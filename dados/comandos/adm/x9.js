const Grupo = require('../../modelos/grupos');
const groupCache = require('../../funções/groupCache');
const { isUserAdmin } = require('../../funções/normalizarid');
const { isOwnerSender } = require('../../funções/ownerAuth');

module.exports = {
    name: 'x9',
    aliases: ['monitorar', 'x9', 'dedoduro'],
    category: 'adm',
    description: 'Ativa ou desativa o sistema X9 para ações administrativas.',

    run: async (conn, msg, config, args, sender) => {
        const from = msg.key.remoteJid;

        try {
            if (!from.endsWith('@g.us')) {
                return await conn.sendMessage(from, { text: '❌ Esse comando só faz sentido dentro de grupos.' }, { quoted: msg });
            }

            const groupMetadata = await conn.groupMetadata(from).catch(() => null);
            if (!groupMetadata) {
                return await conn.sendMessage(from, { text: '❌ Erro ao obter dados do grupo.' }, { quoted: msg });
            }
            const rawSender = msg.key?.participant || sender;
            const isAdmin = isUserAdmin(groupMetadata, sender, conn) || isUserAdmin(groupMetadata, rawSender, conn);
            const isOwner = isOwnerSender(config, sender, msg, conn);

            if (!isAdmin && !isOwner) {
                return await conn.sendMessage(from, { text: '❌ Apenas administradores ou o dono do bot podem ligar o X9.' }, { quoted: msg });
            }

            let grupoConfig = await Grupo.findOne({ groupId: from });
            if (!grupoConfig) {
                grupoConfig = new Grupo({ groupId: from });
            }

            grupoConfig.x9 = !grupoConfig.x9;
            await grupoConfig.save();
            groupCache.del(from);

            const status = grupoConfig.x9 ? 'ATIVADO' : 'DESATIVADO';
            await conn.sendMessage(from, {
                text: `🕵️ *X9 ${status}.*\n\nQuando ligado, toda promoção, rebaixamento ou mensagem apagada vai chamar a atenção da administração do grupo.`
            }, { quoted: msg });
        } catch (error) {
            console.error('Erro no comando x9:', error);
            await conn.sendMessage(from, { text: '❌ Erro ao alterar a configuração do X9.' }, { quoted: msg });
        }
    }
};
