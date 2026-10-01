// creditos Olympio
const { isOwnerSender } = require('../../funções/ownerAuth');
const { loadDivulgacao, saveDivulgacao } = require('../../funções/divulgacao');
module.exports = {
    name: 'setdiv',
    aliases: ['setdiv'],
    category: 'dono',
    description: 'Define ou exibe a mensagem global de divulgação.',
    run: async (conn, msg, config, args, sender) => {
        const from = msg.key.remoteJid;
        try {
            if (!isOwnerSender(config, sender, msg)) {
                return await conn.sendMessage(from, {
                    text: '❌ Somente o dono supremo pode configurar a divulgação global.'
                }, { quoted: msg });
            }
            const textoDiv = args.join(' ').trim();
            if (!textoDiv) {
                const currentConfig = await loadDivulgacao();
                const currentMessage = currentConfig.savedMessage || 'Nenhuma mensagem de divulgação foi salva até agora.';
                return await conn.sendMessage(from, {
                    text: `📣 *DIVULGAÇÃO GLOBAL ATUAL*\n\n${currentMessage}`
                }, { quoted: msg });
            }
            const saved = await saveDivulgacao({ savedMessage: textoDiv });
            if (!saved) {
                return await conn.sendMessage(from, {
                    text: '💔 Não consegui salvar a mensagem de divulgação na base local.'
                }, { quoted: msg });
            }
            await conn.sendMessage(from, {
                text: `✅ *Divulgação global atualizada.*\n\n${textoDiv}`
            }, { quoted: msg });
        } catch (e) {
            console.error('Erro no comando setdiv:', e);
            await conn.sendMessage(from, {
                text: '💔 Ocorreu um erro geral ao processar o setdiv.'
            }, { quoted: msg });
        }
    }
};
