// creditos Olympio
function buildRpgHeader(title, icon = '') {
    const cleanTitle = String(title).replace(/[*_~`]/g, '').trim().toUpperCase();
    const iconPrefix = icon ? `${icon} ` : '';
    return `╭─〔 ${iconPrefix}*${cleanTitle}* 〕`;
}

function buildRpgDivider(sectionName = '') {
    if (sectionName) {
        const cleanName = String(sectionName).replace(/[*_~`]/g, '').trim();
        return `├─〔 *${cleanName}* 〕`;
    }
    return `├────────────────────────`;
}

function buildRpgFooter(tip = '') {
    let out = `╰────────────────────────`;
    if (tip) {
        out += `\n\n💡 _${tip}_`;
    }
    return out;
}

function formatRpgCard({ title, icon = '', lines = [], sections = [], tip = '' }) {
    let out = [buildRpgHeader(title, icon)];

    const cleanLines = (lines || []).filter(l => l !== null && l !== undefined && String(l).trim() !== '' && String(l).trim() !== '║' && String(l).trim() !== '│');
    for (const l of cleanLines) {
        const lineStr = String(l).replace(/^[║│•\s]+/, '').trim();
        if (lineStr) {
            out.push(`│ • ${lineStr}`);
        }
    }

    if (Array.isArray(sections)) {
        for (const sec of sections) {
            if (sec.title) {
                out.push(buildRpgDivider(sec.title));
            } else {
                out.push(`├────────────────────────`);
            }
            const secLines = (sec.lines || []).filter(l => l !== null && l !== undefined && String(l).trim() !== '' && String(l).trim() !== '║' && String(l).trim() !== '│');
            for (const l of secLines) {
                const lineStr = String(l).replace(/^[║│•\s]+/, '').trim();
                if (lineStr) {
                    out.push(`│ • ${lineStr}`);
                }
            }
        }
    }

    out.push(buildRpgFooter(tip));
    return out.join('\n');
}

module.exports = {
    buildRpgHeader,
    buildRpgDivider,
    buildRpgFooter,
    formatRpgCard
};
