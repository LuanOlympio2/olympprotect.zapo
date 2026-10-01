// creditos Olympio
const Grupo = require('../../modelos/grupos');
const { isUserAdmin } = require('../../funções/normalizarid');
const groupCache = require('../../funções/groupCache');
module.exports = {
    name: 'antiflood',
    aliases: ['antiflood'],
    category: 'adm',
    description: 'Configura o anti-flood do grupo.',
    run: async (conn, msg, config, args, sender) => {
        const from = msg.key.remoteJid;
        if (!from.endsWith('@g.us')) {
            return conn.sendMessage(from, { text: '❌ Esse comando só funciona em grupos.' }, { quoted: msg });
        }
        try {
            const metadata = await conn.groupMetadata(from);
            if (!isUserAdmin(metadata, sender)) {
                return conn.sendMessage(from, { text: '❌ Apenas administradores podem configurar o anti-flood.' }, { quoted: msg });
            }
            let grupo = await Grupo.findOne({ groupId: from });
            if (!grupo) grupo = new Grupo({ groupId: from });
            const action = args[0]?.toLowerCase();
            if (action === 'off' || action === '0' || action === 'desligar') {
                grupo.antiflood = { enabled: false, maxMessages: 5, intervalSeconds: 2 };
                await grupo.save();
                groupCache.del(from);
                return conn.sendMessage(from, { text: '✅ Anti-flood desligado neste grupo.' }, { quoted: msg });
            }
            const maxMessages = parseInt(args[0], 10);
            const intervalSeconds = parseInt(args[1], 10);
            if (Number.isNaN(maxMessages) || Number.isNaN(intervalSeconds) || maxMessages <= 0 || intervalSeconds <= 0) {
                return conn.sendMessage(from, {
                    text: `❌ Use assim:\n${config.prefix}antiflood 5 2\n${config.prefix}antiflood off`
                }, { quoted: msg });
            }
            grupo.antiflood = {
                enabled: true,
                maxMessages,
                intervalSeconds
            };
            await grupo.save();
            groupCache.del(from);
            await conn.sendMessage(from, {
                text: `🛡️ Anti-flood configurado para *${maxMessages} mensagem(ns) a cada ${intervalSeconds} segundo(s)*.`
            }, { quoted: msg });
        } catch (e) {
            console.error('Erro no comando antiflood:', e);
            await conn.sendMessage(from, { text: '❌ Erro ao configurar o anti-flood.' }, { quoted: msg });
        }
    }
};
