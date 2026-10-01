// creditos Olympio
const MINERIOS = {
    cobre: { nome: 'Minério de Cobre', preco: 15, nivelMinimo: 1, icone: '🟤' },
    ferro: { nome: 'Minério de Ferro', preco: 30, nivelMinimo: 2, icone: '⚪' },
    prata: { nome: 'Minério de Prata', preco: 60, nivelMinimo: 4, icone: '🪙' },
    ouro: { nome: 'Minério de Ouro', preco: 120, nivelMinimo: 7, icone: '✨' },
    platina: { nome: 'Minério de Platina', preco: 220, nivelMinimo: 10, icone: '💿' },
    titanio: { nome: 'Minério de Titânio', preco: 380, nivelMinimo: 14, icone: '🔩' },
    mitril: { nome: 'Minério de Mitril', preco: 650, nivelMinimo: 18, icone: '🔷' },
    adamante: { nome: 'Minério de Adamante', preco: 1100, nivelMinimo: 24, icone: '💎' },
    obsidiana: { nome: 'Cristal de Obsidiana', preco: 1800, nivelMinimo: 30, icone: '🔮' },
    eter: { nome: 'Cristal Etéreo', preco: 3000, nivelMinimo: 40, icone: '🌌' }
};

const PLANTACOES = {
    trigo: { nome: 'Trigo', precoSemente: 5, precoVenda: 10, tempoMinutos: 3, icone: '🌾' },
    cenoura: { nome: 'Cenoura', precoSemente: 8, precoVenda: 18, tempoMinutos: 5, icone: '🥕' },
    batata: { nome: 'Batata', precoSemente: 12, precoVenda: 25, tempoMinutos: 7, icone: '🥔' },
    tomate: { nome: 'Tomate', precoSemente: 16, precoVenda: 35, tempoMinutos: 10, icone: '🍅' },
    milho: { nome: 'Milho', precoSemente: 22, precoVenda: 48, tempoMinutos: 12, icone: '🌽' },
    morango: { nome: 'Morango', precoSemente: 30, precoVenda: 65, tempoMinutos: 15, icone: '🍓' },
    cana: { nome: 'Cana-de-Açúcar', precoSemente: 38, precoVenda: 80, tempoMinutos: 18, icone: '🎋' },
    cafe: { nome: 'Grão de Café', precoSemente: 48, precoVenda: 105, tempoMinutos: 22, icone: '☕' },
    uva: { nome: 'Uva Roxa', precoSemente: 60, precoVenda: 135, tempoMinutos: 26, icone: '🍇' },
    erva_magica: { nome: 'Erva Mágica', precoSemente: 80, precoVenda: 180, tempoMinutos: 32, icone: '🌿' }
};

const INGREDIENTES_LOJA = {
    leite: { nome: 'Garrafa de Leite', preco: 15, icone: '🥛' },
    ovo: { nome: 'Ovo de Galinha', preco: 10, icone: '🥚' },
    acucar: { nome: 'Saco de Açúcar', preco: 20, icone: '🧂' },
    fermento: { nome: 'Fermento Real', preco: 15, icone: '📦' },
    manteiga: { nome: 'Pote de Manteiga', preco: 25, icone: '🧈' },
    agua_fonte: { nome: 'Água da Fonte Sagrada', preco: 12, icone: '💧' },
    carne_caca: { nome: 'Carne Nobre de Caça', preco: 45, icone: '🥩' }
};

const RECEITAS_CULINARIA = {
    pao: {
        nome: 'Pão Rústico Assado',
        precoVenda: 50,
        icone: '🍞',
        ingredientes: { trigo: 2, fermento: 1 },
        descricao: 'Pão fresco e crocante. Recupera 25 HP.'
    },
    salada: {
        nome: 'Salada Camponesa',
        precoVenda: 130,
        icone: '🥗',
        ingredientes: { cenoura: 1, tomate: 1, batata: 1 },
        descricao: 'Salada nutritiva com vegetais frescos. Recupera 60 HP.'
    },
    bolo: {
        nome: 'Bolo Doce Artesanal',
        precoVenda: 180,
        icone: '🎂',
        ingredientes: { trigo: 2, leite: 1, acucar: 1, ovo: 1 },
        descricao: 'Delicioso bolo que recupera 100 HP e 30 MP.'
    },
    torta_morango: {
        nome: 'Torta de Morango Gourmet',
        precoVenda: 320,
        icone: '🥧',
        ingredientes: { morango: 3, trigo: 2, manteiga: 1 },
        descricao: 'Sobremesa valiosa. Recupera 180 HP.'
    },
    cafe_expresso: {
        nome: 'Café Expresso Energético',
        precoVenda: 260,
        icone: '☕',
        ingredientes: { cafe: 2, agua_fonte: 1 },
        descricao: 'Bebida aromática que restaura 100 MP.'
    },
    vinho_nobre: {
        nome: 'Vinho Tinto Imperial',
        precoVenda: 650,
        icone: '🍷',
        ingredientes: { uva: 4, acucar: 1 },
        descricao: 'Safra de luxo muito valorizada pelos nobres.'
    },
    pao_de_queijo: {
        nome: 'Pão de Queijo Dourado',
        precoVenda: 290,
        icone: '🧀',
        ingredientes: { trigo: 2, leite: 2, manteiga: 1 },
        descricao: 'Sabor irresistível. Recupera 140 HP.'
    },
    ensopado: {
        nome: 'Ensopado de Caçador',
        precoVenda: 380,
        icone: '🍲',
        ingredientes: { batata: 2, cenoura: 2, carne_caca: 1 },
        descricao: 'Prato farto que dá vigor. Recupera 220 HP e +10 de defesa por 1 hora.'
    },
    banquete_real: {
        nome: 'Bolo de Aniversário Real',
        precoVenda: 850,
        icone: '🍰',
        ingredientes: { trigo: 3, leite: 2, ovo: 2, morango: 2, acucar: 2 },
        descricao: 'Obra de arte culinária vendida a preços astronômicos!'
    },
    elixir_dos_deuses: {
        nome: 'Elixir Culinário dos Deuses',
        precoVenda: 2200,
        icone: '🍶',
        ingredientes: { erva_magica: 2, uva: 3, eter: 1 },
        descricao: 'Bebida sagrada. Restaura 100% de Vida e Mana!'
    }
};

