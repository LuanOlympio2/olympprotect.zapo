// creditos Olympio
const Grupo = require('../../modelos/grupos');
const { isUserAdmin, isBotAdmin } = require('../../funções/normalizarid');
const { buildActionCard } = require('../../funções/layout');
const { normalizeTime } = require('../../funções/agendamentoGrupos');
const groupCache = require('../../funções/groupCache');

const aliases = ['abrirgp', 'opengp'];

async function run(conn, msg, config, args, sender, senderName) {
    const from = msg.key.remoteJid;
    const isGroup = from.endsWith('@g.us');
    const prefix = config.prefix || '!';

    if (!isGroup) {
        return await conn.sendMessage(from, { text: '⚠️ Este comando só funciona em grupos!' }, { quoted: msg });
    }

    try {
        const groupMetadata = await conn.groupMetadata(from).catch(() => null);
        if (!groupMetadata || !isUserAdmin(groupMetadata, sender)) {
            return await conn.sendMessage(from, { text: '❌ Apenas administradores podem configurar o agendamento do grupo!' }, { quoted: msg });
        }

        const rawArg = (args[0] || '').trim().toLowerCase();

        if (!rawArg) {
            let grupoDB = await Grupo.findOne({ groupId: from });
            const horarioAtual = grupoDB?.horarioAbrir || 'Não configurado';
            return await conn.sendMessage(from, {
                text: `⏰ *AGENDAMENTO PARA ABRIR O GRUPO*\n\n` +
                      `📌 *Horário atual:* ${horarioAtual}\n\n` +
                      `👉 *Como usar:*\n` +
                      `• *${prefix}abrirgp 07:00* (Define o horário de Brasília)\n` +
                      `• *${prefix}abrirgp off* (Desativa a abertura automática)`
            }, { quoted: msg });
        }

        let grupoDB = await Grupo.findOne({ groupId: from });
        if (!grupoDB) {
            grupoDB = new Grupo({ groupId: from });
        }

        if (['off', 'desativar', 'cancelar', 'remover', 'rm'].includes(rawArg)) {
            grupoDB.horarioAbrir = null;
            if (grupoDB.scheduleLastRun) delete grupoDB.scheduleLastRun.open;
            await grupoDB.save();
            groupCache.del(from);

            const card = buildActionCard({
                header: 'AGENDAMENTO DO GRUPO',
                headerIcon: '⏰',
                title: 'ABERTURA DESATIVADA',
                icon: '🛑',
                lines: [
                    `📢 *Status:* Agendamento cancelado`,
                    `👥 *Grupo:* ${groupMetadata.subject || 'Grupo'}`,
                    `👮 *Modificado por:* @${sender.split('@')[0].split(':')[0]}`
                ],
                tip: 'O grupo não será mais aberto automaticamente.'
            });

            return await conn.sendMessage(from, { text: card, mentions: [sender] }, { quoted: msg });
        }

        const normalized = normalizeTime(rawArg);
        if (!normalized) {
            return await conn.sendMessage(from, {
                text: `❌ Horário inválido! Use o formato de 24 horas *HH:MM* (Exemplo: *${prefix}abrirgp 07:30*).`
            }, { quoted: msg });
        }

        grupoDB.horarioAbrir = normalized;
        if (grupoDB.scheduleLastRun) delete grupoDB.scheduleLastRun.open;
        await grupoDB.save();
        groupCache.del(from);

        const card = buildActionCard({
            header: 'AGENDAMENTO DO GRUPO',
            headerIcon: '⏰',
            title: 'ABERTURA PROGRAMADA',
            icon: '🔓',
            lines: [
                `📢 *Status:* Ativo todos os dias`,
                `🕒 *Horário:* ${normalized} (Horário de Brasília)`,
                `👥 *Grupo:* ${groupMetadata.subject || 'Grupo'}`,
                `👮 *Modificado por:* @${sender.split('@')[0].split(':')[0]}`
            ],
            alert: !isBotAdmin(groupMetadata, conn.user?.id) 
                ? 'Lembre-se de dar administrador ao bot para que ele possa abrir o grupo no horário!'
                : '',
            tip: 'Todos os dias neste horário o grupo será aberto automaticamente para todos os membros.'
        });

        await conn.sendMessage(from, { text: card, mentions: [sender] }, { quoted: msg });

    } catch (e) {
        console.error('Erro no comando abrirgp:', e);
        await conn.sendMessage(from, { text: '❌ Erro ao salvar o agendamento de abertura.' }, { quoted: msg });
    }
}

module.exports = {
    name: 'abrirgp',
    category: 'adm',
    description: 'Agenda a abertura automática diária do grupo no Horário de Brasília',
    aliases,
    run
};
