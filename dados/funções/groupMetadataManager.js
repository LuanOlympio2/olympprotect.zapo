// creditos Olympio
const fs = require('fs-extra');
const path = require('path');

const CACHE_FILE = path.join(__dirname, '..', '..', 'dados', 'cache_grupos.json');
const memoryMap = new Map();

function loadCacheFromDisk() {
    try {
        if (fs.existsSync(CACHE_FILE)) {
            const data = fs.readJsonSync(CACHE_FILE);
            if (data && typeof data === 'object') {
                for (const [jid, meta] of Object.entries(data)) {
                    if (meta && Array.isArray(meta.participants) && meta.participants.length > 0) {
                        memoryMap.set(jid, meta);
                    }
                }
            }
        }
    } catch (_) {}
}

loadCacheFromDisk();

let saveTimeout = null;
function persistToDisk() {
    if (saveTimeout) clearTimeout(saveTimeout);
    saveTimeout = setTimeout(async () => {
        try {
            const obj = {};
            for (const [jid, meta] of memoryMap.entries()) {
                obj[jid] = meta;
            }
            await fs.writeJson(CACHE_FILE, obj, { spaces: 2 });
        } catch (_) {}
    }, 2000);
}

function get(jid) {
    if (!jid) return null;
    return memoryMap.get(jid) || null;
}

function set(jid, metadata) {
    if (!jid || !metadata) return;
    if (Array.isArray(metadata.participants) && metadata.participants.length > 0) {
        memoryMap.set(jid, metadata);
        persistToDisk();
    }
}

function updateParticipants(jid, participants, action) {
    if (!jid || !Array.isArray(participants) || !action) return;
    const meta = memoryMap.get(jid);
    if (!meta) return;
    if (!Array.isArray(meta.participants)) meta.participants = [];
    
    if (action === 'add') {
        for (const p of participants) {
            const id = typeof p === 'string' ? p : p.id;
            if (!meta.participants.some(x => (x.id || x) === id)) {
                meta.participants.push({ id, admin: null });
            }
        }
    } else if (action === 'remove') {
        const setRemove = new Set(participants.map(p => typeof p === 'string' ? p : p.id));
        meta.participants = meta.participants.filter(x => !setRemove.has(x.id || x));
    } else if (action === 'promote') {
        const setPromote = new Set(participants.map(p => typeof p === 'string' ? p : p.id));
        for (const x of meta.participants) {
            if (setPromote.has(x.id || x)) {
                x.admin = 'admin';
            }
        }
    } else if (action === 'demote') {
        const setDemote = new Set(participants.map(p => typeof p === 'string' ? p : p.id));
        for (const x of meta.participants) {
            if (setDemote.has(x.id || x)) {
                x.admin = null;
            }
        }
    }
    memoryMap.set(jid, meta);
    persistToDisk();
}

async function syncAllGroups(conn) {
    if (!conn || typeof conn.groupFetchAllParticipating !== 'function') return;
    try {
        const allGroups = await conn.groupFetchAllParticipating();
        if (allGroups && typeof allGroups === 'object') {
            for (const [id, meta] of Object.entries(allGroups)) {
                if (meta && Array.isArray(meta.participants) && meta.participants.length > 0) {
                    memoryMap.set(id, meta);
                    if (conn.store && conn.store.groupMetadata) {
                        conn.store.groupMetadata[id] = meta;
                    }
                }
            }
            persistToDisk();
        }
    } catch (_) {}
}

async function getCachedGroupMetadata(jid, conn) {
    if (!jid) return undefined;
    const cached = memoryMap.get(jid);
    if (cached && Array.isArray(cached.participants) && cached.participants.length > 0) {
        return cached;
    }
    if (conn && conn.store && conn.store.groupMetadata && conn.store.groupMetadata[jid]) {
        const sMeta = conn.store.groupMetadata[jid];
        if (Array.isArray(sMeta.participants) && sMeta.participants.length > 0) {
            memoryMap.set(jid, sMeta);
            return sMeta;
        }
    }
    if (conn && typeof conn.groupMetadata === 'function') {
        try {
            const fetchPromise = conn.groupMetadata(jid);
            const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 3500));
            const fresh = await Promise.race([fetchPromise, timeoutPromise]);
            if (fresh && Array.isArray(fresh.participants) && fresh.participants.length > 0) {
                set(jid, fresh);
                if (conn.store && conn.store.groupMetadata) {
                    conn.store.groupMetadata[jid] = fresh;
                }
                return fresh;
            }
        } catch (_) {}
    }
    return undefined;
}

module.exports = {
    get,
    set,
    updateParticipants,
    syncAllGroups,
    getCachedGroupMetadata
};
