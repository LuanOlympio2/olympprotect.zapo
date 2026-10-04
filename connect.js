// creditos Olympio
if (!globalThis.WebSocket) {
    globalThis.WebSocket = require('ws');
}
const readline = require("readline");
const path = require('path');
let qrcode = null;
try {
    qrcode = require('qrcode-terminal');
} catch (_) {}
const { createSqliteStore } = require('@zapo-js/store-sqlite');
const { createStore, WaClient } = require('zapo-js');
const { createZapoAdapter } = require('./dados/funções/zapoCompat');
const config = require('./config.json');
const mensagensHandler = require('./dados/eventos/mensagens');
const gruposHandler = require('./dados/eventos/grupos');
const groupCache = require('./dados/funções/groupCache');
const Grupo = require('./dados/modelos/grupos');

const question = (text) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    return new Promise((resolve) => {
        rl.question(text, (ans) => {
            rl.close();
            resolve(ans);
        });
    });
};

const undecryptedBurstMap = new Map();

async function connectToWhatsApp() {
    console.log("🔄 Iniciando módulo de conexão com Zapo...");

    const sqlitePath = path.resolve(__dirname, 'auth_zapo/state.sqlite');
    let sqliteDriver = 'auto';
    try {
        const bs = require('better-sqlite3');
        new bs(':memory:').close();
        sqliteDriver = 'better-sqlite3';
    } catch (_) {
        try {
            require('node:sqlite');
            sqliteDriver = 'node';
        } catch (_) {}
    }
    const sqlite = createSqliteStore({ path: sqlitePath, driver: sqliteDriver });
    const store = createStore({
        backends: { sqlite },
        providers: {
            auth: 'sqlite',
            signal: 'sqlite',
            preKey: 'sqlite',
            session: 'sqlite',
            identity: 'sqlite',
            senderKey: 'sqlite',
            appState: 'sqlite',
            privacyToken: 'sqlite',
            messages: 'none',
            threads: 'none',
            contacts: 'none'
        }
    });

    const client = new WaClient({
        sessionId: 'olympprotect',
        store
    });

    const conn = createZapoAdapter(client);
    global.botConn = conn;

    const state = client.getState();
    const isRegistered = Boolean(state.registered || client.getCredentials()?.meJid);

    let usePairing = false;
    let phoneNumber = (config.phoneNumber || config.pairingNumber || '').replace(/[^0-9]/g, '');

    if (!isRegistered) {
        if (phoneNumber) {
            usePairing = true;
        } else {
            const choice = await question("Como deseja conectar?\n1. QR Code\n2. Código de Pareamento\n> ");
            if (choice.trim() === '2') {
                usePairing = true;
                phoneNumber = await question("Digite o número com DDD (ex: 551199999999): ");
                phoneNumber = phoneNumber.replace(/[^0-9]/g, "");
            }
        }
    }

    client.on('auth_qr', ({ qr }) => {
        if (!usePairing) {
            if (qrcode) {
                console.log("\n📲 Escaneie o QR Code abaixo para conectar:");
                qrcode.generate(qr, { small: true });
            } else {
                console.log("\n📲 QR Code disponível no socket.");
                console.log("ℹ️ Para renderizar o QR gráfico no terminal, instale: npm install qrcode-terminal");
            }
        }
    });

    client.on('auth_pairing_code', ({ code }) => {
        console.log(`\n========================================`);
        console.log(`🔑 CÓDIGO DE PAREAMENTO: ${code}`);
        console.log(`========================================\n`);
    });

    client.on('connection', async (event) => {
        if (event.status === 'open') {
            console.log("✅ Conectado com sucesso ao WhatsApp via Zapo!");
            conn.ev.emit('connection.update', { connection: 'open' });
        } else if (event.status === 'connecting') {
            console.log("🔄 Conectando ao WhatsApp via Zapo...");
            conn.ev.emit('connection.update', { connection: 'connecting' });
        } else if (event.status === 'close') {
            console.log("⚠️ Conexão fechada:", event.reason || "Desconectado");
            conn.ev.emit('connection.update', { connection: 'close' });
            setTimeout(() => {
                client.connect().catch(err => console.error("Erro ao reconectar Zapo:", err));
            }, 3000);
        }
    });

    client.on('message', async (event) => {
        try {
            const from = event.key?.remoteJid;
            const msg = {
                key: event.key,
                message: event.message,
                pushName: event.pushName || '',
                messageTimestamp: event.timestampSeconds || Math.floor(Date.now() / 1000)
            };

            if (!msg.message) {
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
                return;
            }

            await mensagensHandler(conn, { messages: [msg], type: 'notify' }, config);
        } catch (e) {
            console.error("Erro no processamento de mensagem:", e);
        }
    });

    client.on('group', async (event) => {
        try {
            if (['add', 'remove', 'promote', 'demote'].includes(event.action)) {
                const participants = (event.participants || []).map(p => p.jid || p.phoneJid || p.lidJid).filter(Boolean);
                const evPayload = {
                    id: event.groupJid,
                    participants,
                    action: event.action,
                    author: event.authorJid
                };
                conn.ev.emit('group-participants.update', evPayload);
                await gruposHandler(conn, evPayload, config);
            }
        } catch (e) {
            console.error("Erro no manipulador de grupo:", e);
        }
    });

    await client.connect();

    if (!isRegistered && usePairing && phoneNumber) {
        setTimeout(async () => {
            try {
                const code = await client.auth.requestPairingCode(phoneNumber);
                if (code) {
                    console.log(`\n========================================`);
                    console.log(`🔑 CÓDIGO DE PAREAMENTO: ${code}`);
                    console.log(`========================================\n`);
                }
            } catch (err) {
                console.error("Erro ao solicitar código de pareamento no Zapo:", err);
            }
        }, 3000);
    }

    return conn;
}

module.exports = connectToWhatsApp;
