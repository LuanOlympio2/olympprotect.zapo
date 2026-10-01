// creditos Olympio
const fs = require('fs');
const path = require('path');
const lidCache = require('./lidCache');
const { isOwnerSender } = require('./ownerAuth');
const { isUserAdmin } = require('./normalizarid');

const menuImagePath = path.resolve(__dirname, '../midias/menu.png');
let cachedImageBuffer = null;

const smallCapsMap = {
    'a': 'ᴀ', 'b': 'ʙ', 'c': 'ᴄ', 'd': 'ᴅ', 'e': 'ᴇ', 'f': 'ꜰ', 'g': 'ɢ',
    'h': 'ʜ', 'i': 'ɪ', 'j': 'ᴊ', 'k': 'ᴋ', 'l': 'ʟ', 'm': 'ᴍ', 'n': 'ɴ',
    'o': 'ᴏ', 'p': 'ᴘ', 'q': 'ǫ', 'r': 'ʀ', 's': 's', 't': 'ᴛ', 'u': 'ᴜ',
    'v': 'ᴠ', 'w': 'ᴡ', 'x': 'x', 'y': 'ʏ', 'z': 'ᴢ',
    'á': 'á', 'à': 'à', 'ã': 'ã', 'â': 'â', 'é': 'é', 'ê': 'ê', 'í': 'í',
    'ó': 'ó', 'ô': 'ô', 'õ': 'õ', 'ú': 'ú', 'ç': 'ç'
};

function toSmallCaps(str) {
    if (!str) return '';
    return String(str).split('').map(char => {
        const lower = char.toLowerCase();
        return smallCapsMap[lower] || char;
    }).join('');
}

function toBoldSerif(str) {
    if (!str) return '';
    return String(str).replace(/[A-Za-z]/g, c => {
        const code = c.charCodeAt(0);
        return String.fromCodePoint(code >= 97 ? 0x1D41A + (code - 97) : 0x1D400 + (code - 65));
    });
}

function toBoldItalicSerif(str) {
    if (!str) return '';
    return String(str).replace(/[A-Za-z]/g, c => {
        const code = c.charCodeAt(0);
        return String.fromCodePoint(code >= 97 ? 0x1D482 + (code - 97) : 0x1D468 + (code - 65));
    });
}

function toSansBoldItalic(str) {
    if (!str) return '';
    return String(str).replace(/[A-Za-z]/g, c => {
        const code = c.charCodeAt(0);
        return String.fromCodePoint(code >= 97 ? 0x1D656 + (code - 97) : 0x1D63C + (code - 65));
    });
}

function getMenuImage() {
    if (cachedImageBuffer) return cachedImageBuffer;
    if (fs.existsSync(menuImagePath)) {
        try {
            cachedImageBuffer = fs.readFileSync(menuImagePath);
            return cachedImageBuffer;
        } catch (_) {
            return null;
        }
    }
    return null;
}

function buildProgressBar(percentage, size = 8) {
    const validPercent = Math.max(0, Math.min(100, Number(percentage) || 0));
    const filledCount = Math.round((validPercent / 100) * size);
    const emptyCount = size - filledCount;
    const filledBar = '█'.repeat(filledCount);
    const emptyBar = '░'.repeat(emptyCount);
    return `[${filledBar}${emptyBar}]`;
}

function buildStars(count = 5) {
    return Array(count).fill('★').join('    ');
}

