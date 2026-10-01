// creditos Olympio
const fs = require('fs');
const path = require('path');
const COMMANDS_ROOT = path.resolve(__dirname, '../comandos');
function walkCommands(dir, files = []) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            walkCommands(full, files);
        } else if (entry.isFile() && entry.name.endsWith('.js')) {
            files.push(full);
        }
    }
    return files;
}
function buildCommandCatalog() {
    const files = walkCommands(COMMANDS_ROOT);
    const commands = [];
    for (const file of files) {
        try {
            const mod = require(file);
            const name = mod.name || path.basename(file, '.js');
            commands.push({
                name,
                aliases: mod.aliases || [name],
                description: mod.description || '',
                category: path.basename(path.dirname(file)),
                file,
                source: fs.readFileSync(file, 'utf8')
            });
        } catch (_) {}
    }
    return commands;
}
function getRelevantCommands(question, catalog) {
    const lower = question.toLowerCase();
    const matches = catalog.filter((command) => {
        const names = [command.name, ...(command.aliases || [])];
        return names.some((name) => lower.includes(String(name).toLowerCase()));
    });
    return matches.slice(0, 6);
}
module.exports = {
    buildCommandCatalog,
    getRelevantCommands
};
