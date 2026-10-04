const { buscarLivroPDF } = require('../../funções/livroService');

const aliases = ['livro', 'pdf', 'livropdf'];

async function run(conn, msg, config, args, sender, senderName) {
    const from = msg.key.remoteJid;
    const query = args.join(' ').trim();

    if (!query) {
        return await conn.sendMessage(from, {
            text: '📖 *Buscar Livro em PDF*\n\nDigite o título ou autor após o comando.\nEx: !livro Dom Casmurro'
        }, { quoted: msg });
    }

    await conn.sendMessage(from, {
        text: `🔍 Buscando o livro "*${query}*" em nossas bases...\n⏳ Aguarde um momento. O bot continuará respondendo outros comandos normalmente!`
    }, { quoted: msg });

    (async () => {
        try {
            const result = await buscarLivroPDF(query);
            if (!result) {
                return await conn.sendMessage(from, {
                    text: `❌ Não foi possível encontrar o livro "*${query}*" em PDF nas bases pesquisadas.`
                }, { quoted: msg });
            }

            if (result.isTooLarge || !result.buffer) {
                return await conn.sendMessage(from, {
                    text: `📖 *${result.title}*\n✍️ *Autor:* ${result.author}\n🏛️ *Fonte:* ${result.source}\n⚠️ *Aviso:* O arquivo é muito grande (${result.sizeMb}MB) para upload direto no WhatsApp.\n\n🔗 *Link para download:* ${result.downloadUrl}`
                }, { quoted: msg });
            }

            const cleanFileName = (result.title || query).replace(/[\\/:*?"<>|]/g, '').slice(0, 80);

            await conn.sendMessage(from, {
                document: result.buffer,
                mimetype: 'application/pdf',
                fileName: `${cleanFileName}.pdf`,
                caption: `📖 *${result.title}*\n✍️ *Autor:* ${result.author}\n📦 *Tamanho:* ${result.sizeMb} MB\n🏛️ *Fonte:* ${result.source}`
            }, { quoted: msg });
        } catch (err) {
            await conn.sendMessage(from, {
                text: '❌ Ocorreu um erro durante o download do livro. Tente novamente mais tarde.'
            }, { quoted: msg });
        }
    })();
}

module.exports = {
    run,
    aliases
};
