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
        if (!groupMetadata) {
            return await conn.sendMessage(from, { text: '❌ Erro ao obter dados do grupo.' }, { quoted: msg });
        }

        const rawSender = msg.key?.participant || sender;
        const isAdmin = isUserAdmin(groupMetadata, sender, conn) || isUserAdmin(groupMetadata, rawSender, conn);
        if (!isAdmin) {
            return await conn.sendMessage(from, { text: '❌ Apenas administradores podem usar este comando!' }, { quoted: msg });
        }

        const rawArg = (args[0] || '').trim().toLowerCase();

        if (!rawArg || ['agora', 'now', 'imediato'].includes(rawArg)) {
            if (!isBotAdmin(groupMetadata, conn)) {
                return await conn.sendMessage(from, { text: '❌ Preciso ser administrador para abrir o grupo!' }, { quoted: msg });
            }
            await conn.groupSettingUpdate(from, 'not_announcement');
            const senderTag = sender.split('@')[0].split(':')[0];
            const card = buildActionCard({
                header: 'GESTÃO DO GRUPO',
                headerIcon: '👥',
                title: 'GRUPO ABERTO',
                icon: '🔓',
                lines: [
                    `📢 *Status:* Aberto para todos`,
                    `👥 *Grupo:* ${groupMetadata.subject || 'Grupo'}`,
                    `👮 *Modificado por:* @${senderTag}`
                ],
                tip: `Todos os participantes podem enviar mensagens. Para agendar abertura diária, use ${prefix}abrirgp HH:MM (ex: ${prefix}abrirgp 07:00).`
            });
            return await conn.sendMessage(from, { text: card, mentions: [sender, rawSender].filter(Boolean) }, { quoted: msg });
        }

        if (['info', 'status', 'ver'].includes(rawArg)) {
            let grupoDB = await Grupo.findOne({ groupId: from });
            const horarioAtual = grupoDB?.horarioAbrir || 'Não configurado';
            return await conn.sendMessage(from, {
                text: `⏰ *AGENDAMENTO PARA ABRIR O GRUPO*\n\n` +
                      `📌 *Horário atual:* ${horarioAtual}\n\n` +
                      `👉 *Como usar:*\n` +
                      `• *${prefix}abrirgp* (Abre o grupo agora)\n` +
                      `• *${prefix}abrirgp 07:00* (Define o horário de abertura diária)\n` +
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

            return await conn.sendMessage(from, { text: card, mentions: [sender, rawSender].filter(Boolean) }, { quoted: msg });
        }

        const normalized = normalizeTime(rawArg);
        if (!normalized) {
            return await conn.sendMessage(from, {
                text: `❌ Horário inválido! Use: \n• *${prefix}abrirgp* para abrir o grupo agora\n• *${prefix}abrirgp 07:30* para agendar horário diário\n• *${prefix}abrirgp off* para desativar agendamento`
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
            alert: !isBotAdmin(groupMetadata, conn) 
                ? 'Lembre-se de dar administrador ao bot para que ele possa abrir o grupo no horário!'
                : '',
            tip: 'Todos os dias neste horário o grupo será aberto automaticamente para todos os membros.'
        });

        await conn.sendMessage(from, { text: card, mentions: [sender, rawSender].filter(Boolean) }, { quoted: msg });

    } catch (e) {
        console.error('Erro no comando abrirgp:', e);
        await conn.sendMessage(from, { text: '❌ Erro ao processar o comando de abrir grupo.' }, { quoted: msg });
    }
}

module.exports = {
    name: 'abrirgp',
    category: 'adm',
    description: 'Agenda a abertura automática diária do grupo no Horário de Brasília',
    aliases,
    run
};