function buildOrnateCard({ title, subtitle, infoLines = [], sections = [], tip, stars = 5 }) {
    const divider = '╠════ ≪ • ❖ • ≫ ════╣\n';
    let out = '╔════ ≪ • ❖ • ≫ ════╗\n';
    out += `║  ⚜️ *${toSmallCaps(title)}* ⚜️\n`;
    if (subtitle) {
        out += `║  🏛️ _${toSmallCaps(subtitle)}_\n`;
    }
    if (infoLines.length > 0) {
        out += divider;
        for (const line of infoLines) {
            out += `║ ${line}\n`;
        }
    }
    if (sections.length > 0) {
        for (const sec of sections) {
            if (sec.title) {
                out += `╠══ ≪ ${toSmallCaps(sec.title)} ≫ ══╣\n`;
            } else {
                out += divider;
            }
            if (Array.isArray(sec.lines)) {
                for (const l of sec.lines) {
                    out += `║ ${l}\n`;
                }
            } else if (sec.content) {
                out += `║ ${sec.content}\n`;
            }
        }
    }
    out += divider;
    if (tip) {
        out += `║ 💡 _${tip}_\n`;
    }
    out += `║ ${buildStars(stars)}\n`;
    out += '╚════ ≪ • ❖ • ≫ ════╝';
    return out;
}

function buildPlayCard({ title, subtitle, icon = '🎭', infoLines = [], result = '', lines = [] }) {
    let out = `╭═════ • ${icon} • ═════╮\n`;
    out += `│ ✦ *${title}* ✦\n`;
    if (subtitle) {
        out += `│ _${subtitle}_\n`;
    }
    if (infoLines.length > 0) {
        out += '├──────────────────┤\n';
        for (const l of infoLines) {
            out += `│ ${l}\n`;
        }
    }
    if (result) {
        out += '├───── • 💬 • ─────┤\n';
        out += `│ _${result}_\n`;
    }
    if (lines.length > 0) {
        out += '├───── • 🏆 • ─────┤\n';
        for (const l of lines) {
            out += `│ ${l}\n`;
        }
    }
    out += '│\n';
    out += '│ ★ ★ ★ ★ ★\n';
    out += '╰═════ ≪ ✦ ★ ✦ ≫ ═════╯';
    return out;
}

function buildOlympicMenu({
    title = '𝑶𝑳𝒀𝑴𝑷 𝑷𝑹𝑶𝑻𝑬𝑪𝑻',
    titleIcon = '🏛️',
    infoLines = [],
    sections = [],
    footerIcons = '🏛️ • ★ • ★ • ★ • 🏛️'
}) {
    let out = `╭─━━━〔 ${titleIcon} • ${title} 〕━━━─╮\n┃\n`;
    if (infoLines.length > 0) {
        for (const line of infoLines) {
            out += `┃ ${line}\n`;
        }
        out += '┃\n';
    }
    if (sections.length > 0) {
        for (const sec of sections) {
            out += `┣─━━━〔 ${sec.icon || '⚔️'} • ${sec.title} 〕━━━─┫\n┃\n`;
            if (Array.isArray(sec.commands)) {
                for (const cmd of sec.commands) {
                    out += `┃ ${sec.cmdIcon || '✧'} ${cmd}\n`;
                }
            } else if (Array.isArray(sec.lines)) {
                for (const l of sec.lines) {
                    out += `┃ ${l}\n`;
                }
            }
            out += '┃\n';
        }
    }
    out += `╰─━━━〔 ${footerIcons} 〕━━━─╯`;
    return out;
}

