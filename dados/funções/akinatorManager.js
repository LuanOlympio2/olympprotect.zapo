// creditos Olympio
const { compareIds, normalizeId, formatUserTag, getMentionJids } = require('./normalizarid');

const TIMEOUT_MS = 3 * 60 * 1000;

class NativeAkinatorClient {
    constructor(options = {}) {
        this.language = options.language || options.region || 'pt';
        this.theme = options.theme || 1;
        this.childMode = options.childMode || false;
        this.baseUrl = `https://${this.language}.akinator.com`;
        this.cookies = '';
        this.sessionToken = '';
        this.question = '';
        this.step = 1;
        this.progression = 0;
        this.stepLastProposition = '';
        this.won = false;
        this.ko = false;
        this.winResult = null;
        this.history = [];
    }

    async _getScraping() {
        const { gotScraping } = await import('got-scraping');
        return gotScraping;
    }

    async start() {
        const gotScraping = await this._getScraping();
        const r1 = await gotScraping({ url: `${this.baseUrl}/` });
        const c1 = r1.headers['set-cookie'] || [];

        const r2 = await gotScraping({
            url: `${this.baseUrl}/game`,
            method: 'POST',
            body: `sid=${this.theme}&cm=${this.childMode ? 'true' : 'false'}`,
            headers: {
                'content-type': 'application/x-www-form-urlencoded',
                cookie: c1.map(c => c.split(';')[0]).join('; ')
            }
        });

        const c2 = r2.headers['set-cookie'] || [];
        this.cookies = [...c1, ...c2].map(c => c.split(';')[0]).join('; ');

        const sessionMatch = r2.body.match(/name="session" id="session" value="([^"]+)"/) ||
                             r2.body.match(/session:\s*['"]([^'"]+)['"]/) ||
                             r2.body.match(/localStorage\.setItem\(['"]session['"],\s*['"]([^'"]+)['"]\)/);
        const qMatch = r2.body.match(/<p[^>]+id="question-label"[^>]*>([\s\S]*?)<\/p>/i);

        if (!sessionMatch || !qMatch) {
            throw new Error('Falha ao extrair sessão do Akinator');
        }

        this.sessionToken = sessionMatch[1];
        this.question = qMatch[1].replace(/<[^>]+>/g, '').trim();
        this.step = 1;
        this.progression = 0;
        this.stepLastProposition = '';
        this.won = false;
        this.ko = false;
        this.winResult = null;
        this.history = [{ step: 1, question: this.question, progression: 0 }];

        return {
            won: false,
            ko: false,
            step: 1,
            progression: 0,
            question: this.question
        };
    }

    async answer(answerCode) {
        if (this.won || this.ko) return null;

        const gotScraping = await this._getScraping();
        const payload = new URLSearchParams({
            step: String(this.step),
            progression: String(this.progression),
            sid: String(this.theme),
            cm: this.childMode ? 'true' : 'false',
            answer: String(answerCode),
            step_last_proposition: String(this.stepLastProposition || ''),
            session: this.sessionToken
        });

        const res = await gotScraping({
            url: `${this.baseUrl}/answer`,
            method: 'POST',
            body: payload.toString(),
            headers: {
                'content-type': 'application/x-www-form-urlencoded',
                cookie: this.cookies,
                'x-requested-with': 'XMLHttpRequest',
                referer: `${this.baseUrl}/game`
            }
        });

        const data = JSON.parse(res.body);

        if (data.id_proposition) {
            this.won = true;
            this.winResult = {
                name: data.name_proposition || '',
                description: data.description_proposition || '',
                pictureUrl: data.photo || '',
                id: data.id_proposition,
                pseudo: data.pseudo || ''
            };
            this.progression = 100;
            return { won: true, winResult: this.winResult };
        }

        if (data.completion === 'OK') {
            this.step = data.step;
            this.progression = data.progression;
            this.question = data.question;
            this.history.push({ step: data.step, question: data.question, progression: data.progression });
            return { won: false, question: data.question, step: data.step, progression: data.progression };
        }

        if (data.completion === 'KO') {
            this.ko = true;
            return { ko: true };
        }

        throw new Error('Falha na resposta do Akinator');
    }

    async back() {
        if (this.history.length <= 1) {
            throw new Error('Não é possível voltar mais');
        }

        const gotScraping = await this._getScraping();
        const payload = new URLSearchParams({
            step: String(this.step),
            progression: String(this.progression),
            sid: String(this.theme),
            cm: this.childMode ? 'true' : 'false',
            session: this.sessionToken
        });

        const res = await gotScraping({
            url: `${this.baseUrl}/cancel_answer`,
            method: 'POST',
            body: payload.toString(),
            headers: {
                'content-type': 'application/x-www-form-urlencoded',
                cookie: this.cookies,
                'x-requested-with': 'XMLHttpRequest',
                referer: `${this.baseUrl}/game`
            }
        });

        const data = JSON.parse(res.body);
        this.history.pop();
        const prev = this.history[this.history.length - 1];
        this.step = data.step || prev.step;
        this.progression = data.progression ?? prev.progression;
        this.question = data.question || prev.question;

        return { question: this.question, step: this.step, progression: this.progression };
    }
}

class AkinatorManager {
    constructor() {
        this.sessions = new Map();
    }

    hasSession(chatId) {
        return this.sessions.has(chatId);
    }

    getSession(chatId) {
        return this.sessions.get(chatId);
    }

    async startSession(chatId, userId, userName = 'Jogador') {
        if (this.sessions.has(chatId)) {
            return {
                success: false,
                message: '❌ Já existe uma partida de Akinator em andamento neste chat! Envie *sair* ou *cancelar* para encerrar.'
            };
        }

        try {
            const aki = new NativeAkinatorClient({ region: 'pt' });
            await aki.start();

            const timer = setTimeout(() => {
                this.endSession(chatId, 'timeout');
            }, TIMEOUT_MS);

            this.sessions.set(chatId, {
                chatId,
                userId,
                userName,
                aki,
                timer,
                lastActivity: Date.now()
            });

            const text = this._renderQuestionCard(aki, userId, userName);
            return {
                success: true,
                message: text,
                mentions: getMentionJids(userId)
            };
        } catch (error) {
            console.error('Erro ao iniciar Akinator:', error);
            return {
                success: false,
                message: '❌ Ocorreu um erro ao conectar aos servidores do Akinator. Tente novamente em alguns instantes.'
            };
        }
    }

    async handleInput(chatId, senderId, textInput) {
        const session = this.sessions.get(chatId);
        if (!session) return null;

        const cleanInput = (textInput || '').trim().toLowerCase();

        if (['cancelar', 'sair', 'parar', 'fim', 'cancelaraki', 'fimaki'].includes(cleanInput)) {
            if (!compareIds(session.userId, senderId)) {
                return {
                    success: false,
                    ignored: true
                };
            }
            this.endSession(chatId, 'cancelled');
            return {
                success: true,
                status: 'cancelled',
                message: '🛑 Partida de Akinator cancelada com sucesso.',
                mentions: [session.userId]
            };
        }

        if (!compareIds(session.userId, senderId)) {
            return null;
        }

        if (['voltar', 'volte', 'desfazer', 'back'].includes(cleanInput)) {
            this._resetTimer(session);
            try {
                if (session.aki.history.length <= 1) {
                    return {
                        success: false,
                        message: '⚠️ Você já está na primeira pergunta, não é possível voltar mais!',
                        mentions: [session.userId]
                    };
                }
                await session.aki.back();
                const card = this._renderQuestionCard(session.aki, session.userId, session.userName);
                return {
                    success: true,
                    status: 'question',
                    message: `⏪ Jogada desfeita!\n\n${card}`,
                    mentions: [session.userId]
                };
            } catch (err) {
                return {
                    success: false,
                    message: '❌ Não foi possível voltar a jogada anterior.',
                    mentions: [session.userId]
                };
            }
        }

        let answerCode = null;
        if (cleanInput === '0' || cleanInput === 'sim' || cleanInput === 's' || cleanInput === 'yes' || cleanInput === 'y') {
            answerCode = 0;
        } else if (cleanInput === '1' || cleanInput === 'não' || cleanInput === 'nao' || cleanInput === 'n' || cleanInput === 'no') {
            answerCode = 1;
        } else if (cleanInput === '2' || cleanInput === 'não sei' || cleanInput === 'nao sei' || cleanInput === 'ns' || cleanInput === 'sei la' || cleanInput === 'sei lá') {
            answerCode = 2;
        } else if (cleanInput === '3' || cleanInput === 'provavelmente sim' || cleanInput === 'provavelmente' || cleanInput === 'ps' || cleanInput === 'talvez sim') {
            answerCode = 3;
        } else if (cleanInput === '4' || cleanInput === 'provavelmente não' || cleanInput === 'provavelmente nao' || cleanInput === 'pn' || cleanInput === 'talvez não' || cleanInput === 'talvez nao') {
            answerCode = 4;
        }

        if (answerCode === null) {
            return null;
        }

        this._resetTimer(session);

        try {
            await session.aki.answer(answerCode);

            if (session.aki.won || session.aki.winResult?.name) {
                const winResult = session.aki.winResult;
                const guessName = winResult?.name || 'Seu personagem';
                const description = winResult?.description || 'Sem descrição';
                const photoUrl = winResult?.pictureUrl || '';
                const progress = Math.round(session.aki.progression || 100);

                this.endSession(chatId, 'won');

                const winMessage = `🎉 *AKINATOR ACERTOU!* 🧞‍♂️\n\n` +
                                   `👤 *Personagem:* ${guessName}\n` +
                                   `📝 *Descrição:* ${description}\n` +
                                   `🎯 *Certeza:* ${progress}%\n` +
                                   `🔢 *Perguntas:* ${session.aki.history.length}\n\n` +
                                   `Obrigado por jogar comigo, @${normalizeId(session.userId)}!`;

                return {
                    success: true,
                    status: 'won',
                    message: winMessage,
                    image: photoUrl || null,
                    mentions: [session.userId]
                };
            }

            if (session.aki.ko) {
                this.endSession(chatId, 'ko');
                return {
                    success: true,
                    status: 'ko',
                    message: `😔 *O Akinator se rende!*\n\nVocê me venceu, @${normalizeId(session.userId)}! Não consegui descobrir em quem você estava pensando. Parabéns! 👏`,
                    mentions: [session.userId]
                };
            }

            const card = this._renderQuestionCard(session.aki, session.userId, session.userName);
            return {
                success: true,
                status: 'question',
                message: card,
                mentions: [session.userId]
            };
        } catch (error) {
            console.error('Erro ao responder Akinator:', error);
            return {
                success: false,
                message: '❌ Ocorreu uma falha ao enviar sua resposta ao Akinator. Tente novamente!',
                mentions: [session.userId]
            };
        }
    }

    _renderQuestionCard(aki, userId, userName) {
        const step = aki.history.length;
        const prog = Math.round(aki.progression || 0);
        const userTag = formatUserTag(userId);

        return `╭━━━〔 🧞‍♂️ *AKINATOR* 〕━━━╮\n` +
               `┃ 👤 *Jogador:* ${userTag}\n` +
               `┃ 📊 *Progresso:* ${prog}% | Pergunta: ${step}\n` +
               `╰━━━━━━━━━━━━━━━━━━━━╯\n\n` +
               `❓ *${aki.question}*\n\n` +
               `0️⃣ - *Sim*\n` +
               `1️⃣ - *Não*\n` +
               `2️⃣ - *Não sei*\n` +
               `3️⃣ - *Provavelmente sim*\n` +
               `4️⃣ - *Provavelmente não*\n\n` +
               `💡 _Envie o número ou a palavra._\n` +
               `⏪ _Envie *voltar* para desfazer ou *cancelar* para parar._`;
    }

    _resetTimer(session) {
        if (session.timer) clearTimeout(session.timer);
        session.timer = setTimeout(() => {
            this.endSession(session.chatId, 'timeout');
        }, TIMEOUT_MS);
        session.lastActivity = Date.now();
    }

    endSession(chatId, reason = 'manual') {
        const session = this.sessions.get(chatId);
        if (session) {
            if (session.timer) clearTimeout(session.timer);
            this.sessions.delete(chatId);
        }
        return session;
    }
}

const akinatorManager = new AkinatorManager();

module.exports = akinatorManager;
