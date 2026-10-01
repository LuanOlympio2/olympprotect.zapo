// creditos Olympio
const Usuario = require('../../modelos/Usuario');
const { normalizeId } = require('../../funções/normalizarid');
const { isOwnerSender } = require('../../funções/ownerAuth');
module.exports = {
    name: 'addvip',
    description: 'Adiciona um usuário à lista VIP.',
    aliases: ['addvip'],
    category: 'dono',
    run: async (conn, m, config, args, sender) => {
        const from = m.key.remoteJid;
        if (!isOwnerSender(config, sender, m)) {
            return conn.sendMessage(from, { text: '❌ Somente o dono supremo pode ampliar a tropa VIP.' }, { quoted: m });
        }
        if (args.length < 1) {
            return conn.sendMessage(from, {
                text: `❌ Informe o número que vai receber o passe VIP.\nExemplo: *${config.prefix}addvip 5511999999999*`
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
            let usuario = await Usuario.findOne({ userId: targetId });
            if (!usuario) {
                usuario = new Usuario({ userId: targetId, nome: `VIP ${targetNumber}` });
            }
            usuario.vip = true;
            await usuario.save();
            await conn.sendMessage(from, {
                text: `✅ *VIP liberado com sucesso.*\n\n+${targetNumber} agora pode falar comigo no privado sem bloqueio.`
            }, { quoted: m });
        } catch (e) {
            console.error('Erro ao adicionar VIP:', e);
            await conn.sendMessage(from, { text: '❌ Erro ao adicionar VIP.' }, { quoted: m });
        }
    }
};
