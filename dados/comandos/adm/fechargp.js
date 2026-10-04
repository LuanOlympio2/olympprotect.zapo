// creditos Olympio
const Grupo = require('../../modelos/grupos');
const { isUserAdmin, isBotAdmin } = require('../../funções/normalizarid');
const { buildActionCard } = require('../../funções/layout');
const { normalizeTime } = require('../../funções/agendamentoGrupos');
const groupCache = require('../../funções/groupCache');

const aliases = ['fechargp', 'closegp'];

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
                return await conn.sendMessage(from, { text: '❌ Preciso ser administrador para fechar o grupo!' }, { quoted: msg });
            }
            await conn.groupSettingUpdate(from, 'announcement');
            const senderTag = sender.split('@')[0].split(':')[0];
            const card = buildActionCard({
                header: 'GESTÃO DO GRUPO',
                headerIcon: '👥',
                title: 'GRUPO FECHADO',
                icon: '🔒',
                lines: [
                    `📢 *Status:* Fechado (Apenas Admins)`,
                    `👥 *Grupo:* ${groupMetadata.subject || 'Grupo'}`,
                    `👮 *Modificado por:* @${senderTag}`
                ],
                tip: `Apenas administradores podem enviar mensagens. Para agendar fechamento diário, use ${prefix}fechargp HH:MM (ex: ${prefix}fechargp 22:00).`
            });
            return await conn.sendMessage(from, { text: card, mentions: [sender, rawSender].filter(Boolean) }, { quoted: msg });
        }

        if (['info', 'status', 'ver'].includes(rawArg)) {
            let grupoDB = await Grupo.findOne({ groupId: from });
            const horarioAtual = grupoDB?.horarioFechar || 'Não configurado';
            return await conn.sendMessage(from, {
                text: `⏰ *AGENDAMENTO PARA FECHAR O GRUPO*\n\n` +
                      `📌 *Horário atual:* ${horarioAtual}\n\n` +
                      `👉 *Como usar:*\n` +
                      `• *${prefix}fechargp* (Fecha o grupo agora)\n` +
                      `• *${prefix}fechargp 22:00* (Define o horário de fechamento diário)\n` +
                      `• *${prefix}fechargp off* (Desativa o fechamento automático)`
            }, { quoted: msg });
        }

        let grupoDB = await Grupo.findOne({ groupId: from });
        if (!grupoDB) {
            grupoDB = new Grupo({ groupId: from });
        }

        if (['off', 'desativar', 'cancelar', 'remover', 'rm'].includes(rawArg)) {
            grupoDB.horarioFechar = null;
            if (grupoDB.scheduleLastRun) delete grupoDB.scheduleLastRun.close;
            await grupoDB.save();
            groupCache.del(from);

            const card = buildActionCard({
                header: 'AGENDAMENTO DO GRUPO',
                headerIcon: '⏰',
                title: 'FECHAMENTO DESATIVADO',
                icon: '🛑',
                lines: [
                    `📢 *Status:* Agendamento cancelado`,
                    `👥 *Grupo:* ${groupMetadata.subject || 'Grupo'}`,
                    `👮 *Modificado por:* @${sender.split('@')[0].split(':')[0]}`
                ],
                tip: 'O grupo não será mais fechado automaticamente.'
            });

            return await conn.sendMessage(from, { text: card, mentions: [sender, rawSender].filter(Boolean) }, { quoted: msg });
        }

        const normalized = normalizeTime(rawArg);
        if (!normalized) {
            return await conn.sendMessage(from, {
                text: `❌ Horário inválido! Use: \n• *${prefix}fechargp* para fechar o grupo agora\n• *${prefix}fechargp 23:00* para agendar horário diário\n• *${prefix}fechargp off* para desativar agendamento`
            }, { quoted: msg });
        }

        grupoDB.horarioFechar = normalized;
        if (grupoDB.scheduleLastRun) delete grupoDB.scheduleLastRun.close;
        await grupoDB.save();
        groupCache.del(from);

        const card = buildActionCard({
            header: 'AGENDAMENTO DO GRUPO',
            headerIcon: '⏰',
            title: 'FECHAMENTO PROGRAMADO',
            icon: '🔒',
            lines: [
                `📢 *Status:* Ativo todos os dias`,
                `🕒 *Horário:* ${normalized} (Horário de Brasília)`,
                `👥 *Grupo:* ${groupMetadata.subject || 'Grupo'}`,
                `👮 *Modificado por:* @${sender.split('@')[0].split(':')[0]}`
            ],
            alert: !isBotAdmin(groupMetadata, conn) 
                ? 'Lembre-se de dar administrador ao bot para que ele possa fechar o grupo no horário!'
                : '',
            tip: 'Todos os dias neste horário o grupo será fechado automaticamente (apenas administradores poderão enviar mensagens).'
        });

        await conn.sendMessage(from, { text: card, mentions: [sender, rawSender].filter(Boolean) }, { quoted: msg });

    } catch (e) {
        console.error('Erro no comando fechargp:', e);
        await conn.sendMessage(from, { text: '❌ Erro ao processar o comando de fechar grupo.' }, { quoted: msg });
    }
}

module.exports = {
    name: 'fechargp',
    category: 'adm',
    description: 'Agenda o fechamento automático diário do grupo no Horário de Brasília',
    aliases,
    run
};