const FORJA = {
    picaretas: {
        picareta_madeira: { nome: 'Picareta Rústica de Madeira', custoOuro: 50, materiais: {}, bonusMinerio: 0, icone: '🪵' },
        picareta_cobre: { nome: 'Picareta de Cobre', custoOuro: 150, materiais: { cobre: 5 }, bonusMinerio: 15, icone: '🟤' },
        picareta_ferro: { nome: 'Picareta de Ferro', custoOuro: 400, materiais: { ferro: 8 }, bonusMinerio: 30, icone: '⛏️' },
        picareta_prata: { nome: 'Picareta de Prata', custoOuro: 900, materiais: { prata: 10 }, bonusMinerio: 50, icone: '🪙' },
        picareta_ouro: { nome: 'Picareta de Ouro Dourado', custoOuro: 2000, materiais: { ouro: 10 }, bonusMinerio: 80, icone: '✨' },
        picareta_mitril: { nome: 'Picareta de Mitril', custoOuro: 5000, materiais: { mitril: 8, titanio: 4 }, bonusMinerio: 120, icone: '🔷' },
        picareta_adamante: { nome: 'Picareta de Adamante Divina', custoOuro: 12000, materiais: { adamante: 8, obsidiana: 3 }, bonusMinerio: 180, icone: '💎' }
    },
    espadas: {
        espada_ferro: { nome: 'Espada Longa de Ferro', ataque: 20, custoOuro: 250, materiais: { ferro: 6 }, icone: '🗡️' },
        espada_prata: { nome: 'Lâmina Prateada', ataque: 45, custoOuro: 650, materiais: { prata: 8 }, icone: '⚔️' },
        espada_ouro: { nome: 'Gládio Dourado', ataque: 75, custoOuro: 1500, materiais: { ouro: 10 }, icone: '🔱' },
        espada_titanio: { nome: 'Espada de Titânio Puro', ataque: 120, custoOuro: 3200, materiais: { titanio: 10 }, icone: '⚡' },
        espada_mitril: { nome: 'Lâmina Rúnica de Mitril', ataque: 180, custoOuro: 6500, materiais: { mitril: 10 }, icone: '🔷' },
        espada_adamante: { nome: 'Montante Lendário de Adamante', ataque: 270, custoOuro: 14000, materiais: { adamante: 8 }, icone: '👑' },
        espada_olimpiana: { nome: 'Espada Etérea do Olimpo', ataque: 400, custoOuro: 30000, materiais: { obsidiana: 5, eter: 3 }, icone: '🌌' }
    },
    escudos: {
        escudo_ferro: { nome: 'Escudo de Infantaria de Ferro', defesa: 15, custoOuro: 200, materiais: { ferro: 5 }, icone: '🛡️' },
        escudo_prata: { nome: 'Égide de Prata Polida', defesa: 35, custoOuro: 550, materiais: { prata: 6 }, icone: '🥈' },
        escudo_ouro: { nome: 'Pavés do Guardião Dourado', defesa: 60, custoOuro: 1300, materiais: { ouro: 8 }, icone: '🌟' },
        escudo_titanio: { nome: 'Escudo Reforçado de Titânio', defesa: 100, custoOuro: 2800, materiais: { titanio: 8 }, icone: '🔰' },
        escudo_mitril: { nome: 'Barreira Sagrada de Mitril', defesa: 150, custoOuro: 5800, materiais: { mitril: 8 }, icone: '💠' },
        escudo_adamante: { nome: 'Baluarte Imortal de Adamante', defesa: 230, custoOuro: 12500, materiais: { adamante: 6 }, icone: '🛡️' }
    },
    armaduras: {
        armadura_ferro: { nome: 'Cota de Malha de Ferro', hpMax: 80, defesa: 15, custoOuro: 350, materiais: { ferro: 10 }, icone: '🦺' },
        armadura_prata: { nome: 'Peitoral Nobre de Prata', hpMax: 180, defesa: 35, custoOuro: 900, materiais: { prata: 12 }, icone: '🥋' },
        armadura_ouro: { nome: 'Armadura Real Dourada', hpMax: 320, defesa: 60, custoOuro: 2200, materiais: { ouro: 12 }, icone: '🥼' },
        armadura_titanio: { nome: 'Armadura de Placas de Titânio', hpMax: 520, defesa: 95, custoOuro: 4500, materiais: { titanio: 12 }, icone: '🧥' },
        armadura_mitril: { nome: 'Manto Arcano de Mitril', hpMax: 800, defesa: 140, custoOuro: 9000, materiais: { mitril: 12 }, icone: '🥻' },
        armadura_adamante: { nome: 'Carapaça de Adamante do Titã', hpMax: 1200, defesa: 210, custoOuro: 19000, materiais: { adamante: 10 }, icone: '🦹' },
        armadura_divina: { nome: 'Manto Cósmico da Imortalidade', hpMax: 2000, defesa: 320, custoOuro: 40000, materiais: { obsidiana: 6, eter: 4 }, icone: '✨' }
    }
};

