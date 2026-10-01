// creditos Olympio
const fs = require('fs-extra');
const path = require('path');
const { normalizeId } = require('../../funções/normalizarid');
const TAKE_PATH = path.resolve(__dirname, '../../database/take.json');
module.exports = {
    name: 'rgtake',
    aliases: ['rgtake'],
    category: 'membro',
    description: 'Registra autor e pacote padrão para o comando take.',
    run: async (conn, msg, config, args, sender) => {
        const from = msg.key.remoteJid;
        const q = args.join(' ').trim();
        if (!q) {
            return conn.sendMessage(from, {
                text: `Formato errado.\nUse: ${config.prefix}rgtake Autor/Pack\nEx: ${config.prefix}rgtake Olymp/Protect`
            }, { quoted: msg });
        }
        let author = '';
        let pack = '';
        if (q.includes('/')) {
            author = q.split('/')[0] || '';
            pack = q.split('/')[1] || '';
        } else {
            pack = q;
        }
        if (!pack) {
            return conn.sendMessage(from, {
                text: `Formato errado.\nUse: ${config.prefix}rgtake Autor/Pack`
            }, { quoted: msg });
        }
        try {
            const dataTake = fs.existsSync(TAKE_PATH) ? await fs.readJson(TAKE_PATH) : {};
            dataTake[normalizeId(sender)] = { author, pack };
            await fs.writeJson(TAKE_PATH, dataTake, { spaces: 2 });
            await conn.sendMessage(from, {
                text: `Registro salvo com sucesso.\nAutor: ${author || '(vazio)'}\nPacote: ${pack}`
            }, { quoted: msg });
        } catch (e) {
            console.error('Erro no comando rgtake:', e);
            await conn.sendMessage(from, { text: 'Não consegui salvar seu registro de take agora.' }, { quoted: msg });
        }
    }
};
