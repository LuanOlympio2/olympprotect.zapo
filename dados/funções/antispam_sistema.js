// creditos Olympio
const antispamRateMap = new Map();
const antispamRecentBans = new Map();

setInterval(() => {
    const now = Date.now();
    for (const [k, v] of antispamRecentBans.entries()) {
        if (now - v > 60000) antispamRecentBans.delete(k);
    }
    for (const [k, list] of antispamRateMap.entries()) {
        const active = list.filter(t => now - t <= 3000);
        if (active.length === 0) antispamRateMap.delete(k);
        else antispamRateMap.set(k, active);
    }
}, 30000);

async function handleAntiSpamMessage(conn, info, from, isGroup, isGroupAdmin, isOwner, isBotAdmin, isAntiSpam, sender, reply) {
    if (!isGroup || !isAntiSpam || isGroupAdmin || isOwner) return false;
    if (!sender || info?.key?.fromMe) return false;

    const rawSender = sender || info?.key?.participant || '';
    if (!rawSender) return false;
    const rawId = rawSender.split('@')[0].split(':')[0];
    const userKey = `${from}_${rawId}`;
    const now = Date.now();

    const lastBanned = antispamRecentBans.get(userKey);
    if (lastBanned && (now - lastBanned < 45000)) return true;

    let rateList = antispamRateMap.get(userKey) || [];
    rateList = rateList.filter(t => now - t <= 3000);
    rateList.push(now);
    antispamRateMap.set(userKey, rateList);

    if (rateList.length >= 6) {
        antispamRateMap.delete(userKey);
        antispamRecentBans.set(userKey, now);

        try {
            if (isBotAdmin) {
                await conn.groupSettingUpdate(from, 'announcement').catch(() => {});
                await conn.sendMessage(from, { delete: info.key }).catch(() => {});
                await conn.groupParticipantsUpdate(from, [rawSender], 'remove').catch(() => {});
                const banText = `🚫 *Anti-Spam:* @${rawId} foi banido por enviar mensagens rápido demais (limite: 6 mensagens em 3s).`;
                if (typeof reply === 'function') {
                    await reply(banText, { mentions: [rawSender] }).catch(() => {});
                } else {
                    await conn.sendMessage(from, { text: banText, mentions: [rawSender] }).catch(() => {});
                }
                setTimeout(async () => {
                    try {
                        await conn.groupSettingUpdate(from, 'not_announcement');
                    } catch (_) {}
                }, 3000);
            } else {
                const warnText = `⚠️ *Anti-Spam:* @${rawId} está enviando mensagens rápido demais, mas preciso de permissão de administrador para remover.`;
                if (typeof reply === 'function') {
                    await reply(warnText, { mentions: [rawSender] }).catch(() => {});
                } else {
                    await conn.sendMessage(from, { text: warnText, mentions: [rawSender] }).catch(() => {});
                }
            }
        } catch (err) {
            console.error('[ANTI-SPAM] Erro ao punir por excesso de mensagens:', err);
        }
        return true;
    }
    return false;
}

module.exports = {
    handleAntiSpamMessage
};