function buildExtravagantMenu({
    headerTitle = '𝑶 𝑳 𝒀 𝑴 𝑷 • 𝑷 𝑹 𝑶 𝑻 𝑬 𝑪 𝑻',
    headerIcon = '⚜️',
    headerSubIcon = '🏛️',
    systemTitle = 'PAINEL DO SISTEMA',
    systemIcon = '👑',
    systemInfo = [],
    sections = [],
    footerIcons = '✦ ★ ✦'
}) {
    let out = '';
    out += `╔═════ ≪ • ${headerIcon} • ≫ ═════╗\n`;
    out += `║  ✦  *${headerTitle}*  ✦\n`;
    out += `╚═════ ≪ • ${headerSubIcon} • ≫ ═════╝\n`;
    out += ' ║\n';

    const hasSys = systemInfo.length > 0;
    const hasSec = sections.length > 0;

    if (hasSys) {
        out += `╭═════ • ${systemIcon === '👑' ? '🏛️' : systemIcon} • ═════╮\n`;
        out += `│╭──── ≪ • ${systemIcon} • ≫ ────╮\n`;
        out += `││ ✦ ${toBoldSerif(systemTitle)} ✦\n`;
        out += '││\n';
        for (const line of systemInfo) {
            out += `││ ✦ ${line}\n`;
        }
        out += '││\n';
        out += `│╰──── ≪ • ${systemIcon} • ≫ ────╯\n`;
    }

    if (hasSec) {
        for (let i = 0; i < sections.length; i++) {
            const sec = sections[i];
            const isLast = (i === sections.length - 1);
            if (!hasSys && i === 0) {
                out += `╭═════ • ${sec.bannerIcon || '🏛️'} • ═════╮\n`;
            }
            if (sec.category) {
                out += `├───── • ${sec.bannerIcon || '⚔️'} • ─────┤\n`;
                out += `│ ✦ ≪ ${toBoldItalicSerif(sec.category)} ≫ ✦\n`;
                out += `├───── • ${sec.boxIcon || '🛡️'} • ─────┤\n`;
            } else if (hasSys || i > 0) {
                out += `├───── • ${sec.boxIcon || '🛡️'} • ─────┤\n`;
            }
            out += `│╭──── ≪ • ${sec.innerIcon || '⚜️'} • ≫ ────╮\n`;
            out += '││\n';
            if (Array.isArray(sec.commands)) {
                for (const cmd of sec.commands) {
                    out += `││ ✧ ${sec.cmdIcon ? sec.cmdIcon + ' ' : ''}${cmd}\n`;
                }
            } else if (Array.isArray(sec.lines)) {
                for (const l of sec.lines) {
                    out += `││ ✧ ${l}\n`;
                }
            }
            if (isLast) {
                out += '││ ★ ★ ★ ★ ★\n';
            }
            out += `│╰──── ≪ • ${sec.innerIcon || '⚜️'} • ≫ ────╯\n`;
            if (isLast) {
                out += `╰═════ ≪ ${footerIcons} ≫ ═════╯`;
            }
        }
    } else if (hasSys) {
        out += `╰═════ ≪ ${footerIcons} ≫ ═════╯`;
    }

    return out;
}

function formatUserHeader(sender, senderName, prefix, options = {}) {
    let cleanSender = sender ? String(sender).split('@')[0].split(':')[0] : '';
    let isLid = !cleanSender || cleanSender.startsWith('82781') || cleanSender.length > 13 || (sender && String(sender).includes('@lid'));

    if (isLid && sender) {
        const cachedJid = lidCache.getJid(sender);
        if (cachedJid) {
            const cachedNum = cachedJid.split('@')[0].split(':')[0];
            if (cachedNum && !cachedNum.startsWith('82781') && cachedNum.length <= 13) {
                cleanSender = cachedNum;
                isLid = false;
            }
        }
    }

    const userTag = `@${cleanSender}`;
    const lines = [
        `👤 *${toSmallCaps('usuário')}:* ${userTag}`,
        `🔱 *${toSmallCaps('prefixo')}:* [ ${prefix} ]`
    ];
    if (options.role) {
        lines.push(`🎖️ *${toSmallCaps('patente')}:* ${options.role}`);
    }
    return lines;
}

function sanitizeMentions(mentionsList = []) {
    const clean = [];
    for (const item of mentionsList) {
        if (!item || typeof item !== 'string') continue;
        let jid = item;
        if (jid.endsWith('@lid')) {
            const resolved = lidCache.getJid(jid);
            if (resolved && resolved.endsWith('@s.whatsapp.net')) {
                jid = resolved;
            } else {
                continue;
            }
        }
        const userPart = jid.split('@')[0].split(':')[0];
        if (!userPart) {
            continue;
        }
        const netJid = `${userPart}@s.whatsapp.net`;
        if (!clean.includes(netJid)) {
            clean.push(netJid);
        }
    }
    return clean;
}

