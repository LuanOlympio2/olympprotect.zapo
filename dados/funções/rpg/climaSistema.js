// creditos Olympio
const CLIMAS = [
    {
        id: 'ensolarado',
        nome: 'Sol Radiante de Apolo',
        icone: '☀️',
        descricao: 'O sol aquece as terras do Olimpo com vigor.',
        efeitos: {
            fazenda: 'Plantios regados crescem 25% mais rápido!',
            pesca: 'Peixes comuns nadam na superfície.',
            estamina: 'Consumo normal de energia.'
        }
    },
    {
        id: 'chuva',
        nome: 'Chuva Fértil de Deméter',
        icone: '🌧️',
        descricao: 'Gotas refrescantes irrigam os solos e enchem os rios.',
        efeitos: {
            fazenda: 'Rega automaticamente todos os canteiros da fazenda!',
            pesca: '+35% de chance de fisgar peixes nobres e salmões!',
            estamina: 'Viagens mais frescas e tranquilas.'
        }
    },
    {
        id: 'tempestade',
        nome: 'Tempestade de Raios de Zeus',
        icone: '⛈️',
        descricao: 'Trovões ensurdecedores e relâmpagos cortam o céu.',
        efeitos: {
            pesca: 'Chance de fisgar criaturas abissais e Baús Afundados!',
            caca: 'Feras selvagens assustadas fogem com mais facilidade.',
            exploracao: 'Risco de dano elétrico aumentado em 15%.'
        }
    },
    {
        id: 'neblina',
        nome: 'Nevoeiro Sombrio de Névoa',
        icone: '🌫️',
        descricao: 'Uma névoa espessa cobre vales e aldeias, reduzindo a visão.',
        efeitos: {
            roubo: '+25% de furtividade e sucesso em roubos e crimes!',
            exploracao: 'Maior chance de encontrar baús escondidos na cerração.',
            viagem: 'As caravanas viajam um pouco mais devagar.'
        }
    },
    {
        id: 'nevasca',
        nome: 'Nevasca Congelante de Bóreas',
        icone: '❄️',
        descricao: 'Ventos árticos cobrem os reinos de gelo e geada.',
        efeitos: {
            trabalho: 'Mineradores encontram minérios de titânio e cristais com mais facilidade!',
            estamina: 'Consome +5 de estamina ao explorar devido ao frio extremo.',
            fazenda: 'Culturas precisam de cuidado redobrado.'
        }
    },
    {
        id: 'lua_sangue',
        nome: 'Lua de Sangue de Ares',
        icone: '🩸',
        descricao: 'A lua escarlate incendeia a fúria das bestas do mundo.',
        efeitos: {
            caca: 'Bestas da caça concedem DOBRO DE OURO E DOBRO DE XP!',
            masmorra: 'Golpes críticos aumentados em +20% para todos os guerreiros!',
            roubo: 'A guarda imperial fica em alerta máximo.'
        }
    }
];

const DURACAO_CLIMA_MS = 2 * 60 * 60 * 1000; 

function getClimaAtual() {
    const agora = Date.now();
    const indiceClima = Math.floor(agora / DURACAO_CLIMA_MS) % CLIMAS.length;
    const clima = CLIMAS[indiceClima];

    const proximaMudanca = (Math.floor(agora / DURACAO_CLIMA_MS) + 1) * DURACAO_CLIMA_MS;
    const tempoRestanteMs = proximaMudanca - agora;

    return {
        ...clima,
        tempoRestanteMs
    };
}

module.exports = {
    CLIMAS,
    getClimaAtual
};
