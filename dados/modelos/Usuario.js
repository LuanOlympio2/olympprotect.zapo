// creditos Olympio
const JSONDatabase = require('../funções/jsonDB');
const defaultValues = {
    nome: 'Usuário',
    comandosUsados: 0,
    mensagensEnviadas: 0,
    figurinhasEnviadas: 0,
    ultimaMensagem: Date.now(),
    vip: false,
    afkSince: null,
    afkReason: ''
};
const UsuarioModel = JSONDatabase.model('usuarios.json');
class Usuario extends UsuarioModel {
    constructor(data) {
        const fullData = { ...defaultValues, ...data };
        super(fullData);
    }
}
module.exports = Usuario;
