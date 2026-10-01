// creditos Olympio
const { getApiKey } = require('./apiKeys');

async function transcreverAudioBuffer(audioBuffer, mimeType = 'audio/ogg') {
    const groqKey = getApiKey('groq');
    if (!groqKey) {
        throw new Error('Chave do Groq não configurada em apis.json');
    }

    let ext = 'ogg';
    if (mimeType.includes('mp4') || mimeType.includes('m4a')) {
        ext = 'm4a';
    } else if (mimeType.includes('mp3') || mimeType.includes('mpeg')) {
        ext = 'mp3';
    } else if (mimeType.includes('wav')) {
        ext = 'wav';
    }

    const blob = new Blob([audioBuffer], { type: mimeType });
    const form = new FormData();
    form.append('file', blob, `audio.${ext}`);
    form.append('model', 'whisper-large-v3-turbo');
    form.append('response_format', 'json');
    form.append('language', 'pt');

    const groqEndpoint = ['https:', '', 'api.groq.com', 'openai', 'v1', 'audio', 'transcriptions'].join('/');

    const response = await fetch(groqEndpoint, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${groqKey}`
        },
        body: form
    });

    if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Falha na transcrição: ${response.status}`);
    }

    const data = await response.json();
    return data.text?.trim() || '';
}

module.exports = {
    transcreverAudioBuffer
};
