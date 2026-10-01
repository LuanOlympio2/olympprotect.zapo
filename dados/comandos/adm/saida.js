// creditos Olympio
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
        const groupMetadata = await conn.groupMetadata(from);
        if (!isUserAdmin(groupMetadata, sender)) {
            return await conn.sendMessage(from, { text: '❌ Apenas administradores podem configurar o aviso de saída.' }, { quoted: msg });
        }

        if (args.length === 0) {
            return await conn.sendMessage(from, {
                text: `❌ Use: *${config.prefix}saida 1* (ativar) ou *${config.prefix}saida 0* (desativar)\n\nLegenda: *${config.prefix}legendasaida <mensagem>*\nFoto: *${config.prefix}fundosaida* (envie uma foto)`
            }, { quoted: msg });
        }

        const opcao = args[0].toLowerCase();
        const ativar = opcao === '1' || opcao === 'on' || opcao === 'ligar';
        const desativar = opcao === '0' || opcao === 'off' || opcao === 'desligar';

        if (!ativar && !desativar) {
            return await conn.sendMessage(from, { text: '❌ Escolha 1 (ligar) ou 0 (desligar).' }, { quoted: msg });
        }

        let grupoDB = await Grupo.findOne({ groupId: from });
        if (!grupoDB) {
            grupoDB = new Grupo({ groupId: from });
        }

        grupoDB.saidaAtivo = ativar;
        grupoDB.dataAtualizacao = Date.now();
        await grupoDB.save();
        groupCache.del(from);

        const status = grupoDB.saidaAtivo ? '✅ ATIVADO' : '❌ DESATIVADO';
        await conn.sendMessage(from, { text: `Mensagens de saída/despedida foram ${status} com sucesso.` }, { quoted: msg });
    } catch (e) {
        console.error('Erro no comando saida:', e);
        await conn.sendMessage(from, { text: '❌ Erro ao configurar o aviso de saída.' }, { quoted: msg });
    }
}

module.exports = {
    run,
    aliases
};
