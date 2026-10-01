// creditos Olympio
const JSONDatabase = require('../funções/jsonDB');
const defaultValues = {
    antipv: true,
    savedDivMessage: '',
    blockedUsers: [],
    rentMode: false
};
const BotConfigModel = JSONDatabase.model('bot_config.json');
class BotConfig extends BotConfigModel {
    constructor(data) {
        const fullData = { ...defaultValues, ...data };
        super(fullData);
    }
}
module.exports = BotConfig;
