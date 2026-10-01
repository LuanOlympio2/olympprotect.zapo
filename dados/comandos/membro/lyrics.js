// creditos Olympio
const axios = require('axios');
const { parseHTML } = require('linkedom');
async function getLyrics(topic) {
    try {
        const response = await axios.get(`https://solr.sscdn.co/letras/m1/?q=${encodeURIComponent(topic)}&wt=json&callback=LetrasSug`);
        if (response.status !== 200) {
            throw new Error('Erro ao buscar letra da música');
        }
        const jsonData = response.data.replace('LetrasSug(', '').replace(')\n', '');
        const parsedData = JSON.parse(jsonData);
        if (!parsedData?.response?.docs?.length) {
            throw new Error('Letra não encontrada');
        }
        const lyric = parsedData.response.docs[0];
        if (!lyric?.dns || !lyric?.url) {
            throw new Error('Letra não encontrada');
        }
        const lyricUrl = `https://www.letras.mus.br/${lyric.dns}/${lyric.url}`;
        const lyricResponse = await axios.get(lyricUrl);
        if (lyricResponse.status !== 200) {
            throw new Error('Sem resposta do servidor');
        }
        const { document } = parseHTML(lyricResponse.data);
        const title = document.querySelector('h1')?.textContent || 'Título não disponível';
        const artist = document.querySelector('h2.textStyle-secondary')?.textContent || 'Artista não disponível';
        const lyricElements = document.querySelectorAll('.lyric-original > p');
        if (!lyricElements.length) {
            throw new Error('Letra não encontrada');
        }
        const lyricsText = Array.from(lyricElements).map(p => {
            const spans = p.querySelectorAll('span.verse');
            if (spans.length) {
                return Array.from(spans)
                    .map(span => span.querySelector('span.romanization')?.textContent || '')
                    .filter(line => line)
                    .join('\n');
            }
            return p.innerHTML.split('<br>')
                .map(line => line.trim())
                .filter(line => line)
                .join('\n');
        }).filter(stanza => stanza);
        const formattedOutput = `\n🎵 *${title.replaceAll('\n', '').replaceAll('  ', '')}* 🎵\nArtista: ${artist.replaceAll('\n', '').replaceAll('  ', '')}\nURL: ${lyricUrl}\n\n📜 *Letra*:\n${lyricsText.join('\n\n')}`.trim();
        return formattedOutput;
    } catch (error) {
        throw new Error(`Erro: ${error.message}`);
    }
}
module.exports = {
    name: 'lyrics',
    description: 'Busca a letra de uma música',
    usage: '!lyrics <título ou artista>',
    aliases: ['lyrics', 'letra'],
    run: async (conn, msg, config, args, sender, senderName) => {
        if (args.length === 0) {
            return conn.sendMessage(msg.key.remoteJid, { text: 'Uso: !lyrics <título ou artista>' }, { quoted: msg });
        }
        const query = args.join(' ');
        try {
            const lyrics = await getLyrics(query);
            await conn.sendMessage(msg.key.remoteJid, { text: lyrics }, { quoted: msg });
        } catch (e) {
            await conn.sendMessage(msg.key.remoteJid, { text: `Erro ao buscar letra: ${e.message}` }, { quoted: msg });
        }
    },
};