async function safeSendMenu(conn, from, text, msg, mentions = [], options = {}) {
    const sendOptions = msg ? { quoted: msg } : {};
    let rawMentions = Array.isArray(mentions) ? [...mentions] : [];
    if (msg && msg.key && msg.key.participant) {
        rawMentions.push(msg.key.participant);
    }
    const numbersInText = text.match(/@([0-9]{5,20})/g) || [];
    for (const match of numbersInText) {
        const num = match.replace('@', '');
        rawMentions.push(`${num}@s.whatsapp.net`);
    }
    const cleanMentions = sanitizeMentions(rawMentions);

    if (options.withImage) {
        const img = getMenuImage();
        if (img) {
            try {
                await conn.sendMessage(from, {
                    image: img,
                    caption: text,
                    mentions: cleanMentions
                }, sendOptions);
                return;
            } catch (eImg) {
                console.error('Falha ao enviar menu com imagem:', eImg?.message || eImg);
            }
        }
    }

    try {
        await conn.sendMessage(from, {
            text,
            mentions: cleanMentions
        }, sendOptions);
    } catch (eQuoted) {
        console.error('Falha ao enviar menu com quoted:', eQuoted?.message || eQuoted);
        try {
            await conn.sendMessage(from, {
                text,
                mentions: cleanMentions
            });
        } catch (eRaw) {
            console.error('Falha fatal ao enviar menu:', eRaw?.message || eRaw);
        }
    }
}

function buildSimilarityCard({ command, suggestion, prefix = '+' }) {
    let out = '╔═════ ≪ • ⚠️ • ≫ ═════╗\n';
    out += '║  ✦  *COMANDO NÃO ENCONTRADO*  ✦\n';
    out += '╚═════ ≪ • 🏛️ • ≫ ═════╝\n ║\n';
    out += '╭═════ • ⚠️ • ═════╮\n';
    const displayTyped = command ? `${prefix}${command}` : prefix;
    if (suggestion) {
        out += '│╭──── ≪ • 💡 • ≫ ────╮\n';
        out += `││ ✦ ${toBoldSerif('Sugestao')} ✦\n`;
        out += '││\n';
        out += `││ ❌ ${toBoldSerif('Digitado')}: *${displayTyped}*\n`;
        out += `││ 💡 ${toBoldSerif('Voce quis dizer')}: *${prefix}${suggestion}* ?\n`;
        out += '││\n';
        out += `││ ✦ Digite *${prefix}${suggestion}* para executar\n`;
        out += '││\n';
        out += '││ ★ ★ ★ ★ ★\n';
        out += '│╰──── ≪ • 💡 • ≫ ────╯\n';
    } else {
        out += '│╭──── ≪ • ❓ • ≫ ────╮\n';
        out += `││ ✦ ${toBoldSerif('Aviso')} ✦\n`;
        out += '││\n';
        out += `││ ❌ O comando *${displayTyped}* não existe.\n`;
        out += '││\n';
        out += `││ ✦ Use *${prefix}menu* para ver os comandos\n`;
        out += '││\n';
        out += '││ ★ ★ ★ ★ ★\n';
        out += '│╰──── ≪ • ❓ • ≫ ────╯\n';
    }
    out += '╰═════ ≪ ✦ ★ ✦ ≫ ═════╯';
    return out;
}

