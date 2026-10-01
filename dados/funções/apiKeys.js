// creditos Olympio
const fs = require('fs');
const path = require('path');
const APIS_PATH = path.resolve(process.cwd(), 'apis.json');
function loadApiKeys() {
    try {
        if (!fs.existsSync(APIS_PATH)) {
            return {};
        }
        return JSON.parse(fs.readFileSync(APIS_PATH, 'utf8'));
    } catch (error) {
        console.error('Erro ao ler apis.json:', error);
        return {};
    }
}
function getApiKey(provider) {
    const keys = loadApiKeys();
    return keys?.[provider] || '';
}
module.exports = {
    loadApiKeys,
    getApiKey
};
