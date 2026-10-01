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
        if (!groupMetadata || !isUserAdmin(groupMetadata, sender)) {
            return await conn.sendMessage(from, { text: '❌ Apenas administradores podem configurar o agendamento do grupo!' }, { quoted: msg });
        }

        const rawArg = (args[0] || '').trim().toLowerCase();

        if (!rawArg) {
            let grupoDB = await Grupo.findOne({ groupId: from });
            const horarioAtual = grupoDB?.horarioFechar || 'Não configurado';
            return await conn.sendMessage(from, {
                text: `⏰ *AGENDAMENTO PARA FECHAR O GRUPO*\n\n` +
                      `📌 *Horário atual:* ${horarioAtual}\n\n` +
                      `👉 *Como usar:*\n` +
                      `• *${prefix}fechargp 22:00* (Define o horário de Brasília)\n` +
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

            return await conn.sendMessage(from, { text: card, mentions: [sender] }, { quoted: msg });
        }

        const normalized = normalizeTime(rawArg);
        if (!normalized) {
            return await conn.sendMessage(from, {
                text: `❌ Horário inválido! Use o formato de 24 horas *HH:MM* (Exemplo: *${prefix}fechargp 23:00*).`
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
            alert: !isBotAdmin(groupMetadata, conn.user?.id) 
                ? 'Lembre-se de dar administrador ao bot para que ele possa fechar o grupo no horário!'
                : '',
            tip: 'Todos os dias neste horário o grupo será fechado automaticamente (apenas administradores poderão enviar mensagens).'
        });

        await conn.sendMessage(from, { text: card, mentions: [sender] }, { quoted: msg });

    } catch (e) {
        console.error('Erro no comando fechargp:', e);
        await conn.sendMessage(from, { text: '❌ Erro ao salvar o agendamento de fechamento.' }, { quoted: msg });
    }
}

module.exports = {
    name: 'fechargp',
    category: 'adm',
    description: 'Agenda o fechamento automático diário do grupo no Horário de Brasília',
    aliases,
    run
};
