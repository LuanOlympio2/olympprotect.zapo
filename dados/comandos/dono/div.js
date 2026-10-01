// creditos Olympio
const { isOwnerSender } = require('../../funções/ownerAuth');
const { loadDivulgacao } = require('../../funções/divulgacao');
const { sendPaymentStyledText } = require('../../funções/paymentMessage');
function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
module.exports = {
    name: 'div',
    aliases: ['div', 'divulgar'],
    category: 'dono',
    description: 'Dispara a divulgação em massa usando o formato payment.',
    run: async (conn, msg, config, args, sender) => {
        const from = msg.key.remoteJid;
        try {
            if (!from.endsWith('@g.us')) {
                return await conn.sendMessage(from, {
                    text: '❌ A rajada de divulgação só pode ser usada dentro de grupos.'
                }, { quoted: msg });
            }
            if (!isOwnerSender(config, sender, msg)) {
                return await conn.sendMessage(from, {
                    text: '❌ Somente o dono supremo pode iniciar uma divulgação em massa.'
                }, { quoted: msg });
            }
            const delay = 500;
            const maxCount = 50;
            const groupMetadata = await conn.groupMetadata(from);
            const mentionedJid = groupMetadata.participants.map((participant) => participant.id);
            const visibleMentions = mentionedJid.map((jid) => `@${jid.split('@')[0]}`).join(' ');
            let count = null;
            let messageArgs = args.slice();
            if (messageArgs.length) {
                const firstNumber = parseInt(messageArgs[0], 10);
                const lastNumber = parseInt(messageArgs[messageArgs.length - 1], 10);
                if (!Number.isNaN(firstNumber)) {
                    count = firstNumber;
                    messageArgs = messageArgs.slice(1);
                } else if (!Number.isNaN(lastNumber)) {
                    count = lastNumber;
                    messageArgs = messageArgs.slice(0, -1);
                }
            }
            let messageText = messageArgs.join(' ').trim();
            if (!messageText) {
                messageText = (await loadDivulgacao()).savedMessage;
            }
            if (!messageText) {
                return await conn.sendMessage(from, {
                    text: '❌ Nenhuma mensagem de divulgação foi definida. Use *setdiv* primeiro.'
                }, { quoted: msg });
            }
            if (Number.isNaN(count) || !Number.isInteger(count) || count <= 0 || count > maxCount) {
                return await conn.sendMessage(from, {
                    text: `❌ Quantidade inválida. Use um valor de 1 até ${maxCount}.`
                }, { quoted: msg });
            }
            const paymentText = `${messageText}\n\n${visibleMentions}`.trim();
            await conn.sendMessage(from, {
                text: `📣 *Divulgação iniciada.*\n\nVou disparar ${count} mensagem(ns) no modo blindado do Olymp.`
            }, { quoted: msg });
            let falhas = 0;
            for (let index = 0; index < count; index++) {
                try {
                    await sendPaymentStyledText(conn, from, paymentText, mentionedJid, sender);
                } catch (error) {
                    falhas += 1;
                    console.error(`Falha ao enviar divulgação ${index + 1}:`, error);
                }
                if (index < count - 1) {
                    await sleep(delay);
                }
            }
            const resumo = falhas > 0
                ? `✅ Divulgação encerrada.\n\nDisparos: ${count}\nFalhas: ${falhas}`
                : `✅ Divulgação encerrada sem falhas.\n\nDisparos: ${count}`;
            await conn.sendMessage(from, { text: resumo }, { quoted: msg });
        } catch (e) {
            console.error("Erro no comando 'div':", e);
            await conn.sendMessage(from, {
                text: '💔 Ocorreu um erro ao iniciar a divulgação.'
            }, { quoted: msg });
        }
    }
};
