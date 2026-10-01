// creditos Olympio
const Usuario = require('../../modelos/Usuario.js');
const { normalizeId } = require('../../funções/normalizarid');
async function run(conn, msg, config, args, sender) {
    const from = msg.key.remoteJid;
    try {
        const usuarioDB = await Usuario.findOne({ userId: normalizeId(sender) });
        if (!usuarioDB) {
            await conn.sendMessage(from, {
                text: 'Você ainda não tem um perfil local. Envie uma mensagem, comando ou figurinha primeiro.'
            }, { quoted: msg });
            return;
        }
        const perfilText = `
[ 👤 *PERFIL DO USUÁRIO* 👤 ]
• *Nome:* ${usuarioDB.nome}
• *ID:* ${usuarioDB.userId}
• *Comandos Usados:* ${usuarioDB.comandosUsados || 0}
• *Mensagens:* ${usuarioDB.mensagensEnviadas || 0}
• *Figurinhas:* ${usuarioDB.figurinhasEnviadas || 0}
        `.trim();
        await conn.sendMessage(from, { text: perfilText }, { quoted: msg });
    } catch (e) {
        console.error('Erro ao buscar perfil:', e);
        await conn.sendMessage(from, { text: '❌ Erro ao carregar seu perfil local.' }, { quoted: msg });
    }
}
module.exports = {
    run,
    aliases: ['perfil']
};
