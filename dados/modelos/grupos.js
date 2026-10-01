// creditos Olympio
const JSONDatabase = require('../funções/jsonDB');
const defaultValues = {
    bemVindoAtivo: false,
    legendaBemVindo: 'Olá #numero#, seja bem-vindo ao grupo #grupo#!',
    antifake: false,
    antivisu: false,
    antilink: false,
    antilinkNormal: false,
    antidoc: false,
    antistatus: false,
    antifig: false,
    antiaudio: false,
    antibtn: false,
    antiloc: false,
    soadm: false,
    antifoto: false,
    anticatalogo: false,
    anticard: false,
    antivideo: false,
    antimarcacao: false,
    donos: [],
    groupOwnerId: null,
    antinuke: false,
    autobaixar: false,
    modorpg: false,
    advertencias: [],
    listaNegra: [],
    dataAtualizacao: Date.now(),
    x9: false,
    bangp: false,
    blockedCommands: [],
    antiflood: {
        enabled: false,
        maxMessages: 5,
        intervalSeconds: 2
    },
    memberActivity: [],
    fundoBv: null,
    saidaAtivo: false,
    legendaSaida: 'Adeus #numero#, você saiu do grupo #grupo#!',
    fundoSaida: null,
    antipg: false,
    antispam: false,
    autotranscrever: false,
    autofig: false,
    horarioAbrir: null,
    horarioFechar: null,
    scheduleLastRun: null,
    modobrincadeira: false
};
const GrupoModel = JSONDatabase.model('grupos.json');
class Grupo extends GrupoModel {
    constructor(data) {
        const fullData = { ...defaultValues, ...data };
        super(fullData);
    }
}
module.exports = Grupo;