function buildPrefixCard(prefix = '+', botName = 'OlympProtect') {
    let out = '╔═════ ≪ • 🔱 • ≫ ═════╗\n';
    out += '║  ✦  *INFORMAÇÃO DO SISTEMA*  ✦\n';
    out += '╚═════ ≪ • 🏛️ • ≫ ═════╝\n ║\n';
    out += '╭═════ • 🏛️ • ═════╮\n';
    out += '│╭──── ≪ • 🔱 • ≫ ────╮\n';
    out += `││ ✦ ${toBoldSerif('Prefixo do Bot')} ✦\n`;
    out += '││\n';
    out += `││ ✦ O prefixo atual é: [ *${prefix}* ]\n`;
    out += `││ ✦ Exemplo de uso: *${prefix}menu*\n`;
    out += `││ ✦ Para ver opções: *${prefix}ajuda*\n`;
    out += '││\n';
    out += '││ ★ ★ ★ ★ ★\n';
    out += '│╰──── ≪ • 🔱 • ≫ ────╯\n';
    out += '╰═════ ≪ ✦ ★ ✦ ≫ ═════╯';
    return out;
}

async function getExtravagantSystemInfo(config, sender, from, msg, conn) {
    const isGroup = from.endsWith('@g.us');
    let cleanSender = sender ? sender.split('@')[0].split(':')[0] : '';
    let isLid = !cleanSender || cleanSender.startsWith('82781') || cleanSender.length > 13 || (sender && String(sender).includes('@lid'));
    if (isLid && sender) {
        const cachedJid = lidCache.getJid(sender);
        if (cachedJid) {
            const cachedNum = cachedJid.split('@')[0].split(':')[0];
            if (cachedNum && !cachedNum.startsWith('82781') && cachedNum.length <= 13) {
                cleanSender = cachedNum;
                isLid = false;
            }
        }
    }

    let role = 'Membro';
    const isOwner = isOwnerSender(config, sender, msg) || isOwnerSender(config, msg?.key?.participant || from, msg);
    if (isOwner) {
        role = 'Proprietário 👑';
    } else if (isGroup && conn?.groupMetadata) {
        try {
            const groupMetadata = await conn.groupMetadata(from).catch(() => null);
            if (groupMetadata && isUserAdmin(groupMetadata, sender)) {
                role = 'Administrador 🛡️';
            }
        } catch (_) {}
    }

    const prefix = config.prefix || '+';
    const systemInfo = [
        `👤 ${toBoldSerif('Usuario')}: @${cleanSender}`,
        `👑 ${toBoldSerif('Cargo')}: ${role}`,
        `🔱 ${toBoldSerif('Dono')}: ${config.ownerName || "I'm Olympio"}`,
        `🔱 ${toBoldSerif('Prefixo')}: [ ${prefix} ]`
    ];

    const rawMentions = [
        cleanSender ? `${cleanSender}@s.whatsapp.net` : null,
        sender
    ].filter(Boolean);

    const mentions = sanitizeMentions(rawMentions);

    return { systemInfo, cleanSender, role, mentions, prefix };
}

function buildX9Card({ type = 'MENSAGEM APAGADA', icon = '🚨', authorTag = '', time = '', content = '', extraInfo = '' }) {
    let out = '╔═════ ≪ • 🚨 • ≫ ═════╗\n';
    out += '║  ✦  *OLYMP • RADAR X9*  ✦\n';
    out += '╚═════ ≪ • 🏛️ • ≫ ═════╝\n ║\n';
    out += '╭═════ • 🕵️ • ═════╮\n';
    out += `│╭──── ≪ • ${icon} • ≫ ────╮\n`;
    out += `││ ✦ ${toBoldSerif(type)} ✦\n`;
    out += '││\n';
    if (authorTag) {
        out += `││ 👤 ${toBoldSerif('Infrator')}: @${authorTag}\n`;
    }
    if (time) {
        out += `││ 🕒 ${toBoldSerif('Horario')}: ${time}\n`;
    }
    if (extraInfo) {
        out += `││ 📌 ${toBoldSerif('Acao')}: ${extraInfo}\n`;
    }
    if (content) {
        out += '││\n';
        out += `││ 💬 ${toBoldSerif('Conteudo')}:\n`;
        out += `││ "${content}"\n`;
    }
    out += '││\n';
    out += '││ ★ ★ ★ ★ ★\n';
    out += `│╰──── ≪ • ${icon} • ≫ ────╯\n`;
    out += '╰═════ ≪ ✦ ★ ✦ ≫ ═════╯';
    return out;
}

