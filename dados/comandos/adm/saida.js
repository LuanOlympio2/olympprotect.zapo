const Grupo = require('../../modelos/grupos');
const { isUserAdmin } = require('../../funções/normalizarid');
const groupCache = require('../../funções/groupCache');

const aliases = ['saida', 'antisaida', 'despedida', 'byebye'];

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
            return await conn.sendMessage(from, { text: '❌ Apenas administradores podem configurar o aviso de saída.' }, { quoted: msg });
        }

        let grupoDB = await Grupo.findOne({ groupId: from });
        if (!grupoDB) {
            grupoDB = new Grupo({ groupId: from });
        }

        const opcao = (args[0] || '').toLowerCase();
        let novoStatus;
        if (opcao === '1' || opcao === 'on' || opcao === 'ativar' || opcao === 'ligar' || opcao === 'sim') {
            novoStatus = true;
        } else if (opcao === '0' || opcao === 'off' || opcao === 'desativar' || opcao === 'desligar' || opcao === 'nao') {
            novoStatus = false;
        } else {
            novoStatus = !grupoDB.saidaAtivo;
        }

        grupoDB.saidaAtivo = novoStatus;
        grupoDB.dataAtualizacao = Date.now();
        await grupoDB.save();
        groupCache.del(from);

        const status = grupoDB.saidaAtivo ? '✅ ATIVADO' : '❌ DESATIVADO';
        await conn.sendMessage(from, { 
            text: `Mensagens de saída/despedida foram ${status} com sucesso neste grupo!\n\nLegenda: *${config.prefix}legendasaida <mensagem>*\nFoto: *${config.prefix}fundosaida*` 
        }, { quoted: msg });
    } catch (e) {
        console.error('Erro no comando saida:', e);
        await conn.sendMessage(from, { text: '❌ Erro ao configurar o aviso de saída.' }, { quoted: msg });
    }
}

module.exports = {
    run,
    aliases
};
