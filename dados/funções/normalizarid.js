// creditos Olympio
const path = require('path');
const fs = require('fs');
const lidCache = require('./lidCache');

function normalizeId(id) {
    if (!id) return null;
    if (typeof id !== 'string') return null;
    let normalized = id.split('@')[0]; 
    normalized = normalized.split(':')[0]; 
    return normalized;
}

function compareIds(id1, id2) {
    if (!id1 || !id2) return false;
    return normalizeId(id1) === normalizeId(id2);
}

function getBotIds(conn = null) {
    const ids = new Set();
    const activeConn = conn || global.botConn;
    if (activeConn?.user) {
        if (activeConn.user.id) ids.add(normalizeId(activeConn.user.id));
        if (activeConn.user.lid) ids.add(normalizeId(activeConn.user.lid));
    }
    if (activeConn?.id) ids.add(normalizeId(activeConn.id));
    if (activeConn?.lid) ids.add(normalizeId(activeConn.lid));

    try {
        const config = require('../../config.json');
        if (config.botNumber) ids.add(normalizeId(config.botNumber));
        if (config.botLid) ids.add(normalizeId(config.botLid));
    } catch (_) {}

    try {
        const credsPath = path.resolve(__dirname, '../../auth_info_baileys/creds.json');
        if (fs.existsSync(credsPath)) {
            const creds = JSON.parse(fs.readFileSync(credsPath, 'utf8'));
            if (creds?.me?.id) ids.add(normalizeId(creds.me.id));
            if (creds?.me?.lid) ids.add(normalizeId(creds.me.lid));
        }
    } catch (_) {}

    return ids;
}

function isBotNumber(userId, conn = null) {
    if (!userId) return false;
    const norm = normalizeId(userId);
    if (!norm) return false;
    const botIds = getBotIds(conn);
    if (botIds.has(norm)) return true;
    const jid = normalizeId(lidCache.getJid(userId));
    if (jid && botIds.has(jid)) return true;
    const lid = normalizeId(lidCache.getLid(userId));
    if (lid && botIds.has(lid)) return true;
    return false;
}

function getOwnerIds() {
    const ids = new Set();
    try {
        const config = require('../../config.json');
        if (config.ownerNumber) ids.add(normalizeId(config.ownerNumber));
        if (config.ownerlid) ids.add(normalizeId(config.ownerlid));
    } catch (_) {}
    return ids;
}

function isOwnerNumber(userId) {
    if (!userId) return false;
    const norm = normalizeId(userId);
    if (!norm) return false;
    const ownerIds = getOwnerIds();
    if (ownerIds.has(norm)) return true;
    const jid = normalizeId(lidCache.getJid(userId));
    if (jid && ownerIds.has(jid)) return true;
    const lid = normalizeId(lidCache.getLid(userId));
    if (lid && ownerIds.has(lid)) return true;
    return false;
}

function findParticipant(participants, targetId) {
    if (!targetId || !participants || !Array.isArray(participants)) return null;

    const normTarget = normalizeId(targetId);
    const cachedJid = normalizeId(lidCache.getJid(targetId));
    const cachedLid = normalizeId(lidCache.getLid(targetId));

    const targets = new Set([normTarget, cachedJid, cachedLid].filter(Boolean));

    const found = participants.find(p => {
        const pId = normalizeId(p.id);
        const pLid = p.lid ? normalizeId(p.lid) : null;
        const pJid = normalizeId(lidCache.getJid(p.id));
        const pLidFromCache = normalizeId(lidCache.getLid(p.id));

        return targets.has(pId) || 
               (pLid && targets.has(pLid)) || 
               (pJid && targets.has(pJid)) || 
               (pLidFromCache && targets.has(pLidFromCache));
    });

    if (found) {
        const phone = found.phoneNumber || (!found.id?.includes('@lid') ? found.id : null);
        const lid = found.lid || (found.id?.includes('@lid') ? found.id : null);
        if (phone && lid) {
            const cleanPhone = phone.includes('@') ? phone : `${phone}@s.whatsapp.net`;
            lidCache.set(cleanPhone, lid);
        }
        return found;
    }

    if (participants.length === 2 && String(targetId).includes('@lid')) {
        const other = participants.find(p => p.id && !p.id.includes(':'));
        if (other) {
            lidCache.set(other.id, targetId);
            return other;
        }
    }
    return null;
}

