const axios = require('axios');
const cheerio = require('cheerio');

const MAX_BYTES = 100 * 1024 * 1024;
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

async function searchArchiveOrg(query) {
    try {
        const searchUrl = `https://archive.org/advancedsearch.php?q=title:(${encodeURIComponent(query)})%20AND%20mediatype:texts&fl[]=identifier,title,creator,downloads&sort[]=downloads%20desc&rows=3&output=json`;
        const { data } = await axios.get(searchUrl, {
            headers: { 'User-Agent': USER_AGENT },
            timeout: 8000
        });

        const docs = data.response?.docs || [];
        for (const doc of docs) {
            if (!doc.identifier) continue;
            try {
                const metaUrl = `https://archive.org/metadata/${doc.identifier}/files`;
                const { data: meta } = await axios.get(metaUrl, {
                    headers: { 'User-Agent': USER_AGENT },
                    timeout: 8000
                });

                const files = meta.result || [];
                const pdfFile = files.find(f => f.name && f.name.toLowerCase().endsWith('.pdf') && !f.name.includes('_text'));
                if (pdfFile) {
                    const downloadUrl = `https://archive.org/download/${doc.identifier}/${encodeURIComponent(pdfFile.name)}`;
                    const sizeBytes = Number(pdfFile.size) || 0;
                    return {
                        title: doc.title || query,
                        author: Array.isArray(doc.creator) ? doc.creator.join(', ') : (doc.creator || 'Desconhecido'),
                        downloadUrl,
                        sizeBytes,
                        source: 'Internet Archive'
                    };
                }
            } catch (_) {}
        }
    } catch (_) {}
    return null;
}

async function searchOpenLibrary(query) {
    try {
        const searchUrl = `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&fields=title,author_name,ia,has_fulltext&limit=5`;
        const { data } = await axios.get(searchUrl, {
            headers: { 'User-Agent': USER_AGENT },
            timeout: 8000
        });

        const docs = data.docs || [];
        for (const doc of docs) {
            if (!doc.ia || !Array.isArray(doc.ia) || doc.ia.length === 0) continue;
            for (const identifier of doc.ia) {
                try {
                    const metaUrl = `https://archive.org/metadata/${identifier}/files`;
                    const { data: meta } = await axios.get(metaUrl, {
                        headers: { 'User-Agent': USER_AGENT },
                        timeout: 7000
                    });

                    const files = meta.result || [];
                    const pdfFile = files.find(f => f.name && f.name.toLowerCase().endsWith('.pdf') && !f.name.includes('_text'));
                    if (pdfFile) {
                        const downloadUrl = `https://archive.org/download/${identifier}/${encodeURIComponent(pdfFile.name)}`;
                        const sizeBytes = Number(pdfFile.size) || 0;
                        return {
                            title: doc.title || query,
                            author: Array.isArray(doc.author_name) ? doc.author_name.join(', ') : (doc.author_name || 'Desconhecido'),
                            downloadUrl,
                            sizeBytes,
                            source: 'Open Library'
                        };
                    }
                } catch (_) {}
            }
        }
    } catch (_) {}
    return null;
}

async function searchLibgen(query) {
    try {
        const searchUrl = `https://libgen.li/index.php?req=${encodeURIComponent(query)}&columns%5B%5D=t&objects%5B%5D=f&topics%5B%5D=l`;
        const { data } = await axios.get(searchUrl, {
            headers: { 'User-Agent': USER_AGENT },
            timeout: 9000
        });

        const ch = cheerio.load(data);
        const rows = ch('#tablelibgen tbody tr');
        if (rows.length === 0) return null;

        for (let i = 0; i < Math.min(rows.length, 10); i++) {
            const el = rows[i];
            const title = ch(el).find('td:nth-child(1) a').text().trim();
            const author = ch(el).find('td:nth-child(2)').text().trim();
            const ext = ch(el).find('td:nth-child(8)').text().trim().toLowerCase();
            const adsHref = ch(el).find('td:nth-child(9) a').attr('href');

            if (!adsHref || !ext.includes('pdf')) continue;

            const fullAdsUrl = adsHref.startsWith('http') ? adsHref : `https://libgen.li/${adsHref.replace(/^\//, '')}`;
            try {
                const { data: adsHtml } = await axios.get(fullAdsUrl, {
                    headers: { 'User-Agent': USER_AGENT },
                    timeout: 7000
                });
                const chAds = cheerio.load(adsHtml);
                let getHref = null;
                chAds('a').each((_, a) => {
                    const text = chAds(a).text().trim().toLowerCase();
                    const href = chAds(a).attr('href');
                    if (text === 'get' || href?.includes('get.php')) {
                        getHref = href;
                        return false;
                    }
                });

                if (getHref) {
                    const downloadUrl = getHref.startsWith('http') ? getHref : `https://libgen.li/${getHref.replace(/^\//, '')}`;
                    return {
                        title: title.split('\n')[0].trim() || query,
                        author: author || 'Desconhecido',
                        downloadUrl,
                        sizeBytes: 0,
                        source: 'LibGen'
                    };
                }
            } catch (_) {}
        }
    } catch (_) {}
    return null;
}

async function buscarLivroPDF(query) {
    if (!query || typeof query !== 'string') return null;
    const cleanQuery = query.trim();

    let book = await searchArchiveOrg(cleanQuery);
    if (!book) {
        book = await searchOpenLibrary(cleanQuery);
    }
    if (!book) {
        book = await searchLibgen(cleanQuery);
    }

    if (!book) return null;

    if (book.sizeBytes > MAX_BYTES) {
        return {
            title: book.title,
            author: book.author,
            source: book.source,
            downloadUrl: book.downloadUrl,
            sizeMb: (book.sizeBytes / (1024 * 1024)).toFixed(1),
            isTooLarge: true
        };
    }

    try {
        const response = await axios.get(book.downloadUrl, {
            headers: { 'User-Agent': USER_AGENT },
            responseType: 'arraybuffer',
            timeout: 45000,
            maxContentLength: MAX_BYTES
        });

        const buffer = Buffer.from(response.data);
        const actualSizeMb = (buffer.length / (1024 * 1024)).toFixed(1);

        return {
            title: book.title,
            author: book.author,
            source: book.source,
            downloadUrl: book.downloadUrl,
            buffer,
            sizeMb: actualSizeMb,
            isTooLarge: false
        };
    } catch (err) {
        return {
            title: book.title,
            author: book.author,
            source: book.source,
            downloadUrl: book.downloadUrl,
            sizeMb: book.sizeBytes ? (book.sizeBytes / (1024 * 1024)).toFixed(1) : '?',
            isTooLarge: true
        };
    }
}

module.exports = {
    buscarLivroPDF,
    searchArchiveOrg,
    searchOpenLibrary,
    searchLibgen
};
