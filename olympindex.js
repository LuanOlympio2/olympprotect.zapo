// creditos Olympio
const patchBaileys = require('./dados/funções/patchBaileys');
patchBaileys();
const connectToWhatsApp = require('./connect');
const cleanTempFolder = require('./cleaner');
async function startBot() {
    try {
        console.log("[INIT] Inicializando sistema...");
        patchBaileys();
        cleanTempFolder();
        setInterval(cleanTempFolder, 60 * 60 * 1000);
        await connectToWhatsApp();
    } catch (error) {
        console.error("[ERRO FATAL] Ocorreu um erro no index principal:", error);
    }
}
startBot();
