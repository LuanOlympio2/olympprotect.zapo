// creditos Olympio
if (!globalThis.WebSocket) {
    globalThis.WebSocket = require('ws');
}
const origConsoleInfo = console.info;
console.info = (...args) => {
    if (typeof args[0] === 'string' && (args[0].includes('history sync chunk') || args[0].includes('decoded history'))) {
        return;
    }
    origConsoleInfo.apply(console, args);
};

const origConsoleLog = console.log;
console.log = (...args) => {
    if (typeof args[0] === 'string' && (args[0].includes('history sync chunk') || args[0].includes('decoded history'))) {
        return;
    }
    origConsoleLog.apply(console, args);
};

const connectToWhatsApp = require('./connect');
const cleanTempFolder = require('./cleaner');
const fs = require('fs');
const path = require('path');

const localYtdlp = path.join(__dirname, 'yt-dlp');
if (fs.existsSync(localYtdlp)) {
    try {
        fs.chmodSync(localYtdlp, 0o755);
    } catch (_) {}
}

async function startBot() {
    try {
        console.log("[INIT] Inicializando sistema OlympProtect com Zapo...");
        cleanTempFolder();
        setInterval(cleanTempFolder, 60 * 60 * 1000);
        await connectToWhatsApp();
    } catch (error) {
        console.error("[ERRO FATAL] Ocorreu um erro no index principal:", error);
    }
}

startBot();
