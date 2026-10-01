// creditos Olympio
const Usuario = require('../../modelos/Usuario');
const { normalizeId } = require('../../funções/normalizarid');
const { isOwnerSender } = require('../../funções/ownerAuth');
module.exports = {
    name: 'delvip',
    description: 'Remove um usuário da lista VIP.',
    aliases: ['delvip', 'remvip'],
    category: 'dono',
    run: async (conn, m, config, args, sender) => {
        const from = m.key.remoteJid;
        if (!isOwnerSender(config, sender, m)) {
            return conn.sendMessage(from, { text: '❌ Somente o dono supremo pode remover um VIP.' }, { quoted: m });
        }
        if (args.length < 1) {
            return conn.sendMessage(from, {
                text: `❌ Informe o número que vai sair da lista VIP.\nExemplo: *${config.prefix}delvip 5511999999999*`
            }, { quoted: m });
        }
        let targetNumber = args[0].replace(/[^0-9]/g, '');
        if (!targetNumber) {
            return conn.sendMessage(from, { text: '❌ Número inválido. Envie apenas os dígitos.' }, { quoted: m });
        }
        if (!targetNumber.startsWith('55') && targetNumber.length >= 10 && targetNumber.length <= 11) {
            targetNumber = `55${targetNumber}`;
        }
        const targetId = normalizeId(`${targetNumber}@s.whatsapp.net`);
        try {
            const usuario = await Usuario.findOne({ userId: targetId });
            if (!usuario || !usuario.vip) {
                return conn.sendMessage(from, { text: '❌ Esse número não está na lista VIP.' }, { quoted: m });
            }
            usuario.vip = false;
            await usuario.save();
            await conn.sendMessage(from, {
                text: `✅ *VIP removido.*\n\n+${targetNumber} voltou para as regras normais do privado.`
            }, { quoted: m });
        } catch (e) {
            console.error('Erro ao remover VIP:', e);
            await conn.sendMessage(from, { text: '❌ Erro ao remover VIP.' }, { quoted: m });
        }
    }
};