const EMPREGOS = {
    desempregado: {
        nome: 'Aventureiro Sem Rumo',
        salarioBase: 20,
        recurso: null,
        icone: '🎒'
    },
    minerador: {
        nome: 'Minerador das Profundezas',
        salarioBase: 60,
        recurso: 'minerio', 
        icone: '⛏️',
        descricao: 'Escava rochas para extrair metais raros e ganhar ouro.'
    },
    fazendeiro: {
        nome: 'Cultivador de Safras',
        salarioBase: 50,
        recurso: 'semente', 
        icone: '👨‍🌾',
        descricao: 'Cuida da terra e colhe sementes preciosas.'
    },
    lenhador: {
        nome: 'Lenhador Florestal',
        salarioBase: 55,
        recurso: 'madeira',
        icone: '🪓',
        descricao: 'Corta árvores nobres para abastecer construções e forjas.'
    },
    pescador: {
        nome: 'Pescador das Marés',
        salarioBase: 55,
        recurso: 'peixe',
        icone: '🎣',
        descricao: 'Pesca criaturas marítimas e encontra tesouros submersos.'
    },
    cozinheiro: {
        nome: 'Mestre da Cozinha Imperial',
        salarioBase: 65,
        recurso: 'ingrediente',
        icone: '👨‍🍳',
        descricao: 'Ganha ingredientes nobres e prepara pratos valiosos.'
    },
    cacador: {
        nome: 'Caçador Selvagem',
        salarioBase: 70,
        recurso: 'carne_caca',
        icone: '🏹',
        descricao: 'Rastreia feras selvagens para conseguir carnes e couros raros.'
    },
    ferreiro: {
        nome: 'Ferreiro Forjador',
        salarioBase: 75,
        recurso: 'minerio_refinado',
        icone: '🔨',
        descricao: 'Trabalha moldando armas e equipamentos.'
    },
    mercador: {
        nome: 'Mercador das Caravanas',
        salarioBase: 120, 
        recurso: null,
        icone: '💰',
        descricao: 'Negocia mercadorias em grandes rotas comerciais com alto retorno em moedas.'
    }
};

