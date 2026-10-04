const Grupo = require('../../modelos/grupos');
const { isUserAdmin } = require('../../funções/normalizarid');
const { isOwnerSender } = require('../../funções/ownerAuth');
const { buildActionCard } = require('../../funções/layout');
const groupCache = require('../../funções/groupCache');

const aliases = ['modobrincadeira', 'mododiversao', 'brincadeiramodo', 'diversaomodo', 'modobn'];

async function run(conn, msg, config, args, sender, senderName) {
    const from = msg.key.remoteJid;
    const prefix = config.prefix || '!';

    if (!from.endsWith('@g.us')) {
        return await conn.sendMessage(from, { text: '⚠️ Este comando só pode ser utilizado dentro de grupos!' }, { quoted: msg });
    }

    try {
        const groupMetadata = await conn.groupMetadata(from).catch(() => null);
        const rawSender = msg.key?.participant || sender;
        const isAdmin = groupMetadata ? (isUserAdmin(groupMetadata, sender, conn) || isUserAdmin(groupMetadata, rawSender, conn)) : false;
        const isOwner = isOwnerSender(config, sender, msg, conn);

        if (!isAdmin && !isOwner) {
            return await conn.sendMessage(from, { 
                text: '❌ Apenas administradores do grupo podem ativar ou desativar o Modo Brincadeira!' 
            }, { quoted: msg });
        }

        let grupoDB = await Grupo.findOne({ groupId: from });
        if (!grupoDB) {
            grupoDB = new Grupo({ groupId: from });
        }

        grupoDB.modobrincadeira = !grupoDB.modobrincadeira;
        await grupoDB.save();
        groupCache.del(from);

        const statusTexto = grupoDB.modobrincadeira ? 'ATIVADO 🟢' : 'DESATIVADO 🔴';
        const card = buildActionCard({
            header: 'CONFIGURAÇÃO DO GRUPO',
            headerIcon: '🎭',
            title: 'MODO BRINCADEIRA',
            icon: '🎲',
            lines: [
                `📢 *Status:* ${statusTexto}`,
                `👥 *Grupo:* ${groupMetadata?.subject || 'Grupo'}`,
                `👮 *Modificado por:* @${sender.split('@')[0].split(':')[0]}`
            ],
            tip: grupoDB.modobrincadeira
                ? `Agora todos os jogos e comandos de brincadeiras estão liberados! Digite *${prefix}menubrincadeira* para ver.`
                : `Os comandos e menus de brincadeiras foram suspensos neste grupo temporariamente.`
        });

        await conn.sendMessage(from, { 
            text: card,
            mentions: [sender]
        }, { quoted: msg });

    } catch (e) {
        console.error('Erro no comando modobrincadeira:', e);
        await conn.sendMessage(from, { text: '❌ Erro ao alterar configuração do Modo Brincadeira.' }, { quoted: msg });
    }
}

module.exports = {
    name: 'modobrincadeira',
    category: 'adm',
    description: 'Ativa ou desativa os comandos e menu de brincadeiras no grupo',
    aliases,
    run
};
