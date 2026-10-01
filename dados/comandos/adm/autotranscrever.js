// creditos Olympio
const Grupo = require('../../modelos/grupos');
const groupCache = require('../../funções/groupCache');
const { isUserAdmin } = require('../../funções/normalizarid');
const { buildActionCard } = require('../../funções/layout');

const aliases = ['autotranscrever', 'atranscrever'];

async function run(conn, msg, config, args, sender, senderName) {
    const from = msg.key.remoteJid;
    const isGroup = from.endsWith('@g.us');

    if (!isGroup) {
        return await conn.sendMessage(from, {
            text: '⚠️ Este comando só pode ser utilizado dentro de grupos!'
        }, { quoted: msg });
    }

    try {
        const groupMetadata = await conn.groupMetadata(from).catch(() => null);
        if (groupMetadata && !isUserAdmin(groupMetadata, sender)) {
            return await conn.sendMessage(from, {
                text: '❌ Apenas administradores do grupo podem alterar essa configuração!'
            }, { quoted: msg });
        }

        let grupo = await Grupo.findOne({ groupId: from });
        if (!grupo) {
            grupo = new Grupo({ groupId: from });
        }

        grupo.autotranscrever = !grupo.autotranscrever;
        await grupo.save();
        groupCache.del(from);

        const statusTexto = grupo.autotranscrever ? 'ATIVADO 🟢' : 'DESATIVADO 🔴';
        const card = buildActionCard({
            header: 'CONFIGURAÇÃO DO GRUPO',
            headerIcon: '🎙️',
            title: 'AUTO TRANSCRIÇÃO',
            icon: '📝',
            lines: [
                `📢 *Status:* ${statusTexto}`,
                `👥 *Grupo:* ${groupMetadata?.subject || 'Grupo'}`,
                `👮 *Modificado por:* @${sender.split('@')[0].split(':')[0]}`
            ],
            tip: grupo.autotranscrever
                ? 'Todos os áudios enviados no grupo agora serão transcritos em texto automaticamente.'
                : 'Os áudios não serão mais transcritos automaticamente no grupo.'
        });

        await conn.sendMessage(from, {
            text: card,
            mentions: [sender]
        }, { quoted: msg });

    } catch (e) {
        console.error('Erro no comando autotranscrever:', e?.message || e);
        await conn.sendMessage(from, {
            text: '❌ Ocorreu um erro ao alterar a configuração de auto transcrição.'
        }, { quoted: msg });
    }
}

module.exports = {
    name: 'autotranscrever',
    category: 'adm',
    description: 'Ativa ou desativa a transcrição automática de áudios no grupo',
    aliases,
    run
};
