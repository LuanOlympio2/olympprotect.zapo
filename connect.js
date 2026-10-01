// creditos Olympio
const {
    default: makeWASocket,
    useMultiFileAuthState,
    fetchLatestBaileysVersion,
    DisconnectReason,
    makeCacheableSignalKeyStore,
    makeInMemoryStore,
    getContentType
} = require('baileys');
const pino = require('pino');
const readline = require("readline");
const fs = require('fs-extra');
const NodeCache = require('node-cache');
const path = require('path');
const { boom } = require('@hapi/boom');
const config = require('./config.json');
const mensagensHandler = require('./dados/eventos/mensagens');
const gruposHandler = require('./dados/eventos/grupos');
const groupCache = require('./dados/funções/groupCache');
const groupMetadataManager = require('./dados/funções/groupMetadataManager');
const lidCache = require('./dados/funções/lidCache');
const { createInspectorLogger, attachTrafficInspector, inspectUpsert } = require('./dados/funções/trafficInspector');
const inspectorLogPath = path.join(__dirname, 'dados/logs/traffic_inspector.log');
const inspectorLogger = createInspectorLogger(inspectorLogPath);
const Grupo = require('./dados/modelos/grupos');
const undecryptedBurstMap = new Map();
setInterval(() => {
    const now = Date.now();
    for (const [k, list] of undecryptedBurstMap.entries()) {
        const active = list.filter(t => now - t < 5000);
        if (active.length === 0) undecryptedBurstMap.delete(k);
        else undecryptedBurstMap.set(k, active);
    }
}, 30000);
const SESSION_DIR = "./auth_info_baileys";
const msgRetryCounterCache = new NodeCache();
const store = makeInMemoryStore({ logger: pino().child({ level: 'silent', stream: 'store' }) });
try {
    store?.readFromFile('./baileys_store_multi.json');
} catch (_) {}
setInterval(() => {
    try {
        if (store?.messages) {
            for (const [jid, msgList] of Object.entries(store.messages)) {
                if (Array.isArray(msgList?.array) && msgList.array.length > 50) {
                    msgList.array = msgList.array.slice(-50);
                } else if (Array.isArray(msgList) && msgList.length > 50) {
                    store.messages[jid] = msgList.slice(-50);
                }
            }
        }
        store?.writeToFile('./baileys_store_multi.json');
    } catch (_) {}
}, 120_000);
const question = (text) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    return new Promise((resolve) => {
        rl.question(text, (answer) => {
            rl.close();
            resolve(answer);
        });
    });
};
async function connectToWhatsApp() {
    console.log("🔄 Iniciando módulo de conexão...");
    const { state, saveCreds } = await useMultiFileAuthState(SESSION_DIR);
    const { version } = await fetchLatestBaileysVersion();
    console.log(`📱 Usando baileys v${version.join('.')}`);
    let useQR = false;
    let phoneNumber = null;
    const isRegistered = Boolean(state.creds.registered || state.creds.me?.id);
    if (!isRegistered) {
        const choice = await question("Como deseja conectar?\n1. QR Code\n2. Código de Pareamento\n> ");
        if (choice.trim() === '1') {
            useQR = true;
        } else {
            phoneNumber = await question("Digite o número (ex: 551199999999): ");
            phoneNumber = phoneNumber.replace(/[^0-9]/g, "");
        }
    }
    const conn = makeWASocket({
        version,
        logger: inspectorLogger,
        printQRInTerminal: useQR,
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "silent" }).child({ level: "fatal" })),
        },
        browser: ["Ubuntu", "Chrome", "20.0.04"],
        msgRetryCounterCache,
        maxMsgRetryCount: 1,
        retryRequestDelayMs: 2500,
        markOnlineOnConnect: false,
        syncFullHistory: false,
        generateHighQualityLinkPreview: true,
        cachedGroupMetadata: async (jid) => {
            return await groupMetadataManager.getCachedGroupMetadata(jid, conn);
        },
        getMessage: async (key) => {
            if (key.remoteJid?.endsWith('@g.us')) {
                return undefined;
            }
            if (store) {
                const msg = await store.loadMessage(key.remoteJid, key.id);
                return msg?.message || undefined;
            }
            return undefined;
        }
    });
    store.bind(conn.ev);
    conn.store = store;
    global.botConn = conn;
    attachTrafficInspector(conn, inspectorLogPath);
    conn.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;
        if (connection === 'open') {
            console.log(`✅ [CONECTADO] ${config.botName || 'Bot'} está online!`);
            global.botOnline = true;
            if (state.creds.me?.id && state.creds.me?.lid) {
                lidCache.set(state.creds.me.id, state.creds.me.lid);
            }
            if (!state.creds.registered && state.creds.me?.id) {
                state.creds.registered = true;
                await saveCreds();
            }
            groupMetadataManager.syncAllGroups(conn).catch(() => {});
            try {
                const { startGroupScheduler } = require('./dados/funções/agendamentoGrupos');
                startGroupScheduler(conn);
            } catch (errSched) {
                console.error('Erro ao iniciar agendamento de grupos:', errSched);
            }
            try {
                const lembreteManager = require('./dados/funções/lembreteManager');
                lembreteManager.init(conn);
            } catch (errLemb) {
                console.error('Erro ao inicializar gerenciador de lembretes:', errLemb);
            }
        }
        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect.error)?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log(`❌ Conexão caiu. Motivo:`, lastDisconnect?.error?.message || lastDisconnect?.error);
            console.log(`❌ Reconectando: ${shouldReconnect}`);
            if (shouldReconnect) {
                connectToWhatsApp();
            } else {
                console.log("⛔ Desconectado permanentemente. Apague a pasta 'auth_info_baileys' e reinicie.");
                process.exit(1);
            }
        }
    });
    conn.ev.on('creds.update', saveCreds);
    if (!isRegistered && !useQR && phoneNumber) {
        console.log("⚠️ Sessão não registrada. Usando Código de Pareamento.");
        setTimeout(async () => {
            try {
                console.log("🚀 Solicitando código de pareamento...");
                const code = await conn.requestPairingCode(phoneNumber);
                if (code) {
                    console.log(`🔑 Código de Pareamento: ${code.match(/.{1,4}/g).join("-")}`);
                } else {
                    console.error("❌ Erro: O código retornado foi indefinido ou vazio.");
                }
            } catch (error) {
                console.error("❌ Falha ao solicitar código de pareamento:", error?.message || error);
            }
        }, 3000);
    }
    conn.ev.on('groups.update', async (updates) => {
        for (const update of updates) {
            if (update && update.id) {
                const current = groupMetadataManager.get(update.id) || {};
                groupMetadataManager.set(update.id, { ...current, ...update });
            }
        }
    });
    conn.ev.on('group-participants.update', async (event) => {
        try {
            if (event && event.id && event.participants && event.action) {
                groupMetadataManager.updateParticipants(event.id, event.participants, event.action);
            }
            await gruposHandler(conn, event, config);
        } catch (e) {
            console.error("❌ Erro no handler de grupos:", e);
        }
    });
    conn.ev.on('messages.upsert', async (m) => {
        inspectUpsert(m, inspectorLogPath);
        const { messages, type } = m;
        if (type !== 'notify') return;
        for (const msg of messages) {
            if (!msg.message || msg.messageStubType === 2) {
                const from = msg.key?.remoteJid;
                if (from && from.endsWith('@g.us') && !msg.key?.fromMe) {
                    const participant = msg.key?.participant || msg.participant;
                    if (participant) {
                        try {
                            const cached = groupCache.get(from);
                            const grupoConfig = cached?.config || await Grupo.findOne({ groupId: from }).catch(() => null);
                            if (grupoConfig && (grupoConfig.antipg || grupoConfig.antispam || grupoConfig.antiflood?.enabled)) {
                                conn.sendMessage(from, {
                                    delete: {
                                        remoteJid: from,
                                        fromMe: false,
                                        id: msg.key.id,
                                        participant: participant
                                    }
                                }).catch(() => {});
                                const burstKey = `${from}:${participant}`;
                                let burst = undecryptedBurstMap.get(burstKey) || [];
                                const now = Date.now();
                                burst = burst.filter(t => now - t < 5000);
                                burst.push(now);
                                undecryptedBurstMap.set(burstKey, burst);
                                if (burst.length >= 3) {
                                    undecryptedBurstMap.delete(burstKey);
                                    await conn.groupParticipantsUpdate(from, [participant], 'remove').catch(() => {});
                                    const rawId = String(participant).split('@')[0].split(':')[0];
                                    await conn.sendMessage(from, {
                                        text: `🚫 *Proteção:* @${rawId} foi banido por enviar mensagens invisíveis / pacotes criptografados em rajada.`,
                                        mentions: [participant]
                                    }).catch(() => {});
                                }
                            }
                        } catch (_) {}
                    }
                }
                continue;
            }
            await mensagensHandler(conn, { messages: [msg], type: 'notify' }, config);
        }
    });
    return conn;
}
module.exports = connectToWhatsApp;
