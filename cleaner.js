// creditos Olympio
const fs = require('fs-extra');
const path = require('path');
const tempDir = path.join(__dirname, 'temp');
async function cleanTempFolder() {
    try {
        console.log(`[CLEANER] Iniciando limpeza da pasta temp...`);
        await fs.ensureDir(tempDir);
        await fs.emptyDir(tempDir);
        console.log(`[CLEANER] Pasta temp limpa com sucesso.`);
    } catch (error) {
        console.error(`[CLEANER] Erro ao limpar pasta temp:`, error);
    }
}
module.exports = cleanTempFolder;
