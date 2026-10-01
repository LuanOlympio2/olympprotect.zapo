// creditos Olympio
const Grupo = require('../../modelos/grupos');
const groupCache = require('../../funções/groupCache');
const { isUserAdmin } = require('../../funções/normalizarid');
const { buildActionCard } = require('../../funções/layout');
const { extractMediaSource, mediaToStickerBuffer } = require('../../funções/autofigUtils');

const aliases = ['autofig', 'autosticker'];

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

        const source = extractMediaSource(msg);
        if (source) {
            try {
                if (source.isVideo && Number(source.media.seconds || 0) > 9.9) {
                    await conn.sendMessage(from, {
                        text: '⚠️ O vídeo precisa ter no máximo 9.9 segundos para virar figurinha.'
                    }, { quoted: msg });
                } else {
                    const stickerBuffer = await mediaToStickerBuffer(source.media, source.mediaType, {
                        packName: '',
                        authorName: '「 Olymp.Protect - bot 」'
                    });
                    await conn.sendMessage(from, { sticker: stickerBuffer, isAnimated: !!stickerBuffer.isAnimated || source.isVideo }, { quoted: msg });
                }
            } catch (eMedia) {
                console.error('Erro ao converter mídia no autofig:', eMedia);
            }
        }

        let grupo = await Grupo.findOne({ groupId: from });
        if (!grupo) {
            grupo = new Grupo({ groupId: from });
        }

        grupo.autofig = !grupo.autofig;
        await grupo.save();
        groupCache.del(from);

        const statusTexto = grupo.autofig ? 'ATIVADO 🟢' : 'DESATIVADO 🔴';
        const card = buildActionCard({
            header: 'CONFIGURAÇÃO DO GRUPO',
            headerIcon: '🎨',
            title: 'AUTO FIGURINHA',
            icon: '✨',
            lines: [
                `📢 *Status:* ${statusTexto}`,
                `👥 *Grupo:* ${groupMetadata?.subject || 'Grupo'}`,
                `👮 *Modificado por:* @${sender.split('@')[0].split(':')[0]}`
            ],
            tip: grupo.autofig
                ? 'Imagens e vídeos curtos enviados no grupo serão convertidos em figurinhas automaticamente.'
                : 'O envio de figurinhas automáticas foi desativado neste grupo.'
        });

        await conn.sendMessage(from, {
            text: card,
            mentions: [sender]
        }, { quoted: msg });

    } catch (e) {
        console.error('Erro no comando autofig:', e?.message || e);
        await conn.sendMessage(from, {
            text: '❌ Ocorreu um erro ao alterar a configuração de auto figurinha.'
        }, { quoted: msg });
    }
}

module.exports = {
    name: 'autofig',
    category: 'adm',
    description: 'Ativa ou desativa a conversão automática de fotos e vídeos em figurinhas no grupo',
    aliases,
    run
};
