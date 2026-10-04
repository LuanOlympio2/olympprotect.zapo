const Grupo = require('../../modelos/grupos');
const { isUserAdmin } = require('../../funções/normalizarid');
const groupCache = require('../../funções/groupCache');
const aliases = ['bemvindo', 'welcome', 'boasvindas', 'bv'];
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
            return await conn.sendMessage(from, { text: '❌ Apenas administradores podem mexer no boas-vindas.' }, { quoted: msg });
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
            novoStatus = !grupoDB.bemVindoAtivo;
        }

        grupoDB.bemVindoAtivo = novoStatus;
        grupoDB.dataAtualizacao = Date.now();
        await grupoDB.save();
        groupCache.del(from);
        const status = grupoDB.bemVindoAtivo ? '✅ ATIVADO' : '❌ DESATIVADO';
        await conn.sendMessage(from, { 
            text: `Boas-vindas ${status} com sucesso neste grupo!\n\nDefina a legenda com: *${config.prefix}legendabv <mensagem>*\nDefina a imagem com: *${config.prefix}fundobv*` 
        }, { quoted: msg });
    } catch (e) {
        console.error('Erro ao configurar bem-vindo:', e);
        await conn.sendMessage(from, { text: '❌ Erro ao configurar o boas-vindas.' }, { quoted: msg });
    }
}
module.exports = {
    run,
    aliases
};
