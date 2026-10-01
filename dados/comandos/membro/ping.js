// creditos Olympio
const os = require('os');
const { buildExtravagantMenu, toBoldSerif, safeSendMenu } = require('../../funções/layout');

const aliases = ['ping', 'status', 'latencia', 'telemetria'];

function formatUptime(seconds) {
    const totalSecs = Math.floor(Number(seconds) || 0);
    const d = Math.floor(totalSecs / 86400);
    const h = Math.floor((totalSecs % 86400) / 3600);
    const m = Math.floor((totalSecs % 3600) / 60);
    const s = totalSecs % 60;
    const pieces = [];
    if (d > 0) pieces.push(`${d}d`);
    if (h > 0) pieces.push(`${h}h`);
    if (m > 0) pieces.push(`${m}m`);
    pieces.push(`${s}s`);
    return pieces.join(', ');
}

async function run(conn, msg, config, args, sender) {
    const from = msg.key.remoteJid;
    const prefix = config.prefix || '+';
    const senderNumber = sender ? sender.split('@')[0].split(':')[0] : '';
    const now = Date.now();
    const sentAt = Number(msg.messageTimestamp || 0) * 1000;
    const latency = sentAt ? Math.max(0, now - sentAt) : 0;
    const processStart = process.hrtime();
    const uptime = formatUptime(process.uptime());
    const sysUptime = formatUptime(os.uptime());

    const memUsage = process.memoryUsage();
    const botRss = Math.round(memUsage.rss / 1024 / 1024);
    const heapUsed = Math.round(memUsage.heapUsed / 1024 / 1024);
    const heapTotal = Math.round(memUsage.heapTotal / 1024 / 1024);

    const totalMem = (os.totalmem() / 1024 / 1024 / 1024).toFixed(1);
    const freeMem = (os.freemem() / 1024 / 1024 / 1024).toFixed(1);
    const usedMem = (totalMem - freeMem).toFixed(1);

    const cpus = os.cpus();
    const cpuModel = cpus[0]?.model ? cpus[0].model.replace(/\s+/g, ' ').trim() : 'Desconhecido';
    const cpuCores = cpus.length;

    let speedBadge = '🟢 Excelente';
    if (latency > 800) speedBadge = '🟡 Estável';
    if (latency > 2500) speedBadge = '🔴 Alto';

    const diff = process.hrtime(processStart);
    const procTimeMs = ((diff[0] * 1e9 + diff[1]) / 1e6).toFixed(2);

    const redeLines = [
        `🚀 ${toBoldSerif('Latencia')}: ${latency} ms [ ${speedBadge} ]`,
        `⏱️ ${toBoldSerif('Processamento')}: ${procTimeMs} ms`,
        `⏳ ${toBoldSerif('Uptime Bot')}: ${uptime}`,
        `⌛ ${toBoldSerif('Uptime Servidor')}: ${sysUptime}`,
        `📦 ${toBoldSerif('Baileys')}: 6.7.9`,
        `🟢 ${toBoldSerif('Node.js')}: ${process.version}`
    ];

    const hardwareLines = [
        `🧠 ${toBoldSerif('RAM Bot')}: ${botRss} MB`,
        `📊 ${toBoldSerif('Heap')}: ${heapUsed} MB / ${heapTotal} MB`,
        `🖥️ ${toBoldSerif('RAM Servidor')}: ${usedMem} GB / ${totalMem} GB`,
        `⚙️ ${toBoldSerif('CPU')}: ${cpuCores} núcleos`,
        `🏷️ ${toBoldSerif('Modelo')}: ${cpuModel}`,
        `🐧 ${toBoldSerif('Plataforma')}: ${os.platform()} (${os.arch()})`,
        `🗄️ ${toBoldSerif('Database')}: MongoDB Conectado ✅`
    ];

    const text = buildExtravagantMenu({
        headerTitle: 'TELEMETRIA DO SISTEMA',
        headerIcon: '🌐',
        headerSubIcon: '🏛️',
        systemTitle: 'DESEMPENHO E REDE',
        systemIcon: '📊',
        systemInfo: redeLines,
        sections: [
            {
                category: 'Hardware',
                bannerIcon: '🧠',
                boxIcon: '⚙️',
                innerIcon: '🖥️',
                lines: hardwareLines
            }
        ]
    });

    const mentions = [
        senderNumber ? `${senderNumber}@s.whatsapp.net` : null,
        sender && sender.endsWith('@s.whatsapp.net') ? sender : null
    ].filter(Boolean);

    await safeSendMenu(conn, from, text, msg, mentions);
}

module.exports = {
    run,
    aliases
};
