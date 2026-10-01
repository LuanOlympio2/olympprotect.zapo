// creditos Olympio
const Grupo = require('../../modelos/grupos');
const groupCache = require('../../funções/groupCache');
const { buildActionCard } = require('../../funções/layout');
module.exports = {
    name: 'autobaixar',
    aliases: ['autodownload', 'autodl'],
    category: 'adm',
    run: async (conn, msg, config, args, sender, senderName) => {
        const from = msg.key.remoteJid;
        try {
            let grupoConfig = await Grupo.findOne({ groupId: from });
            if (!grupoConfig) {
                grupoConfig = new Grupo({ groupId: from });
            }
            grupoConfig.autobaixar = !grupoConfig.autobaixar;
            await grupoConfig.save();
            groupCache.del(from);
            const statusTexto = grupoConfig.autobaixar ? 'ATIVADO 🟢' : 'DESATIVADO 🔴';

            const card = buildActionCard({
                header: 'CONFIGURAÇÃO DO GRUPO',
                headerIcon: '📥',
                title: 'AUTO DOWNLOAD',
                icon: '⚡',
                lines: [
                    `📢 *Status:* ${statusTexto}`,
                    `👮 *Modificado por:* @${sender.split('@')[0].split(':')[0]}`
                ],
                tip: grupoConfig.autobaixar
                    ? 'Links suportados enviados no grupo serão baixados automaticamente.'
                    : 'O download automático de links no grupo foi desativado.'
            });

            await conn.sendMessage(from, { text: card, mentions: [sender] }, { quoted: msg });
        } catch (error) {
            console.error('Erro no comando autobaixar:', error);
            await conn.sendMessage(from, { text: '❌ Erro ao alterar configuração.' }, { quoted: msg });
        }
    }
};
