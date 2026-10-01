// creditos Olympio
const BotConfig = require('../modelos/BotConfig');
async function loadDivulgacao() {
    const config = await BotConfig.findOne();
    return {
        savedMessage: config?.savedDivMessage || ''
    };
}
async function saveDivulgacao(data = {}) {
    try {
        let config = await BotConfig.findOne();
        if (!config) {
            config = new BotConfig();
        }
        config.savedDivMessage = data.savedMessage || '';
        await config.save();
        return true;
    } catch (error) {
        console.error('Erro ao salvar divulgacao:', error);
        return false;
    }
}
module.exports = {
    loadDivulgacao,
    saveDivulgacao
};