const LOCAIS_EXPLORACAO = [
    {
        id: 'vila_iniciantes',
        nome: 'Vila dos Iniciantes',
        nivelRecomendado: 1,
        custoViagem: 0,
        riscoMorte: 0,
        icone: '🏡',
        descricao: 'Povoado calmo e protegido. Ideal para aventureiros novatos colherem ervas e caçar pequenos animais.',
        dropsPossiveis: ['trigo', 'cobre', 'cenoura'],
        eventos: [
            { tipo: 'ouro', chance: 0.5, valor: [10, 30], msg: 'Você ajudou um aldeão com as compras e recebeu moedas de gratidão!' },
            { tipo: 'item', chance: 0.3, item: 'trigo', qtd: [1, 3], msg: 'Você encontrou feixes de trigo no celeiro comunitário.' }
        ]
    },
    {
        id: 'floresta_sombria',
        nome: 'Floresta Sombria dos Lobos',
        nivelRecomendado: 3,
        custoViagem: 20,
        riscoMorte: 0.05,
        icone: '🌲',
        descricao: 'Árvores altas bloqueiam a luz do sol. Uivos ecoam na neblina.',
        dropsPossiveis: ['carne_caca', 'cobre', 'ferro', 'morango'],
        eventos: [
            { tipo: 'ouro', chance: 0.4, valor: [25, 60], msg: 'Você desarmou uma armadilha de caçadores e pegou o ouro deixado para trás.' },
            { tipo: 'perigo', chance: 0.25, dano: 20, msg: 'Uma matilha de lobos te atacou de surpresa nas sombras!' }
        ]
    },
    {
        id: 'minas_abandonadas',
        nome: 'Minas Abandonadas de Karak',
        nivelRecomendado: 5,
        custoViagem: 40,
        riscoMorte: 0.08,
        icone: '⛏️',
        descricao: 'Antigas galerias subterrâneas onde mineradores deixaram veios intocados de ferro e prata.',
        dropsPossiveis: ['ferro', 'prata', 'ouro'],
        eventos: [
            { tipo: 'ouro', chance: 0.35, valor: [40, 100], msg: 'Você encontrou um carrinho de mineração enferrujado com um saco de moedas!' },
            { tipo: 'perda', chance: 0.2, perdaOuro: [10, 30], msg: 'Um desabamento derrubou parte do seu ouro na ravina!' }
        ]
    },
    {
        id: 'deserto_perdicao',
        nome: 'Deserto da Perdição',
        nivelRecomendado: 8,
        custoViagem: 70,
        riscoMorte: 0.12,
        icone: '🏜️',
        descricao: 'Dunas escaldantes repletas de escorpiões gigantes e tempestades de areia impiedosas.',
        dropsPossiveis: ['ouro', 'platina', 'cana'],
        eventos: [
            { tipo: 'ouro', chance: 0.3, valor: [80, 200], msg: 'Você desenterrou o baú de uma antiga caravana mercante soterrada nas dunas!' },
            { tipo: 'perigo', chance: 0.3, dano: 45, msg: 'Uma tempestade de areia cortante causou queimaduras severas!' }
        ]
    },
    {
        id: 'pantano_venenoso',
        nome: 'Pântano Venenoso das Bruxas',
        nivelRecomendado: 10,
        custoViagem: 100,
        riscoMorte: 0.15,
        icone: '🐊',
        descricao: 'Águas turvas exalando vapores tóxicos. Alquimistas procuram ervas raras aqui.',
        dropsPossiveis: ['erva_magica', 'platina', 'titanio'],
        eventos: [
            { tipo: 'item', chance: 0.35, item: 'erva_magica', qtd: [1, 2], msg: 'Você colheu uma brilhante erva mágica crescendo entre os juncos tóxicos.' },
            { tipo: 'perigo', chance: 0.35, dano: 60, msg: 'Você respirou os gases venenosos do pântano e quase desmaiou!' }
        ]
    },
    {
        id: 'cordilheira_congelada',
        nome: 'Cordilheira dos Ventos Gelados',
        nivelRecomendado: 13,
        custoViagem: 140,
        riscoMorte: 0.18,
        icone: '🏔️',
        descricao: 'Picos nevados onde golens de gelo guardam depósitos milenares de titânio.',
        dropsPossiveis: ['titanio', 'mitril', 'prata'],
        eventos: [
            { tipo: 'ouro', chance: 0.3, valor: [150, 350], msg: 'Você quebrou um bloco de gelo ancestral e libertou relíquias de ouro puro!' },
            { tipo: 'perigo', chance: 0.3, dano: 80, msg: 'Uma avalanche colossal desceu a montanha e quase te soterrou!' }
        ]
    },
    {
        id: 'pico_dragao',
        nome: 'Ninho Vulcânico do Dragão',
        nivelRecomendado: 16,
        custoViagem: 200,
        riscoMorte: 0.22,
        icone: '🐉',
        descricao: 'Crateras de fogo e ossos calcinados. Jovens dragões protegem seus tesouros acumulados.',
        dropsPossiveis: ['mitril', 'adamante', 'carne_caca'],
        eventos: [
            { tipo: 'ouro', chance: 0.25, valor: [300, 700], msg: 'Você furtou um punhado de tesouros sob as garras de um filhote de dragão adormecido!' },
            { tipo: 'perigo', chance: 0.35, dano: 110, msg: 'Uma rajada de fogo cusparada do céu chamuscou sua armadura!' }
        ]
    },
    {
        id: 'ruinas_templo',
        nome: 'Ruínas do Templo Sagrado',
        nivelRecomendado: 19,
        custoViagem: 260,
        riscoMorte: 0.20,
        icone: '🏛️',
        descricao: 'Colunatas em ruínas dedicadas a deuses esquecidos, habitadas por espectros vingativos.',
        dropsPossiveis: ['ouro', 'mitril', 'adamante'],
        eventos: [
            { tipo: 'ouro', chance: 0.35, valor: [400, 900], msg: 'A bênção do templo esquecido brilhou em seu peito, premiando seu valor!' },
            { tipo: 'perigo', chance: 0.3, dano: 130, msg: 'Estátuas de sentinelas dispararam dardos sagrados em sua direção!' }
        ]
    },
    {
        id: 'ilha_piratas',
        nome: 'Ilha dos Corsários Fantasmas',
        nivelRecomendado: 22,
        custoViagem: 320,
        riscoMorte: 0.25,
        icone: '🏴‍☠️',
        descricao: 'Naufrágios quebrados contra arrecifes. Tripulações amaldiçoadas vigiam baús de piratas.',
        dropsPossiveis: ['adamante', 'obsidiana', 'uva'],
        eventos: [
            { tipo: 'ouro', chance: 0.3, valor: [600, 1400], msg: 'Você encontrou um baú do tesouro marcado com um X na areia branca!' },
            { tipo: 'perda', chance: 0.3, perdaOuro: [50, 150], msg: 'Um capitão pirata fantasma te saqueou antes de evaporar!' }
        ]
    },
    {
        id: 'cavernas_magma',
        nome: 'Cavernas de Magma Infernal',
        nivelRecomendado: 25,
        custoViagem: 400,
        riscoMorte: 0.28,
        icone: '🌋',
        descricao: 'Rios de lava incandescente. O único lugar onde cristais de obsidiana emergem do manto terrestre.',
        dropsPossiveis: ['obsidiana', 'adamante', 'titanio'],
        eventos: [
            { tipo: 'item', chance: 0.25, item: 'obsidiana', qtd: [1, 2], msg: 'Você resfriou uma pedra de lava e colheu um brilhante cristal de obsidiana!' },
            { tipo: 'perigo', chance: 0.4, dano: 160, msg: 'Uma bolha de magma espirrou perto de você causando queimaduras de 3º grau!' }
        ]
    },
    {
        id: 'abismo_profundo',
        nome: 'Abismo das Profundezas Sem Fim',
        nivelRecomendado: 28,
        custoViagem: 500,
        riscoMorte: 0.30,
        icone: '🕳️',
        descricao: 'O fosso mais profundo da Terra, onde a luz nunca chega e aberrações cegas espreitam.',
        dropsPossiveis: ['obsidiana', 'eter', 'mitril'],
        eventos: [
            { tipo: 'ouro', chance: 0.3, valor: [800, 2000], msg: 'Você saqueou o covil de uma aberração abissal derrotada!' },
            { tipo: 'perigo', chance: 0.35, dano: 200, msg: 'Tentáculos brotaram da escuridão e te golpearam violentamente!' }
        ]
    },
    {
        id: 'floresta_elfica',
        nome: 'Santuário Élfico de Sylvana',
        nivelRecomendado: 31,
        custoViagem: 600,
        riscoMorte: 0.15,
        icone: '🧝',
        descricao: 'Refúgio de elfos milenares protegidos por barreiras arcanas impenetráveis.',
        dropsPossiveis: ['erva_magica', 'eter', 'uva'],
        eventos: [
            { tipo: 'ouro', chance: 0.4, valor: [1000, 2500], msg: 'A Alta Sacerdotisa dos Elfos te concedeu uma bolsa com moedas élficas!' },
            { tipo: 'cura', chance: 0.3, curaHP: 150, msg: 'Águas de uma fonte élfica curaram suas feridas e purificaram sua alma.' }
        ]
    },
    {
        id: 'cemiterio_maldito',
        nome: 'Necrópole dos Reis Esquecidos',
        nivelRecomendado: 35,
        custoViagem: 750,
        riscoMorte: 0.33,
        icone: '⚰️',
        descricao: 'Tumbas de monarcas antigos corrompidos pela necromancia. O perigo é constante.',
        dropsPossiveis: ['eter', 'obsidiana', 'adamante'],
        eventos: [
            { tipo: 'ouro', chance: 0.3, valor: [1200, 3000], msg: 'Você arrombou o sarcófago de um faraó maldito repleto de ouro!' },
            { tipo: 'perigo', chance: 0.4, dano: 250, msg: 'Uma maldição dos mortos drenou sua força vital!' }
        ]
    },
    {
        id: 'cidadela_arcanos',
        nome: 'Cidadela Celeste dos Arcanos',
        nivelRecomendado: 38,
        custoViagem: 900,
        riscoMorte: 0.35,
        icone: '🔮',
        descricao: 'Fortaleza flutuante repleta de autômatos mecânicos movidos a núcleos de éter.',
        dropsPossiveis: ['eter', 'obsidiana', 'cafe'],
        eventos: [
            { tipo: 'item', chance: 0.3, item: 'eter', qtd: [1, 2], msg: 'Você desarmou um gerador arcano e extraiu um lendário Cristal Etéreo!' },
            { tipo: 'perigo', chance: 0.4, dano: 300, msg: 'Um feixe de energia arcana vaporizou parte dos seus pertences!' }
        ]
    },
    {
        id: 'vale_gigantes',
        nome: 'Vale dos Gigantes Primevos',
        nivelRecomendado: 42,
        custoViagem: 1100,
        riscoMorte: 0.38,
        icone: '🧌',
        descricao: 'Terra de titãs colossais cujos passos estremecem montanhas inteiras.',
        dropsPossiveis: ['eter', 'adamante', 'obsidiana'],
        eventos: [
            { tipo: 'ouro', chance: 0.25, valor: [2000, 5000], msg: 'Você encontrou uma bolsa de ouro esquecida por um gigante!' },
            { tipo: 'perigo', chance: 0.45, dano: 380, msg: 'Uma rocha colossal arremessada por um titã caiu a poucos metros de você!' }
        ]
    },
    {
        id: 'monte_olimpo',
        nome: 'Cume Sagrado do Monte Olimpo',
        nivelRecomendado: 48,
        custoViagem: 1500,
        riscoMorte: 0.40,
        icone: '⚡',
        descricao: 'A morada suprema dos Deuses. Apenas os guerreiros mais lendários ousam pisar aqui.',
        dropsPossiveis: ['eter', 'obsidiana', 'adamante', 'erva_magica'],
        eventos: [
            { tipo: 'ouro', chance: 0.3, valor: [3500, 8000], msg: 'Zeus lançou um raio dourado premiando sua audácia com o tesouro do Olimpo!' },
            { tipo: 'perigo', chance: 0.45, dano: 480, msg: 'A ira dos deuses castigou sua presunção com relâmpagos devastadores!' }
        ]
    }
];

