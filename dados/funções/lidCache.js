// creditos Olympio
const fs = require('fs-extra');
const path = require('path');
const CACHE_PATH = path.resolve(__dirname, '../cache/jid_lid_mapping.json');
let memoryCache = new Map();
let reverseCache = new Map();
let cacheMetadata = {
    version: '1.0',
    lastUpdate: null,
    totalEntries: 0
};
let saveTimer = null;

function loadCache() {
    try {
        if (fs.existsSync(CACHE_PATH)) {
            const data = fs.readJsonSync(CACHE_PATH);
            const mappings = data.mappings || {};
            memoryCache = new Map(Object.entries(mappings));
            reverseCache = new Map();
            for (const [jid, lid] of memoryCache.entries()) {
                reverseCache.set(lid, jid);
            }
            cacheMetadata = {
                version: data.version || '1.0',
                lastUpdate: data.lastUpdate || null,
                totalEntries: memoryCache.size
            };
            console.log(`✅ Cache JID→LID carregado: ${memoryCache.size} entradas`);
        } else {
            fs.ensureFileSync(CACHE_PATH);
            saveCache();
        }
    } catch (e) {
        console.error("❌ Erro ao carregar cache LID:", e);
    }
}

function scheduleSave() {
    if (saveTimer) return;
    saveTimer = setTimeout(() => {
        saveTimer = null;
        saveCache();
    }, 2000);
}

function saveCache() {
    try {
        const data = {
            version: cacheMetadata.version,
            lastUpdate: new Date().toISOString(),
            totalEntries: memoryCache.size,
            mappings: Object.fromEntries(memoryCache)
        };
        fs.writeJson(CACHE_PATH, data, { spaces: 2 }).catch(() => {});
    } catch (e) {
        console.error("❌ Erro ao salvar cache LID:", e);
    }
}

function normalizeId(id) {
    if (!id || typeof id !== 'string') return id;
    const isLid = id.includes('@lid');
    const base = id.split('@')[0].split(':')[0];
    return base + (isLid ? '@lid' : '@s.whatsapp.net');
}

function set(jid, lid) {
    if (!jid || !lid) return;
    const cleanJid = normalizeId(jid);
    const cleanLid = normalizeId(lid);
    const finalJid = cleanJid.includes('@s.whatsapp.net') ? cleanJid : cleanJid.split('@')[0] + '@s.whatsapp.net';
    const finalLid = cleanLid.includes('@lid') ? cleanLid : cleanLid.split('@')[0] + '@lid';
    if (memoryCache.get(finalJid) !== finalLid) {
        memoryCache.set(finalJid, finalLid);
        reverseCache.set(finalLid, finalJid);
        cacheMetadata.totalEntries = memoryCache.size;
        scheduleSave();
    }
}

function getLid(jid) {
    if (!jid) return null;
    const cleanJid = normalizeId(jid);
    const finalJid = cleanJid.includes('@s.whatsapp.net') ? cleanJid : cleanJid.split('@')[0] + '@s.whatsapp.net';
    return memoryCache.get(finalJid) || null;
}

function getJid(lid) {
    if (!lid) return null;
    const cleanLid = normalizeId(lid);
    const finalLid = cleanLid.includes('@lid') ? cleanLid : cleanLid.split('@')[0] + '@lid';
    const cached = reverseCache.get(finalLid);
    if (cached) return cached;
    for (const [jid, cLid] of memoryCache.entries()) {
        if (cLid === finalLid) {
            reverseCache.set(finalLid, jid);
            return jid;
        }
    }
    return null;
}

async function getLidWithFallback(conn, jid) {
    if (!jid || typeof jid !== 'string') return jid;
    if (jid.includes('@lid')) {
        return normalizeId(jid);
    }
    const cachedLid = getLid(jid);
    if (cachedLid) {
        return cachedLid;
    }
    try {
        const cleanJid = normalizeId(jid);
        const result = await conn.onWhatsApp(cleanJid);
        if (result && result[0] && result[0].lid) {
            let lid = result[0].lid;
            lid = normalizeId(lid);
            set(cleanJid, lid);
            return lid;
        }
    } catch (error) {
        console.warn(`⚠️ Erro ao buscar LID para ${jid}: ${error.message}`);
    }
    return jid;
}
function idsMatch(id1, id2) {
    if (!id1 || !id2) return false;
    const clean1 = normalizeId(id1);
    const clean2 = normalizeId(id2);
    const base1 = clean1.split('@')[0];
    const base2 = clean2.split('@')[0];
    return base1 === base2;
}
function forceSync() {
    saveCache();
}
function getStats() {
    return {
        ...cacheMetadata,
        totalEntries: memoryCache.size
    };
}
loadCache();
module.exports = {
    set,
    getLid,
    getJid,
    getLidWithFallback,
    idsMatch,
    normalizeId,
    forceSync,
    getStats
};
