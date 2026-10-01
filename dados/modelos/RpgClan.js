// creditos Olympio
const JSONDatabase = require('../funções/jsonDB');

const defaultValues = {
    clanId: '',
    nome: 'Clã Sem Nome',
    lider: '',
    membros: [],
    nivel: 1,
    cofre: 0,
    vitoriasGuerra: 0,
    descricao: 'Um clã destemido do Olimpo.'
};

const RpgClanModel = JSONDatabase.model('rpg_clans.json');

class RpgClan extends RpgClanModel {
    constructor(data) {
        const fullData = {
            ...defaultValues,
            ...data,
            membros: (data?.membros || []).slice()
        };
        super(fullData);
    }
}

module.exports = RpgClan;
