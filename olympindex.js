// creditos Olympio
if (!globalThis.WebSocket) {
    globalThis.WebSocket = require('ws');
}
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
