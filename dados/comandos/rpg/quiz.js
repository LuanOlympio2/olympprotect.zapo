// creditos Olympio
const quizManager = require('../../funções/rpg/quizManager');
const { verificarModoRpg } = require('../../funções/rpg/rpgHelper');

const aliases = ['quiz', 'quizrpg', 'trivia'];

async function run(conn, msg, config, args, sender, senderName) {
    const from = msg.key.remoteJid;
    const prefix = config.prefix || '!';

    if (!(await verificarModoRpg(conn, from, msg, prefix))) return;

    const subCmd = (args[0] || '').toLowerCase().trim();

    if (subCmd === 'cancelar' || subCmd === 'parar') {
        const cancelled = quizManager.cancelQuiz(from);
        if (cancelled) {
            return await conn.sendMessage(from, {
                text: `🛑 *QUIZ CANCELADO!*\n\nA rodada atual do quiz foi encerrada. Use *${prefix}quiz* para começar uma nova.`
            }, { quoted: msg });
        } else {
            return await conn.sendMessage(from, {
                text: `ℹ️ Não há nenhum quiz ativo no momento neste grupo.`
            }, { quoted: msg });
        }
    }

    if (subCmd === 'dica' || subCmd === 'ajuda' && quizManager.hasActiveQuiz(from)) {
        if (!quizManager.hasActiveQuiz(from)) {
            return await conn.sendMessage(from, {
                text: `ℹ️ Nenhum quiz está em andamento. Inicie um com *${prefix}quiz*!`
            }, { quoted: msg });
        }
        const dica = quizManager.getHint(from);
        if (dica) {
            return await conn.sendMessage(from, {
                text: `💡 *DICA DO QUIZ:*\n\n${dica}`
            }, { quoted: msg });
        } else {
            return await conn.sendMessage(from, {
                text: `⚠️ Esta pergunta não possui uma dica adicional disponível!`
            }, { quoted: msg });
        }
    }

    if (subCmd === 'categorias' || subCmd === 'cat') {
        return await conn.sendMessage(from, {
            text: `📚 *CATEGORIAS DISPONÍVEIS NO QUIZ RPG:*\n\n` +
                  `🎬 *filmes* - Obras clássicas e blockbusters\n` +
                  `📺 *series* - Seriados e sitcons marcantes\n` +
                  `🎌 *animes* - Animações japonesas icônicas\n` +
                  `🎨 *desenhos* - Desenhos animados nostálgicos e modernos\n\n` +
                  `💡 *Exemplo de uso:* *${prefix}quiz animes* ou *${prefix}quiz* (aleatório)`
        }, { quoted: msg });
    }

    if (quizManager.hasActiveQuiz(from)) {
        const active = quizManager.getActiveQuiz(from);
        return await conn.sendMessage(from, {
            text: `⚠️ *JÁ EXISTE UM QUIZ EM ANDAMENTO NESTE GRUPO!*\n\n` +
                  `📂 *Categoria:* *${active.categoryName}*\n` +
                  `❓ *Pergunta:* ${active.question.question}\n\n` +
                  `💬 Responda diretamente no chat ou use *${prefix}quiz cancelar* para encerrar!`
        }, { quoted: msg });
    }

    const categoryArg = args[0] ? args[0].toLowerCase() : null;
    const result = quizManager.startQuiz(from, categoryArg, sender, async (sess) => {
        try {
            await conn.sendMessage(from, {
                text: `⏰ *TEMPO ESGOTADO NO QUIZ RPG!* ⏰\n\n` +
                      `Ninguém acertou a pergunta a tempo!\n` +
                      `💡 *Resposta correta:* *${sess.question.answers[0]}*\n\n` +
                      `Use *${prefix}quiz* para tentar outro desafio!`
            });
        } catch (eTime) {
            console.error('Erro ao enviar timeout do quiz:', eTime);
        }
    });

    if (result.error) {
        return await conn.sendMessage(from, {
            text: `❌ ${result.error}`
        }, { quoted: msg });
    }

    const sess = result.session;
    const startMsg = `🧠 *DESAFIO DO QUIZ RPG* 🧠\n\n` +
                     `📂 *Categoria:* *${sess.categoryName}*\n` +
                     `❓ *Pergunta:* ${sess.question.question}\n\n` +
                     `💰 *Recompensa:* +${sess.rewardCoins} Moedas de Ouro\n` +
                     `⭐ *XP:* +${sess.rewardXp} XP\n` +
                     `⏱️ *Tempo Limite:* 60 segundos\n\n` +
                     `💡 *Dica:* Digite *${prefix}quiz dica* se precisar de auxílio!\n` +
                     `💬 *Para responder:* Basta enviar a resposta diretamente no chat!`;

    await conn.sendMessage(from, {
        text: startMsg
    }, { quoted: msg });
}

module.exports = {
    name: 'quiz',
    description: 'Quiz interativo com perguntas de animes, filmes, desenhos e séries para o RPG',
    aliases,
    run
};