const PETS = {
    gato: {
        id: 'gato',
        nome: 'Gato Angorá Esperto',
        tipo: 'basico',
        preco: 500,
        icone: '🐱',
        descricao: 'Felino ágil e esperto. Aumenta furtividade, sorte e chance de sucesso em roubos.',
        bonus: { rouboSorte: 20, agilidade: 15 }
    },
    cachorro: {
        id: 'cachorro',
        nome: 'Cão Pastor Leal',
        tipo: 'basico',
        preco: 600,
        icone: '🐶',
        descricao: 'Companheiro fiel que guarda seu dono contra emboscadas na estrada.',
        bonus: { defesa: 25, protecaoEmboscada: 30 }
    },
    coelho: {
        id: 'coelho',
        nome: 'Coelho Saltitante',
        tipo: 'basico',
        preco: 450,
        icone: '🐰',
        descricao: 'Rápido como o vento. Reduz o consumo de estamina ao viajar e explorar.',
        bonus: { economiaEstamina: 20 }
    },
    hamster: {
        id: 'hamster',
        nome: 'Hamster Aventureiro',
        tipo: 'basico',
        preco: 350,
        icone: '🐹',
        descricao: 'Pequeno e engenhoso. Guarda sementes extras e reduz perdas em viagens.',
        bonus: { colheitaExtra: 15 }
    },
    papagaio: {
        id: 'papagaio',
        nome: 'Papagaio Real Falante',
        tipo: 'basico',
        preco: 700,
        icone: '🦜',
        descricao: 'Carismático negociador. Concede +20% de ouro extra em todas as vendas no mercado.',
        bonus: { bonusVenda: 20 }
    },
    galinha: {
        id: 'galinha',
        nome: 'Galinha Poedeira de Ouro',
        tipo: 'basico',
        preco: 400,
        icone: '🐔',
        descricao: 'Produz ovos frescos para culinária e dá +25% de produção na fazenda.',
        bonus: { bonusFazenda: 25 }
    },
    tartaruga: {
        id: 'tartaruga',
        nome: 'Tartaruga Couraçada',
        tipo: 'basico',
        preco: 800,
        icone: '🐢',
        descricao: 'Carapaça impenetrável que reduz em 30% todo o dano sofrido em emboscadas.',
        bonus: { defesa: 35, reducaoDano: 30 }
    },
    peixe: {
        id: 'peixe',
        nome: 'Aquário com Peixe Místico',
        tipo: 'basico',
        preco: 650,
        icone: '🐠',
        descricao: 'Traz paz de espírito e serenidade. Concede regeneração passiva acelerada de Mana.',
        bonus: { mpMax: 50, regenMp: 25 }
    },

    dragao: {
        id: 'dragao',
        nome: 'Dragão Ancião do Olimpo',
        tipo: 'mitico',
        preco: 15000,
        icone: '🐉',
        descricao: 'Monstro alado mítico. Aumenta o Ataque em +120, a Vida em +200 e intimida qualquer rival!',
        bonus: { ataque: 120, hpMax: 200, intimidaRival: 50 }
    },
    tiranossauro: {
        id: 'tiranossauro',
        nome: 'Tiranossauro Rex Alfa',
        tipo: 'dinossauro',
        preco: 18000,
        icone: '🦖',
        descricao: 'O predador supremo pré-histórico. Concede +150 de Ataque brutal e dano crítico maciço!',
        bonus: { ataque: 150, critico: 35 }
    },
    spinossauro: {
        id: 'spinossauro',
        nome: 'Spinossauro de Crista Gigante',
        tipo: 'dinossauro',
        preco: 14000,
        icone: '🐊',
        descricao: 'Predador anfíbio colossal. Concede +90 de Ataque, +80 de Defesa e regeneração.',
        bonus: { ataque: 90, defesa: 80, hpMax: 150 }
    },
    velociraptor: {
        id: 'velociraptor',
        nome: 'Velociraptor Voraz',
        tipo: 'dinossauro',
        preco: 8500,
        icone: '🦎',
        descricao: 'Ágil e letal em emboscadas. Concede +80 de Ataque e +35% de chance de esquiva perfeita.',
        bonus: { ataque: 80, esquiva: 35 }
    },
    triceratops: {
        id: 'triceratops',
        nome: 'Triceratops Encouraçado',
        tipo: 'dinossauro',
        preco: 11000,
        icone: '🦏',
        descricao: 'Escudo vivo de três chifres. Concede +140 de Defesa e protege carretas de viagem.',
        bonus: { defesa: 140, hpMax: 250 }
    },
    brachiossauro: {
        id: 'brachiossauro',
        nome: 'Brachiossauro Titânico',
        tipo: 'dinossauro',
        preco: 16000,
        icone: '🦕',
        descricao: 'O maior herbívoro da terra. Concede +500 de Vida Máxima e +50 de Estamina Máxima!',
        bonus: { hpMax: 500, estaminaMax: 50 }
    },
    parassauro: {
        id: 'parassauro',
        nome: 'Parassauro Rastreador de Crista',
        tipo: 'dinossauro',
        preco: 9500,
        icone: '🪶',
        descricao: 'Sua crista detecta perigos a quilômetros e encontra o dobro de ervas raras na exploração.',
        bonus: { esquiva: 25, dobroErvas: 40 }
    }
};

