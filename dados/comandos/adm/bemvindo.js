// creditos Olympio
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
        const groupMetadata = await conn.groupMetadata(from);
        if (!isUserAdmin(groupMetadata, sender)) {
            return await conn.sendMessage(from, { text: '❌ Apenas administradores podem mexer no boas-vindas.' }, { quoted: msg });
        }
        if (args.length === 0) {
            await conn.sendMessage(from, {
                text: `❌ Use: ${config.prefix}bemvindo (1/0)\n\n1 - ativar\n0 - desativar\n\nDefina a legenda com: ${config.prefix}legendabv <mensagem>`
            }, { quoted: msg });
            return;
        }
        const opcao = args[0];
        const ativar = opcao === '1';
        const desativar = opcao === '0';
        if (!ativar && !desativar) {
            await conn.sendMessage(from, { text: '❌ Você precisa escolher 1 para ligar ou 0 para desligar.' }, { quoted: msg });
            return;
        }
        let grupoDB = await Grupo.findOne({ groupId: from });
        if (!grupoDB) {
            grupoDB = new Grupo({ groupId: from });
        }
        if ((ativar && grupoDB.bemVindoAtivo) || (desativar && !grupoDB.bemVindoAtivo)) {
            const status = ativar ? 'ativado' : 'desativado';
            await conn.sendMessage(from, { text: `⚠️ O boas-vindas já está ${status}.` }, { quoted: msg });
            return;
        }
        grupoDB.bemVindoAtivo = ativar;
        grupoDB.dataAtualizacao = Date.now();
        await grupoDB.save();
        groupCache.del(from);
        const status = grupoDB.bemVindoAtivo ? '✅ ATIVADO' : '❌ DESATIVADO';
        await conn.sendMessage(from, { text: `Boas-vindas ${status} com sucesso.` }, { quoted: msg });
    } catch (e) {
        console.error('Erro ao configurar bem-vindo:', e);
        await conn.sendMessage(from, { text: '❌ Erro ao configurar o boas-vindas.' }, { quoted: msg });
    }
}
module.exports = {
    run,
    aliases
};
