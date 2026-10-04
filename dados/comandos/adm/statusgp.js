const Grupo = require('../../modelos/grupos');
const { isUserAdmin, isBotAdmin } = require('../../funções/normalizarid');
const { isOwnerSender } = require('../../funções/ownerAuth');

function formatDate(timestamp) {
    if (!timestamp) return 'Indisponível';
    return new Date(timestamp * 1000).toLocaleString('pt-BR');
}

module.exports = {
    name: 'statusgp',
    aliases: ['statusgp', 'statusgrupo'],
    category: 'adm',
    description: 'Mostra o status geral do grupo e dos sistemas ativos.',
    run: async (conn, msg, config, args, sender) => {
        const from = msg.key.remoteJid;
        if (!from.endsWith('@g.us')) {
            return conn.sendMessage(from, { text: '❌ Esse comando só funciona em grupos.' }, { quoted: msg });
        }
        try {
            const groupMetadata = await conn.groupMetadata(from).catch(() => null);
            if (!groupMetadata) {
                return conn.sendMessage(from, { text: '❌ Não consegui obter os dados do grupo.' }, { quoted: msg });
            }
            const rawSender = msg.key?.participant || sender;
            if (!isUserAdmin(groupMetadata, sender, conn) && !isUserAdmin(groupMetadata, rawSender, conn) && !isOwnerSender(config, sender, msg, conn)) {
                return conn.sendMessage(from, { text: '❌ Apenas administradores podem consultar o status do grupo.' }, { quoted: msg });
            }
            let grupoDB = await Grupo.findOne({ groupId: from });
            if (!grupoDB) {
                grupoDB = new Grupo({ groupId: from });
            }

            let inviteLink = 'Indisponível';
            try {
                if (isBotAdmin(groupMetadata, conn)) {
                    const inviteCode = await conn.groupInviteCode(from);
                    inviteLink = `https://chat.whatsapp.com/${inviteCode}`;
                }
            } catch (_) {}

            const activeFlags = [
                ['Anti Link GP', grupoDB.antilink],
                ['Anti Link URL', grupoDB.antilinkNormal],
                ['Anti Fake', grupoDB.antifake],
                ['Anti Visu', grupoDB.antivisu],
                ['Anti Flood', grupoDB.antiflood?.enabled],
                ['Anti Pagamento', grupoDB.antipg],
                ['Anti Spam', grupoDB.antispam],
                ['Anti Áudio', grupoDB.antiaudio],
                ['Anti Botão', grupoDB.antibtn],
                ['Anti Card', grupoDB.anticard],
                ['Anti Catálogo', grupoDB.anticatalogo],
                ['Anti Documento', grupoDB.antidoc],
                ['Anti Figurinha', grupoDB.antifig],
                ['Anti Foto', grupoDB.antifoto],
                ['Anti Localização', grupoDB.antiloc],
                ['Anti Marcação', grupoDB.antimarcacao],
                ['Anti Status', grupoDB.antistatus],
                ['Anti Vídeo', grupoDB.antivideo],
                ['Modo Soadm', grupoDB.soadm],
                ['BangP', grupoDB.bangp],
                ['Auto Baixar', grupoDB.autobaixar],
                ['Boas-vindas', grupoDB.bemVindoAtivo],
                ['Despedida/Saída', grupoDB.saidaAtivo],
                ['Anti Nuke', grupoDB.antinuke],
                ['X9', grupoDB.x9],
                ['Modo RPG', grupoDB.modorpg],
                ['Modo Brincadeira', grupoDB.modobrincadeira],
                ['Auto Abrir', grupoDB.horarioAbrir ? `${grupoDB.horarioAbrir} (Brasília)` : false],
                ['Auto Fechar', grupoDB.horarioFechar ? `${grupoDB.horarioFechar} (Brasília)` : false]
            ]
                .filter(([, enabled]) => enabled)
                .map(([label]) => `• ${label}`);

            const participantsCount = groupMetadata.participants ? groupMetadata.participants.length : 0;
            const text = [
                '📊 *STATUS DO GRUPO*',
                '',
                `• *Nome:* ${groupMetadata.subject || 'Grupo'}`,
                `• *ID:* ${from}`,
                `• *Membros:* ${participantsCount}`,
                `• *Criado em:* ${formatDate(groupMetadata.creation)}`,
                `• *Modo envio:* ${groupMetadata.announce ? 'Somente admins' : 'Todos podem falar'}`,
                `• *Link:* ${inviteLink}`,
                '',
                '*Sistemas ativos:*',
                activeFlags.length ? activeFlags.join('\n') : '• Nenhum sistema especial ativo',
                '',
                `• *Comandos bloqueados:* ${grupoDB.blockedCommands?.length ? grupoDB.blockedCommands.join(', ') : 'nenhum'}`,
                `• *Lista negra:* ${grupoDB.listaNegra?.length || 0} número(s)`,
                `• *Donos secundários:* ${grupoDB.donos?.length || 0}`
            ].join('\n');

            await conn.sendMessage(from, { text }, { quoted: msg });
        } catch (e) {
            console.error('Erro no comando statusgp:', e);
            await conn.sendMessage(from, { text: '❌ Não consegui montar o status do grupo.' }, { quoted: msg });
        }
    }
};
