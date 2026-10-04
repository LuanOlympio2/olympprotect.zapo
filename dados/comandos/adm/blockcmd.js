const Grupo = require('../../modelos/grupos');
const { isUserAdmin } = require('../../funções/normalizarid');
const groupCache = require('../../funções/groupCache');
module.exports = {
    name: 'blockcmd',
    aliases: ['blockcmd'],
    category: 'adm',
    description: 'Bloqueia ou desbloqueia comandos dentro do grupo.',
    run: async (conn, msg, config, args, sender) => {
        const from = msg.key.remoteJid;
        if (!from.endsWith('@g.us')) {
            return conn.sendMessage(from, { text: '❌ Esse comando só funciona em grupos.' }, { quoted: msg });
        }
        try {
            const metadata = await conn.groupMetadata(from).catch(() => null);
            if (!metadata) {
                return conn.sendMessage(from, { text: '❌ Erro ao obter dados do grupo.' }, { quoted: msg });
            }
            const rawSender = msg.key?.participant || sender;
            if (!isUserAdmin(metadata, sender, conn) && !isUserAdmin(metadata, rawSender, conn)) {
                return conn.sendMessage(from, { text: '❌ Apenas administradores podem gerenciar bloqueio de comandos.' }, { quoted: msg });
            }
            let grupo = await Grupo.findOne({ groupId: from });
            if (!grupo) grupo = new Grupo({ groupId: from });
            if (!Array.isArray(grupo.blockedCommands)) grupo.blockedCommands = [];
            const action = args[0]?.toLowerCase();
            const commandName = args[1]?.toLowerCase();
            if (!action || action === 'list') {
                const list = grupo.blockedCommands.length ? grupo.blockedCommands.join(', ') : 'nenhum';
                return conn.sendMessage(from, { text: `📦 Comandos bloqueados neste grupo: ${list}` }, { quoted: msg });
            }
            if (!commandName) {
                return conn.sendMessage(from, { text: `❌ Use: ${config.prefix}blockcmd add ping\n${config.prefix}blockcmd del ping\n${config.prefix}blockcmd list` }, { quoted: msg });
            }
            if (action === 'add') {
                if (!grupo.blockedCommands.includes(commandName)) grupo.blockedCommands.push(commandName);
            } else if (action === 'del' || action === 'remove' || action === 'rm') {
                grupo.blockedCommands = grupo.blockedCommands.filter((cmd) => cmd !== commandName);
            } else {
                return conn.sendMessage(from, { text: '❌ Ação inválida. Use add, del ou list.' }, { quoted: msg });
            }
            await grupo.save();
            groupCache.del(from);
            await conn.sendMessage(from, { text: `✅ Lista de comandos bloqueados atualizada.` }, { quoted: msg });
        } catch (e) {
            console.error('Erro no comando blockcmd:', e);
            await conn.sendMessage(from, { text: '❌ Erro ao atualizar o bloqueio de comandos.' }, { quoted: msg });
        }
    }
};
