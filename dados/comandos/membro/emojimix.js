// creditos Olympio
const axios = require('axios');
const { getApiKey } = require('../../funções/apiKeys');
const CONFIG = {
    API: {
        BASE_URL: 'https://tenor.googleapis.com/v2',
        KEY: process.env.TENOR_KEY || getApiKey('tenor') || '',
        DEFAULT_PARAMS: {
            contentfilter: 'high',
            media_filter: 'png_transparent',
            component: 'proactive',
            collection: 'emoji_kitchen_v5',
        },
    },
    RETRY: {
        MAX_ATTEMPTS: 3,
        DELAY_MS: 1000,
    },
};
class EmojiMixError extends Error {
    constructor(message) {
        super(message);
        this.name = 'EmojiMixError';
    }
}
class TenorClient {
    constructor(apiKey) {
        if (!apiKey) {
            throw new EmojiMixError('Chave da API Tenor não configurada.');
        }
        this.api = axios.create({
            baseURL: CONFIG.API.BASE_URL,
            params: {
                key: apiKey,
                ...CONFIG.API.DEFAULT_PARAMS,
            },
        });
    }
    async fetchMix(emoji1, emoji2) {
        const query = `${emoji1}_${emoji2}`;
        for (let attempt = 1; attempt <= CONFIG.RETRY.MAX_ATTEMPTS; attempt++) {
            try {
                const response = await this.api.get('/featured', {
                    params: { q: query },
                });
                if (!response.data?.results?.length) {
                    throw new EmojiMixError('Combinação de emojis não disponível.');
                }
                return response.data.results.map(result => result.url);
            } catch (error) {
                if (error.response?.status === 429 && attempt < CONFIG.RETRY.MAX_ATTEMPTS) {
                    console.warn(`[EmojiMix] Rate limit atingido. Tentando novamente em ${attempt}s...`);
                    await new Promise(resolve => setTimeout(resolve, CONFIG.RETRY.DELAY_MS * attempt));
                } else {
                    throw new EmojiMixError(`Erro ao buscar emojis: ${error.message}`);
                }
            }
        }
    }
}
function getClient() {
    const key = process.env.TENOR_KEY || getApiKey('tenor');
    return new TenorClient(key);
}
async function emojiMix(emoji1, emoji2) {
    try {
        const client = getClient();
        const urls = await client.fetchMix(emoji1, emoji2);
        return urls[Math.floor(Math.random() * urls.length)];
    } catch (error) {
        console.error(`[Erro EmojiMix] ${error.message}`);
        throw error;
    }
}
module.exports = {
    name: 'emojimix',
    description: 'Mistura dois emojis e cria uma figurinha',
    usage: '!emojimix <emoji1> <emoji2>',
    aliases: ['emojimix', 'mixemoji'],
    run: async (conn, msg, config, args, sender, senderName) => {
        const from = msg.key.remoteJid;
        if (args.length < 2) {
            return conn.sendMessage(from, {
                text: '❌ Uso: !emojimix <emoji1> <emoji2>\n\nExemplo: !emojimix 😀 😎'
            }, { quoted: msg });
        }
        const emoji1 = args[0];
        const emoji2 = args[1];
        try {
            await conn.sendMessage(from, { text: '⏳ Misturando emojis...' }, { quoted: msg });
            const imageUrl = await emojiMix(emoji1, emoji2);
            const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
            const buffer = Buffer.from(response.data);
            await conn.sendMessage(from, {
                sticker: buffer
            }, { quoted: msg });
        } catch (e) {
            console.error("Erro no comando emojimix:", e);
            await conn.sendMessage(from, {
                text: `❌ ${e.message || 'Erro ao misturar emojis. Tente outra combinação!'}`
            }, { quoted: msg });
        }
    }
};
