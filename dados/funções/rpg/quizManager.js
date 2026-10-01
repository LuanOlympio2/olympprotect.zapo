// creditos Olympio
const fs = require('fs');
const path = require('path');

const questionsPath = path.resolve(__dirname, '../../database/quizQuestions.json');

class QuizManager {
  constructor() {
    this.sessions = new Map();
    this.questions = this.loadQuestions();
  }

  loadQuestions() {
    try {
      if (fs.existsSync(questionsPath)) {
        return JSON.parse(fs.readFileSync(questionsPath, 'utf8'));
      }
    } catch (e) {
      console.error('Erro ao carregar quizQuestions.json em OlympProtect:', e);
    }
    return { series: [], filmes: [], animes: [], desenhos: [] };
  }

  normalize(str) {
    if (!str || typeof str !== 'string') return '';
    let clean = str
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    clean = clean.replace(/^(e a|e o|eh a|eh o|o|a|os|as|foi a|foi o|acho que e|acho que eh|sera que e|sera que eh)\s+/, '');
    return clean.trim();
  }

  resolveCategory(arg) {
    if (!arg || typeof arg !== 'string') return null;
    const cat = this.normalize(arg);
    if (['serie', 'series', 'seriado', 'seriados'].includes(cat)) return 'series';
    if (['filme', 'filmes', 'movie', 'movies', 'cinema'].includes(cat)) return 'filmes';
    if (['anime', 'animes', 'otaku', 'animacao'].includes(cat)) return 'animes';
    if (['desenho', 'desenhos', 'cartoon', 'cartoons', 'animado'].includes(cat)) return 'desenhos';
    return null;
  }

  hasActiveQuiz(chatId) {
    return this.sessions.has(chatId);
  }

  getActiveQuiz(chatId) {
    return this.sessions.get(chatId);
  }

  startQuiz(chatId, categoryArg, initiatorJid, onTimeout) {
    if (this.sessions.has(chatId)) {
      return { active: true, session: this.sessions.get(chatId) };
    }

    const availableCats = ['series', 'filmes', 'animes', 'desenhos'];
    let chosenCat = this.resolveCategory(categoryArg);
    if (!chosenCat) {
      chosenCat = availableCats[Math.floor(Math.random() * availableCats.length)];
    }

    const catQuestions = this.questions[chosenCat] || [];
    if (catQuestions.length === 0) {
      return { error: 'Nenhuma pergunta disponível para esta categoria.' };
    }

    const question = catQuestions[Math.floor(Math.random() * catQuestions.length)];
    const rewardCoins = 200 + Math.floor(Math.random() * 201);
    const rewardXp = 150 + Math.floor(Math.random() * 151);

    const timeoutId = setTimeout(async () => {
      if (this.sessions.has(chatId)) {
        const sess = this.sessions.get(chatId);
        this.sessions.delete(chatId);
        if (typeof onTimeout === 'function') {
          try {
            await onTimeout(sess);
          } catch (e) {
            console.error('Erro no callback onTimeout do quiz:', e);
          }
        }
      }
    }, 60000);

    const session = {
      chatId,
      initiator: initiatorJid,
      question,
      category: chosenCat,
      categoryName: question.categoryName,
      rewardCoins,
      rewardXp,
      startTime: Date.now(),
      timeoutId,
      hintUsed: false
    };

    this.sessions.set(chatId, session);
    return { success: true, session };
  }

  getHint(chatId) {
    if (!this.sessions.has(chatId)) return null;
    const sess = this.sessions.get(chatId);
    sess.hintUsed = true;
    return sess.question.hint || null;
  }

  cancelQuiz(chatId) {
    if (!this.sessions.has(chatId)) return null;
    const sess = this.sessions.get(chatId);
    clearTimeout(sess.timeoutId);
    this.sessions.delete(chatId);
    return sess;
  }

  checkAnswer(chatId, userText, senderJid) {
    if (!this.sessions.has(chatId)) return null;
    const sess = this.sessions.get(chatId);
    const normUser = this.normalize(userText);
    if (!normUser || normUser.length < 1) return { correct: false };

    const isMatch = sess.question.answers.some(ans => {
      const normAns = this.normalize(ans);
      if (!normAns) return false;
      if (normUser === normAns) return true;
      if (normAns.length >= 4) {
        if (normUser.startsWith(normAns + ' ') || normUser.endsWith(' ' + normAns) || normUser.includes(' ' + normAns + ' ')) {
          return true;
        }
      }
      return false;
    });

    if (isMatch) {
      clearTimeout(sess.timeoutId);
      this.sessions.delete(chatId);
      return {
        correct: true,
        winner: senderJid,
        question: sess.question,
        categoryName: sess.categoryName,
        rewardCoins: sess.rewardCoins,
        rewardXp: sess.rewardXp
      };
    }

    return { correct: false };
  }
}

const quizManager = new QuizManager();
module.exports = quizManager;