const ITENS_PESCA = {
    varas: {
        vara_bambu: { nome: 'Vara Simples de Bambu', preco: 100, bonusCaptura: 10, icone: '🎋' },
        vara_fibra: { nome: 'Vara de Fibra de Vidro', preco: 400, bonusCaptura: 25, icone: '🎣' },
        vara_ferro: { nome: 'Vara Reforçada de Ferro', preco: 1000, bonusCaptura: 45, icone: '⚓' },
        vara_ouro: { nome: 'Vara Nobre de Ouro', preco: 2500, bonusCaptura: 70, icone: '✨' },
        vara_poseidon: { nome: 'Tridente & Vara Sagrada de Posêidon', preco: 8000, bonusCaptura: 120, icone: '🔱' }
    },
    iscas: {
        isca_minhoca: { nome: 'Minhoca da Terra', preco: 5, atracao: 10, icone: '🪱' },
        isca_viva: { nome: 'Camarão Vivo', preco: 15, atracao: 25, icone: '🦐' },
        isca_luminosa: { nome: 'Isca Luminosa das Profundezas', preco: 35, atracao: 45, icone: '💡' },
        isca_magica: { nome: 'Isca Encantada dos Tritões', preco: 80, atracao: 80, icone: '🔮' }
    }
};

const PEIXES = {
    sardinha: { nome: 'Sardinha Prateada', preco: 20, nivelMin: 1, icone: '🐟' },
    tilapia: { nome: 'Tilápia de Rio', preco: 45, nivelMin: 2, icone: '🐠' },
    salmao: { nome: 'Salmão das Corredeiras', preco: 85, nivelMin: 4, icone: '🍣' },
    truta_dourada: { nome: 'Truta Dourada Rara', preco: 160, nivelMin: 7, icone: '🐡' },
    baiacu: { nome: 'Baiacu Espinhoso Venenoso', preco: 260, nivelMin: 10, icone: '🐡' },
    peixe_espada: { nome: 'Peixe-Espada Veloz', preco: 480, nivelMin: 14, icone: '🗡️' },
    tubarao_ancestral: { nome: 'Tubarão Ancestral Gigante', preco: 1200, nivelMin: 20, icone: '🦈' },
    perola_negra: { nome: 'Pérola Negra das Profundezas', preco: 2500, nivelMin: 25, icone: '🦪' },
    bau_afundado: { nome: 'Baú Afundado de Navio Pirata', preco: 4000, nivelMin: 30, icone: '🪙' }
};

const FERAS_CACA = [
    { id: 'coelho_selvagem', nome: 'Coelho Selvagem das Colinas', nivel: 1, hp: 45, ataque: 8, recompensaOuro: [15, 30], xp: 20, drop: 'carne_caca', icone: '🐇' },
    { id: 'cervo_florestal', nome: 'Cervo Galhoso da Floresta', nivel: 3, hp: 90, ataque: 16, recompensaOuro: [30, 60], xp: 40, drop: 'carne_caca', icone: '🦌' },
    { id: 'lobo_sombrio', nome: 'Lobo Sombrio Solitário', nivel: 6, hp: 180, ataque: 32, recompensaOuro: [60, 130], xp: 80, drop: 'carne_caca', icone: '🐺' },
    { id: 'urso_pardo', nome: 'Urso Pardo Enfurecido', nivel: 10, hp: 320, ataque: 55, recompensaOuro: [120, 260], xp: 140, drop: 'carne_caca', icone: '🐻' },
    { id: 'javali_feroz', nome: 'Javali Feroz de Presas de Aço', nivel: 14, hp: 500, ataque: 85, recompensaOuro: [200, 450], xp: 220, drop: 'carne_caca', icone: '🐗' },
    { id: 'quimera_alada', nome: 'Quimera Alada Tricéfala', nivel: 20, hp: 850, ataque: 140, recompensaOuro: [500, 1000], xp: 350, drop: 'carne_caca', icone: '🦁' },
    { id: 'grifo_montanhas', nome: 'Grifo Real das Montanhas', nivel: 28, hp: 1500, ataque: 230, recompensaOuro: [1000, 2200], xp: 550, drop: 'carne_caca', icone: '🦅' },
    { id: 'hidra_pantano', nome: 'Hidra Venenosa de Sete Cabeças', nivel: 38, hp: 2600, ataque: 360, recompensaOuro: [2200, 5000], xp: 900, drop: 'carne_caca', icone: '🐍' }
];

