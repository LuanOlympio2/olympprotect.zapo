// creditos Olympio
const fs = require('fs-extra');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');
const yts = require('yt-search');
const execPromise = promisify(exec);

function getYtDlpBinary() {
    const rootDir = process.cwd();
    const localLinux = path.join(rootDir, 'yt-dlp');
    if (fs.existsSync(localLinux)) {
        return localLinux;
    }
    const localWindows = path.join(rootDir, 'yt-dlp.exe');
    if (fs.existsSync(localWindows)) {
        return localWindows;
    }
    return 'yt-dlp';
}

function getCookiesArg() {
    const cookiesPath = path.join(process.cwd(), 'cookies.txt');
    if (fs.existsSync(cookiesPath)) {
        return `--cookies "${cookiesPath}"`;
    }
    return '';
}

function getJsRuntimeArg() {
    const homeDir = process.env.HOME || '';
    const denoPath = path.join(homeDir, '.deno', 'bin', 'deno');
    if (fs.existsSync(denoPath)) {
        return `--js-runtimes deno:"${denoPath}"`;
    }
    return '';
}

async function downloadAudio(query, outputPath) {
    const bin = getYtDlpBinary();
    const cookies = getCookiesArg();
    const jsRuntime = getJsRuntimeArg();
    const isUrl = /((https?:\/\/)|(www\.))[^\s]+/.test(query);

    if (isUrl) {
        const cmd = `"${bin}" -x --audio-format mp3 --no-playlist --force-overwrites ${cookies} ${jsRuntime} -o "${outputPath}" "${query}"`;
        await execPromise(cmd, { timeout: 120000 });
        if (fs.existsSync(outputPath)) {
            return {
                title: 'Áudio Baixado',
                duration: 'Disponível',
                source: 'Link Direto'
            };
        }
    }

    let searchResults = null;
    try {
        searchResults = await yts(query);
    } catch (_) {}

    const videos = searchResults?.videos || [];
    const candidates = videos.slice(0, 5);

    for (const candidate of candidates) {
        try {
            if (candidate.seconds > 900) continue;
            const cmd = `"${bin}" -x --audio-format mp3 --no-playlist --force-overwrites ${cookies} ${jsRuntime} -o "${outputPath}" "${candidate.url}"`;
            await execPromise(cmd, { timeout: 90000 });
            if (fs.existsSync(outputPath)) {
                return {
                    title: candidate.title,
                    duration: candidate.timestamp,
                    source: 'YouTube'
                };
            }
        } catch (_) {}
    }

    const soundcloudQuery = `scsearch1:${query}`;
    const scCmd = `"${bin}" -x --audio-format mp3 --no-playlist --force-overwrites ${cookies} -o "${outputPath}" "${soundcloudQuery}"`;
    await execPromise(scCmd, { timeout: 90000 });

    if (fs.existsSync(outputPath)) {
        return {
            title: query,
            duration: 'Áudio Oficial',
            source: 'SoundCloud'
        };
    }

    throw new Error('Música não encontrada em nenhuma fonte disponível.');
}

async function downloadVideo(query, outputPath) {
    const bin = getYtDlpBinary();
    const cookies = getCookiesArg();
    const jsRuntime = getJsRuntimeArg();
    const isUrl = /((https?:\/\/)|(www\.))[^\s]+/.test(query);

    if (isUrl) {
        const cmd = `"${bin}" -f "bv*+ba/b" --merge-output-format mp4 --no-playlist --force-overwrites ${cookies} ${jsRuntime} -o "${outputPath}" "${query}"`;
        await execPromise(cmd, { timeout: 180000 });
        if (fs.existsSync(outputPath)) {
            return {
                title: 'Vídeo Baixado',
                duration: 'Disponível'
            };
        }
    }

    let searchResults = null;
    try {
        searchResults = await yts(query);
    } catch (_) {}

    const videos = searchResults?.videos || [];
    const candidates = videos.slice(0, 5);

    for (const candidate of candidates) {
        try {
            if (candidate.seconds > 900) continue;
            const cmd = `"${bin}" -f "bv*+ba/b" --merge-output-format mp4 --no-playlist --force-overwrites ${cookies} ${jsRuntime} -o "${outputPath}" "${candidate.url}"`;
            await execPromise(cmd, { timeout: 120000 });
            if (fs.existsSync(outputPath)) {
                return {
                    title: candidate.title,
                    duration: candidate.timestamp
                };
            }
        } catch (_) {}
    }

    throw new Error('Vídeo não encontrado ou bloqueado.');
}

async function downloadMediaGeneric(url, outputPath, format = 'video') {
    const bin = getYtDlpBinary();
    const cookies = getCookiesArg();
    const jsRuntime = getJsRuntimeArg();
    const formatArg = format === 'audio' ? '-x --audio-format mp3' : '-f "bv*+ba/b" --merge-output-format mp4';
    const cmd = `"${bin}" ${formatArg} --no-playlist --force-overwrites ${cookies} ${jsRuntime} -o "${outputPath}" "${url}"`;
    await execPromise(cmd, { timeout: 120000 });
    if (!fs.existsSync(outputPath)) {
        throw new Error('Falha no download da mídia.');
    }
    return true;
}

module.exports = {
    getYtDlpBinary,
    getCookiesArg,
    getJsRuntimeArg,
    downloadAudio,
    downloadVideo,
    downloadMediaGeneric
};
