// creditos Olympio
const BotConfig = require('../../modelos/BotConfig');
const { isOwnerSender } = require('../../funções/ownerAuth');
module.exports = {
    name: 'antipv',
    description: 'Ativa ou desativa o modo Anti-PV.',
    aliases: ['antipv'],
    category: 'dono',
    run: async (conn, m, config, args, sender) => {
        const from = m.key.remoteJid;
        if (!isOwnerSender(config, sender, m)) {
            return conn.sendMessage(from, { text: '❌ Somente o dono supremo pode blindar o privado.' }, { quoted: m });
        }
        try {
            let botConfig = await BotConfig.findOne();
            if (!botConfig) {
                botConfig = new BotConfig();
            }
            botConfig.antipv = !botConfig.antipv;
            await botConfig.save();
            const status = botConfig.antipv ? 'ATIVADO' : 'DESATIVADO';
            await conn.sendMessage(from, {
                text: `🛡️ *Anti-PV ${status}.*\n\nQuando estiver ligado, só dono e VIP conseguem falar comigo no privado.`
            }, { quoted: m });
        } catch (e) {
            console.error('Erro ao alterar Anti-PV:', e);
            await conn.sendMessage(from, { text: '❌ Erro ao alterar a configuração do Anti-PV.' }, { quoted: m });
        }
    }
};