const CHEFES_MUNDIAIS = [
    {
        id: 'minotauro',
        nome: 'Minotauro do Labirinto de Creta',
        hpMax: 6000,
        ataque: 110,
        recompensaOuro: 20000,
        xpTotal: 2500,
        icone: '🐂',
        descricao: 'A fera cornuda que esmaga ossos no labirinto ancestral.',
        fraqueza: 'Agilidade'
    },
    {
        id: 'cerbero',
        nome: 'Cérbero o Cão Guardião do Hades',
        hpMax: 16000,
        ataque: 190,
        recompensaOuro: 45000,
        xpTotal: 6000,
        icone: '🐕‍🦺',
        descricao: 'Monstro de três cabeças cujas mandíbulas cospem fogo e trevas.',
        fraqueza: 'Magia Sagrada'
    },
    {
        id: 'medusa',
        nome: 'Medusa a Rainha Górgona',
        hpMax: 30000,
        ataque: 280,
        recompensaOuro: 80000,
        xpTotal: 12000,
        icone: '🐍',
        descricao: 'Cabelos de serpentes vivas cujo olhar petrifica os mais corajosos.',
        fraqueza: 'Escudos de Espelho'
    },
    {
        id: 'ares',
        nome: 'Ares a Ira do Deus da Guerra',
        hpMax: 70000,
        ataque: 440,
        recompensaOuro: 180000,
        xpTotal: 25000,
        icone: '⚔️',
        descricao: 'A encarnação suprema do combate brutal e sanguinário.',
        fraqueza: 'Estratégia dos Titãs'
    },
    {
        id: 'kraken',
        nome: 'Kraken o Terror dos Sete Mares',
        hpMax: 120000,
        ataque: 620,
        recompensaOuro: 350000,
        xpTotal: 50000,
        icone: '🐙',
        descricao: 'Colosso abissal capaz de tragar frotas navais inteiras para o fundo do oceano.',
        fraqueza: 'Fogo Cósmico'
    }
];

const RECEITAS_ALQUIMIA = {
    pocao_vida_pequena: {
        nome: 'Poção de Vida Menor',
        tipo: 'cura_hp',
        restauraHP: 60,
        precoVenda: 35,
        icone: '🧪',
        ingredientes: { erva_magica: 1, agua_fonte: 1 },
        descricao: 'Cura 60 pontos de HP.'
    },
    pocao_vida_media: {
        nome: 'Poção de Vida Média',
        tipo: 'cura_hp',
        restauraHP: 160,
        precoVenda: 90,
        icone: '🧪',
        ingredientes: { erva_magica: 2, cenoura: 1, agua_fonte: 1 },
        descricao: 'Cura 160 pontos de HP.'
    },
    pocao_vida_grande: {
        nome: 'Poção de Vida Maior',
        tipo: 'cura_hp',
        restauraHP: 380,
        precoVenda: 230,
        icone: '🏺',
        ingredientes: { erva_magica: 3, morango: 2, agua_fonte: 1 },
        descricao: 'Cura 380 pontos de HP.'
    },
    pocao_mana: {
        nome: 'Frasco de Mana Puro',
        tipo: 'cura_mp',
        restauraMP: 140,
        precoVenda: 140,
        icone: '🔮',
        ingredientes: { erva_magica: 2, uva: 2, agua_fonte: 1 },
        descricao: 'Restaura 140 pontos de MP.'
    },
    pocao_estamina: {
        nome: 'Tônico de Vigor e Fôlego',
        tipo: 'cura_estamina',
        restauraEstamina: 60,
        precoVenda: 180,
        icone: '⚡',
        ingredientes: { cafe: 2, trigo: 2, agua_fonte: 1 },
        descricao: 'Restaura 60 pontos de Estamina instantaneamente.'
    },
    elixir_berserk: {
        nome: 'Elixir da Fúria Berserk',
        tipo: 'buff_ataque',
        buffAtaque: 40,
        precoVenda: 420,
        icone: '🍷',
        ingredientes: { carne_caca: 2, ouro: 1, erva_magica: 2 },
        descricao: 'Aumenta +40 de ataque temporário em caças e masmorras.'
    },
    elixir_olimpico: {
        nome: 'Néctar Sagrado da Imortalidade',
        tipo: 'cura_total',
        curaTotal: true,
        precoVenda: 1800,
        icone: '✨',
        ingredientes: { eter: 1, erva_magica: 3, uva: 3 },
        descricao: 'Cura 100% de HP, MP e Estamina instantaneamente!'
    }
};

