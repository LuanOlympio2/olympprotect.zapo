// creditos Olympio
const Usuario = require('../../modelos/Usuario');
const { isOwnerSender } = require('../../funções/ownerAuth');
module.exports = {
    name: 'vips',
    description: 'Lista todos os usuários VIP.',
    aliases: ['listavip', 'vips'],
    category: 'dono',
    run: async (conn, m, config, args, sender) => {
        const from = m.key.remoteJid;
        if (!isOwnerSender(config, sender, m)) {
            return conn.sendMessage(from, { text: '❌ Somente o dono supremo pode consultar a ala VIP.' }, { quoted: m });
        }
        try {
            const vips = await Usuario.find({ vip: true });
            if (!vips.length) {
                return conn.sendMessage(from, { text: '📋 Nenhum usuário VIP encontrado até agora.' }, { quoted: m });
            }
            let text = '👑 *LISTA GLOBAL DE VIPS*\n\n';
            vips.forEach((vip, index) => {
                text += `${index + 1}. ${vip.nome || 'VIP sem nome'} (+${vip.userId})\n`;
            });
            await conn.sendMessage(from, { text }, { quoted: m });
        } catch (e) {
            console.error('Erro ao listar VIPs:', e);
            await conn.sendMessage(from, { text: '❌ Erro ao listar VIPs.' }, { quoted: m });
        }
    }
};
