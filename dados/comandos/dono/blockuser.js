// creditos Olympio
const BotConfig = require('../../modelos/BotConfig');
const { isOwnerSender } = require('../../funções/ownerAuth');
const { normalizeId } = require('../../funções/normalizarid');
module.exports = {
    name: 'blockuser',
    aliases: ['blockuser'],
    category: 'dono',
    description: 'Bloqueia um usuário específico no bot.',
    run: async (conn, msg, config, args, sender) => {
        const from = msg.key.remoteJid;
        if (!isOwnerSender(config, sender, msg)) {
            return conn.sendMessage(from, { text: '❌ Somente o dono supremo pode bloquear usuários.' }, { quoted: msg });
        }
        let target = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0] || args[0];
        if (!target) {
            return conn.sendMessage(from, { text: `❌ Use: ${config.prefix}blockuser 5511999999999 ou mencione o alvo.` }, { quoted: msg });
        }
        target = normalizeId(target.includes('@') ? target : `${target.replace(/[^0-9]/g, '')}@s.whatsapp.net`);
        try {
            let botConfig = await BotConfig.findOne();
            if (!botConfig) botConfig = new BotConfig();
            if (!Array.isArray(botConfig.blockedUsers)) botConfig.blockedUsers = [];
            if (!botConfig.blockedUsers.includes(target)) botConfig.blockedUsers.push(target);
            await botConfig.save();
            await conn.sendMessage(from, { text: `✅ O usuário +${target} foi bloqueado globalmente no bot.` }, { quoted: msg });
        } catch (e) {
            console.error('Erro no comando blockuser:', e);
            await conn.sendMessage(from, { text: '❌ Erro ao bloquear o usuário.' }, { quoted: msg });
        }
    }
};