const CRIMES = {
    bater_carteira: {
        id: 'bater_carteira',
        nome: 'Bater Carteira na Feira',
        risco: 0.25,
        recompensaOuro: [35, 90],
        karmaPerda: 2,
        tempoPresoMin: 2,
        estamina: 10,
        nivelMin: 1,
        desc: 'Furtar discretamente moedas de aldeões na feira da vila.'
    },
    arrombar_loja: {
        id: 'arrombar_loja',
        nome: 'Arrombar Armazém Fechado',
        risco: 0.38,
        recompensaOuro: [120, 320],
        karmaPerda: 5,
        tempoPresoMin: 4,
        estamina: 15,
        nivelMin: 3,
        desc: 'Forçar portas de mercadores no meio da calada da noite.'
    },
    assaltar_carruagem: {
        id: 'assaltar_carruagem',
        nome: 'Assaltar Carruagem Mercante',
        risco: 0.50,
        recompensaOuro: [380, 850],
        karmaPerda: 10,
        tempoPresoMin: 8,
        estamina: 20,
        nivelMin: 6,
        desc: 'Armar emboscada na estrada e saquear carruagens de nobres.'
    },
    banco_imperial: {
        id: 'banco_imperial',
        nome: 'Invasão ao Banco Imperial',
        risco: 0.65,
        recompensaOuro: [1200, 3200],
        karmaPerda: 25,
        tempoPresoMin: 15,
        estamina: 30,
        nivelMin: 12,
        desc: 'Infiltrar nas câmaras secretas e tentar furtar ouro da corte de Zeus.'
    }
};

const CONQUISTAS = {
    primeiro_passo: {
        id: 'primeiro_passo',
        nome: 'Primeiros Passos',
        desc: 'Alcance o nível 3 no RPG',
        recompensaOuro: 150,
        xp: 80,
        titulo: 'Novato Curioso'
    },
    minerador_iniciante: {
        id: 'minerador_iniciante',
        nome: 'Escavador de Rochas',
        desc: 'Minere pelo menos 15 vezes',
        recompensaOuro: 300,
        xp: 120,
        titulo: 'Quebrador de Pedra'
    },
    fazendeiro_verde: {
        id: 'fazendeiro_verde',
        nome: 'Dedo Verde',
        desc: 'Colha 20 plantas na fazenda',
        recompensaOuro: 300,
        xp: 120,
        titulo: 'Colhedor de Safras'
    },
    mestre_cuca: {
        id: 'mestre_cuca',
        nome: 'Chef da Taverna',
        desc: 'Cozinhe 8 pratos artesanais',
        recompensaOuro: 450,
        xp: 180,
        titulo: 'Mestre Culinário'
    },
    alquimista_aprendiz: {
        id: 'alquimista_aprendiz',
        nome: 'Manipulador de Frascos',
        desc: 'Produza 5 poções no caldeirão',
        recompensaOuro: 400,
        xp: 150,
        titulo: 'Alquimista'
    },
    cacador_feras: {
        id: 'cacador_feras',
        nome: 'Caçador Feroz',
        desc: 'Cace 10 feras selvagens',
        recompensaOuro: 500,
        xp: 200,
        titulo: 'Predador das Matas'
    },
    coracao_valente: {
        id: 'coracao_valente',
        nome: 'Coração Valente',
        desc: 'Alcance o nível 10 no RPG',
        recompensaOuro: 1000,
        xp: 400,
        titulo: 'Guerreiro Destemido'
    },
    domador: {
        id: 'domador',
        nome: 'Amigo dos Bichos',
        desc: 'Tenha 2 pets sob seus cuidados',
        recompensaOuro: 800,
        xp: 300,
        titulo: 'Domador de Feras'
    },
    magnata: {
        id: 'magnata',
        nome: 'Bilionário do Olimpo',
        desc: 'Acumule 1.000.000 de ouro no cofre',
        recompensaOuro: 3000,
        xp: 1000,
        titulo: 'Magnata Imperial'
    },
    eterno_amor: {
        id: 'eterno_amor',
        nome: 'União Sagrada',
        desc: 'Case-se com seu grande amor após o namoro',
        recompensaOuro: 1200,
        xp: 500,
        titulo: 'Cônjuge Exemplar'
    },
    olho_aberto: {
        id: 'olho_aberto',
        nome: 'Coração Calejado',
        desc: 'Passe por um escândalo ou flagra de traição',
        recompensaOuro: 500,
        xp: 200,
        titulo: 'Vigilante Cauteloso'
    },
    patriarca: {
        id: 'patriarca',
        nome: 'Lar Acolhedor',
        desc: 'Adote uma criança no orfanato',
        recompensaOuro: 600,
        xp: 250,
        titulo: 'Guardião de Órfãos'
    }
};

const ITENS_ORFANATO = {
    bebe: { nome: 'Bebê Sorridente', custo: 800, ouroDiario: 35, icone: '👶', desc: 'Traz alegria pura ao lar e pequenos mimos.' },
    menino: { nome: 'Menino Esperto', custo: 1500, ouroDiario: 70, icone: '👦', desc: 'Ajuda a recolher moedas na praça da vila.' },
    menina: { nome: 'Menina Gentil', custo: 1500, ouroDiario: 70, icone: '👧', desc: 'Colhe flores medicinais e alegra a casa.' },
    aprendiz: { nome: 'Jovem Aprendiz', custo: 3000, ouroDiario: 140, icone: '🧑‍🎓', desc: 'Estuda com você e gera rendimento regular ao lar.' }
};

const ITENS_ESPECIAIS_LOJA = {
    cofre: {
        nome: 'Cofre Blindado Adicional',
        preco: 350000,
        icone: '🗄️',
        desc: 'Expande permanentemente o limite do seu banco em +1.000.000 de ouro (stackável)!'
    },
    alianca_ouro: {
        nome: 'Par de Alianças de Ouro Puro',
        preco: 5000,
        icone: '💍',
        desc: 'Necessário para celebrar a sagrada cerimônia de casamento.'
    }
};

module.exports = {
    MINERIOS,
    PLANTACOES,
    INGREDIENTES_LOJA,
    RECEITAS_CULINARIA,
    RECEITAS_ALQUIMIA,
    FORJA,
    EMPREGOS,
    LOCAIS_EXPLORACAO,
    PETS,
    ITENS_PESCA,
    PEIXES,
    FERAS_CACA,
    CHEFES_MUNDIAIS,
    CRIMES,
    CONQUISTAS,
    ITENS_ORFANATO,
    ITENS_ESPECIAIS_LOJA
};