function isParticipantAdmin(groupMetadata, userId) {
    if (!groupMetadata || !userId || !groupMetadata.participants) return false;
    const participant = findParticipant(groupMetadata.participants, userId);
    if (!participant) return false;
    return participant.admin === 'admin' || participant.admin === 'superadmin';
}

function isUserAdmin(groupMetadata, userId, conn = null) {
    if (!userId) return false;
    if (isBotNumber(userId, conn)) return true;
    if (isOwnerNumber(userId)) return true;
    return isParticipantAdmin(groupMetadata, userId);
}

function isBotAdmin(groupMetadata, botIdOrConn) {
    if (!groupMetadata || !groupMetadata.participants) return false;

    const idsToCheck = new Set();

    if (botIdOrConn && typeof botIdOrConn === 'object') {
        if (botIdOrConn.user) {
            if (botIdOrConn.user.id) idsToCheck.add(botIdOrConn.user.id);
            if (botIdOrConn.user.lid) idsToCheck.add(botIdOrConn.user.lid);
        }
        if (botIdOrConn.id) idsToCheck.add(botIdOrConn.id);
        if (botIdOrConn.lid) idsToCheck.add(botIdOrConn.lid);
    } else if (typeof botIdOrConn === 'string') {
        idsToCheck.add(botIdOrConn);
    }

    const botIds = getBotIds(botIdOrConn);
    for (const bId of botIds) {
        idsToCheck.add(bId);
    }

    for (const id of idsToCheck) {
        if (isParticipantAdmin(groupMetadata, id)) return true;
        const lid = lidCache.getLid(id);
        if (lid && isParticipantAdmin(groupMetadata, lid)) return true;
        const jid = lidCache.getJid(id);
        if (jid && isParticipantAdmin(groupMetadata, jid)) return true;
    }

    return false;
}

function cleanDeviceJid(id) {
    if (!id || typeof id !== 'string') return '';
    const isLid = id.includes('@lid');
    const base = id.split('@')[0].split(':')[0];
    return base + (isLid ? '@lid' : '@s.whatsapp.net');
}

function resolveToPhoneJid(userId, participants = []) {
    if (!userId || typeof userId !== 'string') return '';
    const cleaned = cleanDeviceJid(userId);
    if (cleaned.endsWith('@s.whatsapp.net')) {
        return cleaned;
    }
    const fromCache = lidCache.getJid(cleaned);
    if (fromCache && fromCache.endsWith('@s.whatsapp.net')) {
        return cleanDeviceJid(fromCache);
    }
    if (Array.isArray(participants) && participants.length > 0) {
        const normTarget = normalizeId(cleaned);
        const pMatch = participants.find(p => {
            const pIdNorm = normalizeId(p.id);
            const pLidNorm = p.lid ? normalizeId(p.lid) : null;
            return pIdNorm === normTarget || (pLidNorm && pLidNorm === normTarget);
        });
        if (pMatch) {
            const phone = pMatch.phoneNumber || (!pMatch.id?.includes('@lid') ? pMatch.id : null);
            if (phone) {
                const phoneJid = cleanDeviceJid(phone.includes('@') ? phone : `${phone}@s.whatsapp.net`);
                lidCache.set(phoneJid, cleaned);
                return phoneJid;
            }
        }
    }
    return cleaned;
}

function formatUserTag(userId, participants = []) {
    const resolved = resolveToPhoneJid(userId, participants);
    const num = resolved.split('@')[0].split(':')[0];
    return `@${num}`;
}

function getMentionJids(userId, participants = []) {
    const phoneJid = resolveToPhoneJid(userId, participants);
    const cleanId = cleanDeviceJid(userId);
    const set = new Set();
    if (phoneJid && phoneJid.endsWith('@s.whatsapp.net')) set.add(phoneJid);
    if (cleanId) set.add(cleanId);
    return Array.from(set);
}

module.exports = {
    normalizeId,
    compareIds,
    findParticipant,
    isParticipantAdmin,
    isUserAdmin,
    isBotAdmin,
    isBotNumber,
    isOwnerNumber,
    getBotIds,
    cleanDeviceJid,
    resolveToPhoneJid,
    formatUserTag,
    getMentionJids
};