function buildDownloadCard({
    title = 'DOWNLOAD',
    subtitle = '',
    icon = '📥',
    source = '',
    duration = '',
    author = '',
    quality = '',
    status = '',
    tip = ''
}) {
    let out = `╔═════ ≪ • ${icon} • ≫ ═════╗\n`;
    out += `║  ✦  *${toBoldSerif('OLYMP DOWNLOADER')}*  ✦\n`;
    out += `╚═════ ≪ • 🏛️ • ≫ ═════╝\n ║\n`;
    out += `╭═════ • ${icon} • ═════╮\n`;
    out += `│╭──── ≪ • 💫 • ≫ ────╮\n`;
    out += `││ ✦ ${toBoldSerif(title)} ✦\n`;
    if (subtitle) {
        out += `││ 📌 _${subtitle}_\n`;
    }
    out += '││\n';
    if (source) out += `││ 📡 ${toBoldSerif('Origem')}: ${source}\n`;
    if (author) out += `││ 👤 ${toBoldSerif('Autor')}: ${author}\n`;
    if (duration) out += `││ ⏱️ ${toBoldSerif('Duracao')}: ${duration}\n`;
    if (quality) out += `││ 📊 ${toBoldSerif('Qualidade')}: ${quality}\n`;
    if (status) out += `││ 📥 ${toBoldSerif('Status')}: ${status}\n`;
    if (tip) {
        out += '││\n';
        out += `││ 💡 ${tip}\n`;
    }
    out += '││\n';
    out += '││ ★ ★ ★ ★ ★\n';
    out += `│╰──── ≪ • 💫 • ≫ ────╯\n`;
    out += '╰═════ ≪ ✦ ★ ✦ ≫ ═════╯';
    return out;
}

function buildActionCard({
    header = 'PAINEL DE ADMINISTRAÇÃO',
    headerIcon = '🛡️',
    title = 'AÇÃO EXECUTADA',
    icon = '⚖️',
    lines = [],
    alert = '',
    tip = ''
}) {
    let out = `╔═════ ≪ • ${headerIcon} • ≫ ═════╗\n`;
    out += `║  ✦  *${toBoldSerif(header)}*  ✦\n`;
    out += `╚═════ ≪ • 🏛️ • ≫ ═════╝\n ║\n`;
    out += `╭═════ • ${headerIcon} • ═════╮\n`;
    out += `│╭──── ≪ • ${icon} • ≫ ────╮\n`;
    out += `││ ✦ ${toBoldSerif(title)} ✦\n`;
    out += '││\n';
    for (const line of lines) {
        out += `││ ${line}\n`;
    }
    if (alert) {
        out += '││\n';
        out += `││ ⚠️ ${alert}\n`;
    }
    if (tip) {
        out += '││\n';
        out += `││ 💡 ${tip}\n`;
    }
    out += '││\n';
    out += '││ ★ ★ ★ ★ ★\n';
    out += `│╰──── ≪ • ${icon} • ≫ ────╯\n`;
    out += '╰═════ ≪ ✦ ★ ✦ ≫ ═════╯';
    return out;
}

module.exports = {
    toSmallCaps,
    toBoldSerif,
    toBoldItalicSerif,
    toSansBoldItalic,
    buildProgressBar,
    buildStars,
    buildOrnateCard,
    buildExtravagantMenu,
    buildOlympicMenu,
    formatUserHeader,
    safeSendMenu,
    buildPlayCard,
    getExtravagantSystemInfo,
    buildSimilarityCard,
    buildPrefixCard,
    buildX9Card,
    buildDownloadCard,
    buildActionCard,
    sanitizeMentions
};
