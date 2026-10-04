const fs = require('fs-extra');
const path = require('path');
const { downloadContentFromMessage } = require('../../funções/mediaUtils');
const Grupo = require('../../modelos/grupos');
const { isUserAdmin } = require('../../funções/normalizarid');
const groupCache = require('../../funções/groupCache');

const aliases = ['fundobv', 'setfundobv', 'imgbv', 'fotobv'];

async function run(conn, msg, config, args, sender) {
    const from = msg.key.remoteJid;
    if (!from.endsWith('@g.us')) {
        return await conn.sendMessage(from, { text: '❌ Esse comando só funciona em grupos.' }, { quoted: msg });
    }

    try {
        const groupMetadata = await conn.groupMetadata(from).catch(() => null);
        if (!groupMetadata) {
            return await conn.sendMessage(from, { text: '❌ Erro ao obter dados do grupo.' }, { quoted: msg });
        }
        const rawSender = msg.key?.participant || sender;
        if (!isUserAdmin(groupMetadata, sender, conn) && !isUserAdmin(groupMetadata, rawSender, conn)) {
            return await conn.sendMessage(from, { text: '❌ Apenas administradores podem alterar a imagem de boas-vindas.' }, { quoted: msg });
        }

        let grupoDB = await Grupo.findOne({ groupId: from });
        if (!grupoDB) {
            grupoDB = new Grupo({ groupId: from });
        }

        const opcao = args[0]?.toLowerCase();
        if (opcao === 'off' || opcao === 'rm' || opcao === 'reset' || opcao === 'del' || opcao === 'remover') {
            if (grupoDB.fundoBv && fs.existsSync(grupoDB.fundoBv)) {
                try { await fs.unlink(grupoDB.fundoBv); } catch (_) {}
            }
            grupoDB.fundoBv = null;
            await grupoDB.save();
            groupCache.del(from);
            return await conn.sendMessage(from, { text: '✅ Imagem de fundo do boas-vindas removida com sucesso.' }, { quoted: msg });
        }

        const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        const imageMessage = quoted?.imageMessage || msg.message?.imageMessage;

        if (!imageMessage) {
            return await conn.sendMessage(from, {
                text: `❌ Envie ou responda a uma foto com *${config.prefix}fundobv* para definir a imagem de entrada.\n\nPara remover, use: *${config.prefix}fundobv rm*`
            }, { quoted: msg });
        }

        await conn.sendMessage(from, { text: '📥 Baixando e salvando imagem...' }, { quoted: msg });

        const stream = await downloadContentFromMessage(imageMessage, 'image');
        let buffer = Buffer.from([]);
        for await (const chunk of stream) {
            buffer = Buffer.concat([buffer, chunk]);
        }

        const dirPath = path.resolve(__dirname, '../../midias/welcomes');
        await fs.ensureDir(dirPath);

        const safeId = from.replace(/[^a-zA-Z0-9]/g, '_');
        const filePath = path.join(dirPath, `welcome_${safeId}.jpg`);

        await fs.writeFile(filePath, buffer);

        grupoDB.fundoBv = filePath;
        await grupoDB.save();
        groupCache.del(from);

        await conn.sendMessage(from, { text: '✅ Foto de fundo do boas-vindas definida com sucesso!' }, { quoted: msg });
    } catch (e) {
        console.error('Erro no comando fundobv:', e);
        await conn.sendMessage(from, { text: '❌ Erro ao salvar a imagem do boas-vindas.' }, { quoted: msg });
    }
}

module.exports = {
    run,
    aliases
};
