// creditos Olympio
const JSONDatabase = require('../funções/jsonDB');

const defaultValues = {
    nome: 'Aventureiro',
    nivel: 1,
    xp: 0,
    ouro: 100,
    ouroBanco: 0,
    hp: 100,
    hpMax: 100,
    mp: 50,
    mpMax: 50,
    estamina: 100,
    estaminaMax: 100,
    ultimaRegenEstamina: Date.now(),
    pontosAtributo: 0,
    ataque: 10,
    defesa: 5,
    karma: 0,
    presoAte: null,
    cofres: 0,
    relacionamento: {
        status: 'solteiro', 
        parceiro: null,
        parceiroNome: null,
        inicioNamoro: 0,
        inicioCasamento: 0,
        anel: null,
        filhos: [],
        traicoesCometidas: 0,
        traicoesSofridas: 0,
        historicoTraicoes: []
    },
    conquistas: [],
    estatisticas: {
        mineriosMinerados: 0,
        plantasColhidas: 0,
        pratosCozinhados: 0,
        pocoesCriadas: 0,
        monstrosDerrotados: 0,
        peixesPescados: 0,
        crimesCometidos: 0,
        roubosRealizados: 0
    },
    classe: 'Aventureiro',
    emprego: 'desempregado',
    ultimoTrabalho: 0,
    localizacao: 'vila_iniciantes',
    clanId: null,
    petAtivo: null,
    petsPossuidos: [],
    equipamentos: {
        arma: null,
        escudo: null,
        armadura: null,
        picareta: 'picareta_madeira'
    },
    inventario: {},
    sementes: {},
    fazenda: {
        lotes: []
    },
    montaria: null,
    cooldowns: {
        trabalho: 0,
        cacar: 0,
        roubar: 0,
        crime: 0,
        viajar: 0,
        explorar: 0,
        diario: 0,
        minerar: 0,
        trair: 0,
        curar: 0
    }
};

const RpgPlayerModel = JSONDatabase.model('rpg_players.json');

class RpgPlayer extends RpgPlayerModel {
    constructor(data) {
        const fullData = {
            ...defaultValues,
            ...data,
            cofres: data?.cofres || 0,
            relacionamento: {
                ...defaultValues.relacionamento,
                ...(data?.relacionamento || {}),
                filhos: (data?.relacionamento?.filhos || []).slice(),
                historicoTraicoes: (data?.relacionamento?.historicoTraicoes || []).slice()
            },
            conquistas: (data?.conquistas || []).slice(),
            estatisticas: { ...defaultValues.estatisticas, ...(data?.estatisticas || {}) },
            petsPossuidos: (data?.petsPossuidos || []).slice(),
            equipamentos: { ...defaultValues.equipamentos, ...(data?.equipamentos || {}) },
            inventario: { ...(data?.inventario || {}) },
            sementes: { ...(data?.sementes || {}) },
            fazenda: {
                lotes: (data?.fazenda?.lotes || []).slice()
            },
            cooldowns: { ...defaultValues.cooldowns, ...(data?.cooldowns || {}) }
        };
        super(fullData);
    }

    getLimiteBanco() {
        const base = 5000000;
        const cofres = this.cofres || 0;
        return base + (cofres * 1000000);
    }

    regenerarEstamina() {
        const agora = Date.now();
        const ultima = this.ultimaRegenEstamina || agora;
        const diffSegundos = Math.floor((agora - ultima) / 1000);

        if (diffSegundos >= 30) {
            const pontosGanhos = Math.floor(diffSegundos / 30);
            this.estamina = Math.min(this.estaminaMax, (this.estamina || 0) + pontosGanhos);
            this.ultimaRegenEstamina = agora - ((diffSegundos % 30) * 1000);
        }
        return this.estamina;
    }

    consumirEstamina(quantidade = 10) {
        this.regenerarEstamina();
        if (this.estamina < quantidade) {
            return false;
        }
        this.estamina -= quantidade;
        return true;
    }

    adicionarItem(itemId, quantidade = 1) {
        if (!this.inventario) this.inventario = {};
        this.inventario[itemId] = (this.inventario[itemId] || 0) + quantidade;
    }

    removerItem(itemId, quantidade = 1) {
        if (!this.inventario || !this.inventario[itemId] || this.inventario[itemId] < quantidade) {
            return false;
        }
        this.inventario[itemId] -= quantidade;
        if (this.inventario[itemId] <= 0) {
            delete this.inventario[itemId];
        }
        return true;
    }

    temItem(itemId, quantidade = 1) {
        return (this.inventario?.[itemId] || 0) >= quantidade;
    }

    ganharXP(quantidade) {
        this.xp += quantidade;
        const xpNecessario = this.nivel * 100;
        let subiuDeNivel = false;

        while (this.xp >= xpNecessario) {
            this.xp -= xpNecessario;
            this.nivel += 1;
            this.hpMax += 25;
            this.hp = this.hpMax;
            this.mpMax += 15;
            this.mp = this.mpMax;
            this.estaminaMax += 10;
            this.estamina = this.estaminaMax;
            this.ataque += 4;
            this.defesa += 3;
            this.pontosAtributo = (this.pontosAtributo || 0) + 5; 
            subiuDeNivel = true;
        }

        return subiuDeNivel;
    }
}

module.exports = RpgPlayer;
