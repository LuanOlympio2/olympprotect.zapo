// creditos Olympio
const fs = require('fs-extra');
const path = require('path');
const moment = require('moment-timezone');
const { buildPlayCard, toSmallCaps } = require('./layout');
const { normalizeId } = require('./normalizarid');

const DB_FILE = path.resolve(__dirname, '../database/lembretes.json');

class LembreteManager {
    constructor() {
        this.lembretes = [];
        this.conn = null;
        this.activeTimeouts = new Map();
        this._load();
    }

    _load() {
        try {
            if (fs.existsSync(DB_FILE)) {
                this.lembretes = fs.readJsonSync(DB_FILE) || [];
            } else {
                this.lembretes = [];
            }
        } catch (e) {
            console.error('Erro ao carregar lembretes:', e);
            this.lembretes = [];
        }
    }

    _save() {
        try {
            fs.ensureDirSync(path.dirname(DB_FILE));
            fs.writeJsonSync(DB_FILE, this.lembretes, { spaces: 2 });
        } catch (e) {
            console.error('Erro ao salvar lembretes:', e);
        }
    }

    init(conn) {
        this.conn = conn;
        const now = Date.now();

        for (const t of this.activeTimeouts.values()) {
            clearTimeout(t);
        }
        this.activeTimeouts.clear();

        for (const lembrete of this.lembretes) {
            const delay = lembrete.notifyAt - now;
            if (delay <= 0) {
                this._triggerReminder(lembrete);
            } else {
                this._scheduleTimeout(lembrete, delay);
            }
        }
    }

    _scheduleTimeout(lembrete, delay) {
        const safeDelay = Math.min(delay, 2147483647);
        const timeout = setTimeout(() => {
            if (delay > safeDelay) {
                this._scheduleTimeout(lembrete, lembrete.notifyAt - Date.now());
            } else {
                this._triggerReminder(lembrete);
            }
        }, safeDelay);

        this.activeTimeouts.set(lembrete.id, timeout);
    }

    async _triggerReminder(lembrete) {
        try {
            this.activeTimeouts.delete(lembrete.id);
            this.lembretes = this.lembretes.filter(l => l.id !== lembrete.id);
            this._save();

            if (!this.conn) return;

            const senderNum = normalizeId(lembrete.sender);
            const dataAgendado = moment(lembrete.createdAt).tz('America/Sao_Paulo').format('HH:mm (DD/MM)');
            const dataAgora = moment().tz('America/Sao_Paulo').format('HH:mm:ss');

            const card = buildPlayCard({
                title: 'LEMBRETE PROGRAMADO',
                subtitle: 'Alerta do Sistema',
                icon: '⏰',
                infoLines: [
                    `👤 *${toSmallCaps('para')}:* @${senderNum}`,
                    `🕒 *${toSmallCaps('agendado em')}:* ${dataAgendado}`,
                    `🔔 *${toSmallCaps('disparado em')}:* ${dataAgora} (Brasília)`
                ],
                result: `📝 *Seu Lembrete:*\n"${lembrete.text}"`
            });

            await this.conn.sendMessage(lembrete.from, {
                text: card,
                mentions: [`${senderNum}@s.whatsapp.net`]
            });
        } catch (error) {
            console.error('Erro ao disparar lembrete:', error);
        }
    }

    parseDuration(str) {
        if (!str || typeof str !== 'string') return null;
        const clean = str.trim().toLowerCase();
        const match = clean.match(/^(\d+)\s*(s|seg|segundos?|m|min|minutos?|h|horas?|d|dias?)$/);
        if (!match) return null;

        const value = parseInt(match[1], 10);
        const unit = match[2];

        if (isNaN(value) || value <= 0) return null;

        let ms = 0;
        let unitName = '';

        if (unit.startsWith('s')) {
            ms = value * 1000;
            unitName = `${value} segundo(s)`;
        } else if (unit.startsWith('m')) {
            ms = value * 60 * 1000;
            unitName = `${value} minuto(s)`;
        } else if (unit.startsWith('h')) {
            ms = value * 60 * 60 * 1000;
            unitName = `${value} hora(s)`;
        } else if (unit.startsWith('d')) {
            ms = value * 24 * 60 * 60 * 1000;
            unitName = `${value} dia(s)`;
        }

        if (ms > 30 * 24 * 60 * 60 * 1000) return null;

        return { ms, unitName, value };
    }

    createReminder({ from, sender, senderName, text, durationMs, durationText }) {
        const id = `rem_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
        const notifyAt = Date.now() + durationMs;

        const item = {
            id,
            from,
            sender,
            senderName: senderName || 'Usuário',
            text,
            durationText,
            createdAt: Date.now(),
            notifyAt
        };

        this.lembretes.push(item);
        this._save();

        if (this.conn) {
            this._scheduleTimeout(item, durationMs);
        }

        return item;
    }
}

const lembreteManager = new LembreteManager();

module.exports = lembreteManager;
