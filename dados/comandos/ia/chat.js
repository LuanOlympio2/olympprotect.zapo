// creditos Olympio
const https = require('https');
const { getApiKey } = require('../../funções/apiKeys');

const aliases = ['chatgpt', 'deepseek', 'qwen', 'gemini', 'ia', 'bot'];

const systemPrompts = {
    chatgpt: 'Você é o ChatGPT, uma inteligência artificial desenvolvida pela OpenAI, seja prestativo, claro, organizado e natural nas respostas.',
    deepseek: 'Você é o DeepSeek, uma inteligência artificial analítica, lógica, precisa e direta nas explicações.',
    qwen: 'Você é o Qwen, uma inteligência artificial avançada, versátil, sábia e prática nas respostas.',
    gemini: 'Você é o Gemini, uma inteligência artificial desenvolvida pelo Google, rápida, criativa e informativa.',
    ia: 'Você é a inteligência artificial do OlympProtect, prestativa, bem humorada e pronta para ajudar.',
    bot: 'Você é o assistente inteligente do OlympProtect, prestativo e pronto para tirar dúvidas.'
};

function httpsPostJson(urlStr, data, extraHeaders = {}) {
    return new Promise((resolve, reject) => {
        const url = new URL(urlStr);
        const payload = JSON.stringify(data);
        const req = https.request({
            protocol: url.protocol,
            hostname: url.hostname,
            port: url.port || 443,
            path: url.pathname + url.search,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(payload),
                ...extraHeaders
            },
            timeout: 30000
        }, (res) => {
            let body = '';
            res.on('data', chunk => { body += chunk; });
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(body);
                    resolve({ status: res.statusCode, data: parsed });
                } catch (_) {
                    resolve({ status: res.statusCode, data: body });
                }
            });
        });
        req.on('error', reject);
        req.on('timeout', () => {
            req.destroy();
            reject(new Error('Timeout ao conectar com a IA'));
        });
        req.write(payload);
        req.end();
    });
}

async function gerarRespostaGemini(apiKey, systemInstruction, promptUsuario) {
    const models = ['gemini-3.6-flash', 'gemini-3.5-flash-lite'];
    const geminiHost = ['https:', '', 'generativelanguage.googleapis.com', 'v1beta', 'models'].join('/');

    for (const modelName of models) {
        try {
            const endpoint = `${geminiHost}/${modelName}:generateContent?key=${apiKey}`;
            const res = await httpsPostJson(endpoint, {
                system_instruction: {
                    parts: [{ text: systemInstruction }]
                },
                contents: [
                    {
                        parts: [{ text: promptUsuario }]
                    }
                ]
            });
            const text = res.data?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text) return text.trim();
        } catch (_) {
            continue;
        }
    }

    throw new Error('Falha ao consultar modelos Gemini');
}

async function gerarRespostaGroq(apiKey, systemInstruction, promptUsuario) {
    const groqEndpoint = ['https:', '', 'api.groq.com', 'openai', 'v1', 'chat', 'completions'].join('/');
    const res = await httpsPostJson(groqEndpoint, {
        model: 'qwen/qwen3.8-27b',
        messages: [
            { role: 'system', content: systemInstruction },
            { role: 'user', content: promptUsuario }
        ],
        max_tokens: 500,
        temperature: 0.7
    }, {
        'Authorization': `Bearer ${apiKey}`
    });
    return res.data?.choices?.[0]?.message?.content?.trim();
}

async function run(conn, msg, config, args, sender, senderName) {
    const from = msg.key.remoteJid;
    const prefix = config.prefix || '!';

    const fullText = msg.message?.conversation || 
                     msg.message?.extendedTextMessage?.text || 
                     msg.message?.imageMessage?.caption || 
                     msg.message?.videoMessage?.caption || '';

    let commandUsed = 'ia';
    if (fullText.startsWith(prefix)) {
        commandUsed = fullText.slice(prefix.length).trim().split(/\s+/)[0].toLowerCase();
    } else {
        commandUsed = aliases.find(a => fullText.toLowerCase().includes(a)) || 'ia';
    }

    const question = args.join(' ').trim();
    if (!question) {
        return await conn.sendMessage(from, {
            text: `⚠️ Como usar: ${prefix}${commandUsed} sua pergunta aqui`
        }, { quoted: msg });
    }

    const geminiKey = getApiKey('gemini');
    const groqKey = getApiKey('groq');

    if (!geminiKey && !groqKey) {
        return await conn.sendMessage(from, {
            text: 'A chave de inteligência artificial não foi configurada em apis.json, por favor configure a chave do Gemini ou Groq!'
        }, { quoted: msg });
    }

    const systemInstruction = systemPrompts[commandUsed] || systemPrompts.ia;

    try {
        await conn.sendPresenceUpdate('composing', from);

        let resposta = null;

        if (geminiKey) {
            try {
                resposta = await gerarRespostaGemini(geminiKey, systemInstruction, question);
            } catch (errGemini) {
                if (groqKey) {
                    resposta = await gerarRespostaGroq(groqKey, systemInstruction, question);
                } else {
                    throw errGemini;
                }
            }
        } else if (groqKey) {
            resposta = await gerarRespostaGroq(groqKey, systemInstruction, question);
        }

        if (!resposta) {
            return await conn.sendMessage(from, {
                text: 'Não consegui obter uma resposta no momento, tente novamente em instantes!'
            }, { quoted: msg });
        }

        await conn.sendMessage(from, {
            text: resposta
        }, { quoted: msg });

    } catch (e) {
        console.error(`Erro no comando ${commandUsed}:`, e?.message || e);
        await conn.sendMessage(from, {
            text: 'Ocorreu uma falha ao consultar a inteligência artificial, tente novamente mais tarde!'
        }, { quoted: msg });
    }
}

module.exports = {
    name: 'ia_chat',
    description: 'Comandos de inteligência artificial com múltiplas personas',
    aliases,
    run
};
