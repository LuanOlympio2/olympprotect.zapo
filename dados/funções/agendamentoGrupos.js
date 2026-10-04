// creditos Olympio
const moment = require('moment-timezone');
const Grupo = require('../modelos/grupos');
const { buildActionCard } = require('./layout');
const { isBotAdmin } = require('./normalizarid');
const groupMetadataManager = require('./groupMetadataManager');

let schedulerInterval = null;

function normalizeTime(input) {
    if (!input || typeof input !== 'string') return null;
    const match = input.trim().match(/^([0-1]?[0-9]|2[0-3]):([0-5][0-9])$/);
    if (!match) return null;
    const hours = match[1].padStart(2, '0');
    const minutes = match[2];
    return `${hours}:${minutes}`;
}

function startGroupScheduler(conn) {
    if (schedulerInterval) {
        clearInterval(schedulerInterval);
    }

    schedulerInterval = setInterval(async () => {
        try {
            if (!global.botOnline) return;

            const now = moment().tz('America/Sao_Paulo');
            const horaBrasilia = now.format('HH:mm');
            const dataBrasilia = now.format('YYYY-MM-DD');

            const grupos = await Grupo.find({});
            for (const grupo of grupos) {
                if (!grupo.groupId || !grupo.groupId.endsWith('@g.us')) continue;

                if (grupo.horarioAbrir && grupo.horarioAbrir === horaBrasilia) {
                    const lastRunOpen = grupo.scheduleLastRun?.open;
                    if (lastRunOpen !== dataBrasilia) {
                        try {
                            const metadata = groupMetadataManager.get(grupo.groupId) || await conn.groupMetadata(grupo.groupId).catch(() => null);
                            if (metadata && isBotAdmin(metadata, conn)) {
                                await conn.groupSettingUpdate(grupo.groupId, 'not_announcement');

                                const card = buildActionCard({
                                    header: 'AGENDAMENTO AUTOMÁTICO',
                                    headerIcon: '⏰',
                                    title: 'GRUPO ABERTO',
                                    icon: '🔓',
                                    lines: [
                                        `📢 *Status:* Aberto para todos os membros`,
                                        `🕒 *Horário:* ${horaBrasilia} (Horário de Brasília)`,
                                        `🏛️ *Grupo:* ${metadata.subject || 'Grupo'}`
                                    ],
                                    tip: 'O grupo foi aberto automaticamente pelo agendamento diário.'
                                });

                                await conn.sendMessage(grupo.groupId, { text: card });
                                console.log(`[Schedule] ✅ Grupo ABERTO automaticamente: ${grupo.groupId} às ${horaBrasilia}`);
                            } else {
                                console.log(`[Schedule] ⚠️ Bot não é admin para abrir o grupo: ${grupo.groupId}`);
                            }
                        } catch (errOpen) {
                            console.error(`[Schedule Error] Falha ao abrir ${grupo.groupId}:`, errOpen.message || errOpen);
                        }

                        if (!grupo.scheduleLastRun) grupo.scheduleLastRun = {};
                        grupo.scheduleLastRun.open = dataBrasilia;
                        await grupo.save().catch(() => {});
                    }
                }

                if (grupo.horarioFechar && grupo.horarioFechar === horaBrasilia) {
                    const lastRunClose = grupo.scheduleLastRun?.close;
                    if (lastRunClose !== dataBrasilia) {
                        try {
                            const metadata = groupMetadataManager.get(grupo.groupId) || await conn.groupMetadata(grupo.groupId).catch(() => null);
                            if (metadata && isBotAdmin(metadata, conn)) {
                                await conn.groupSettingUpdate(grupo.groupId, 'announcement');

                                const card = buildActionCard({
                                    header: 'AGENDAMENTO AUTOMÁTICO',
                                    headerIcon: '⏰',
                                    title: 'GRUPO FECHADO',
                                    icon: '🔒',
                                    lines: [
                                        `📢 *Status:* Fechado (Apenas admins enviam)`,
                                        `🕒 *Horário:* ${horaBrasilia} (Horário de Brasília)`,
                                        `🏛️ *Grupo:* ${metadata.subject || 'Grupo'}`
                                    ],
                                    tip: 'O grupo foi fechado automaticamente pelo agendamento diário.'
                                });

                                await conn.sendMessage(grupo.groupId, { text: card });
                                console.log(`[Schedule] ✅ Grupo FECHADO automaticamente: ${grupo.groupId} às ${horaBrasilia}`);
                            } else {
                                console.log(`[Schedule] ⚠️ Bot não é admin para fechar o grupo: ${grupo.groupId}`);
                            }
                        } catch (errClose) {
                            console.error(`[Schedule Error] Falha ao fechar ${grupo.groupId}:`, errClose.message || errClose);
                        }

                        if (!grupo.scheduleLastRun) grupo.scheduleLastRun = {};
                        grupo.scheduleLastRun.close = dataBrasilia;
                        await grupo.save().catch(() => {});
                    }
                }
            }
        } catch (error) {
            console.error('[Schedule Worker Error]:', error.message || error);
        }
    }, 25 * 1000); 
}

module.exports = {
    startGroupScheduler,
    normalizeTime
};
