// creditos Olympio
const Grupo = require('../../modelos/grupos');
const { isUserAdmin } = require('../../funções/normalizarid');
const groupCache = require('../../funções/groupCache');

const aliases = ['legendasaida', 'setlegendasaida', 'msgsaida'];

async function run(conn, msg, config, args, sender) {
    const from = msg.key.remoteJid;
    if (!from.endsWith('@g.us')) {
        return await conn.sendMessage(from, { text: '❌ Esse comando só funciona em grupos.' }, { quoted: msg });
    }

    try {
        const groupMetadata = await conn.groupMetadata(from);
        if (!isUserAdmin(groupMetadata, sender)) {
            return await conn.sendMessage(from, { text: '❌ Apenas administradores podem mudar a legenda de saída.' }, { quoted: msg });
        }

        const novaLegenda = args.join(' ');
        if (!novaLegenda) {
            return await conn.sendMessage(from, {
                text: `❌ Você precisa escrever a mensagem de despedida.\n\nVariáveis disponíveis:\n#numero# - marca o membro que saiu\n#grupo# - nome do grupo\n\nExemplo:\n*${config.prefix}legendasaida Adeus #numero#, você saiu do grupo #grupo#!*`
            }, { quoted: msg });
        }

        let grupoDB = await Grupo.findOne({ groupId: from });
        if (!grupoDB) {
            grupoDB = new Grupo({ groupId: from });
        }

        grupoDB.legendaSaida = novaLegenda;
        await grupoDB.save();
        groupCache.del(from);

        await conn.sendMessage(from, {
            text: `✅ Legenda de saída atualizada com sucesso!\n\n"${novaLegenda}"`
        }, { quoted: msg });
    } catch (e) {
        console.error('Erro no comando legendasaida:', e);
        await conn.sendMessage(from, { text: '❌ Erro ao salvar a legenda de saída.' }, { quoted: msg });
    }
}

module.exports = {
    run,
    aliases
};
