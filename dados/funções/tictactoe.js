// creditos Olympio
const { compareIds, normalizeId, formatUserTag, getMentionJids } = require('./normalizarid');

const CONFIG = {
    INVITATION_TIMEOUT_MS: 15 * 60 * 1000,
    GAME_TIMEOUT_MS: 30 * 60 * 1000,
    MOVE_TIMEOUT_MS: 5 * 60 * 1000,
    CLEANUP_INTERVAL_MS: 5 * 60 * 1000,
    BOARD_SIZE: 9,
    SYMBOLS: { X: '❌', O: '⭕' },
    EMPTY_CELLS: ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣'],
};

const getUserTag = (userId) => {
    return formatUserTag(userId);
};

class TicTacToe {
    constructor(player1, player2) {
        this.board = [...CONFIG.EMPTY_CELLS];
        this.players = { X: player1, O: player2 };
        this.currentTurn = 'X';
        this.moves = 0;
        this.startTime = Date.now();
        this.lastMoveTime = Date.now();
        this.winner = null;
    }

    makeMove(player, position) {
        const expectedPlayer = this.players[this.currentTurn];
        if (!compareIds(player, expectedPlayer)) {
            return { success: false, reason: 'not_your_turn' };
        }

        const index = parseInt(position, 10) - 1;
        if (isNaN(index) || index < 0 || index >= CONFIG.BOARD_SIZE) {
            return { success: false, reason: 'invalid_position' };
        }

        if (!CONFIG.EMPTY_CELLS.includes(this.board[index])) {
            return { success: false, reason: 'position_taken' };
        }

        this.board[index] = CONFIG.SYMBOLS[this.currentTurn];
        this.moves++;
        this.lastMoveTime = Date.now();

        if (this._checkWin()) {
            this.winner = this.players[this.currentTurn];
            return { success: true, status: 'win', winner: this.winner };
        }

        if (this.moves === CONFIG.BOARD_SIZE) {
            return { success: true, status: 'draw' };
        }

        this.currentTurn = this.currentTurn === 'X' ? 'O' : 'X';
        return { success: true, status: 'continue', nextPlayer: this.players[this.currentTurn] };
    }

    renderBoard() {
        return `╭─────────────╮\n` +
               `│  ${this.board[0]}  ${this.board[1]}  ${this.board[2]}  │\n` +
               `│  ${this.board[3]}  ${this.board[4]}  ${this.board[5]}  │\n` +
               `│  ${this.board[6]}  ${this.board[7]}  ${this.board[8]}  │\n` +
               `╰─────────────╯`;
    }

    _checkWin() {
        const patterns = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8],
            [0, 3, 6], [1, 4, 7], [2, 5, 8],
            [0, 4, 8], [2, 4, 6]
        ];
        const symbol = CONFIG.SYMBOLS[this.currentTurn];
        return patterns.some(p => p.every(i => this.board[i] === symbol));
    }
}

class GameManager {
    constructor() {
        this.activeGames = new Map();
        this.pendingInvitations = new Map();
        setInterval(() => this._cleanup(), CONFIG.CLEANUP_INTERVAL_MS);
    }

    invitePlayer(groupId, inviter, invitee) {
        if (!groupId || !inviter || !invitee || compareIds(inviter, invitee)) {
            return this._formatResponse(false, '❌ Dados inválidos para o convite ou você tentou jogar consigo mesmo!');
        }

        if (this.activeGames.has(groupId) || this.pendingInvitations.has(groupId)) {
            return this._formatResponse(false, '❌ Já existe um jogo ou convite em andamento neste grupo! Termine-o ou use *!fimjogo*.');
        }

        this.pendingInvitations.set(groupId, { inviter, invitee, timestamp: Date.now() });

        const message = `🎮 *CONVITE PARA JOGO DA VELHA*\n\n` +
                        `👤 ${getUserTag(inviter)} convidou ${getUserTag(invitee)} para um duelo!\n\n` +
                        `👉 Para aceitar, ${getUserTag(invitee)} deve digitar: *sim* ou *s*\n` +
                        `👉 Para recusar, digite: *nao* ou *n*\n\n` +
                        `⏳ _O convite expira em 15 minutos._`;

        return this._formatResponse(true, message, { mentions: [inviter, invitee] });
    }

    processInvitationResponse(groupId, invitee, response) {
        const invitation = this.pendingInvitations.get(groupId);
        if (!invitation || !compareIds(invitation.invitee, invitee)) {
            return this._formatResponse(false, '❌ Nenhum convite pendente para você.');
        }

        const normalizedResponse = response.toLowerCase().trim();
        const isAccepted = ['s', 'sim', 'y', 'yes'].includes(normalizedResponse);
        const isRejected = ['n', 'não', 'nao', 'no'].includes(normalizedResponse);

        if (!isAccepted && !isRejected) {
            return this._formatResponse(false, '❌ Resposta inválida. Use "sim" ou "não".');
        }

        this.pendingInvitations.delete(groupId);

        if (isRejected) {
            return this._formatResponse(true, `❌ ${getUserTag(invitee)} recusou o convite. Duelo cancelado!`, { mentions: [invitation.inviter, invitee] });
        }

        const game = new TicTacToe(invitation.inviter, invitation.invitee);
        this.activeGames.set(groupId, game);

        const message = `🎮 *JOGO DA VELHA INICIADO!*\n\n` +
                        `👥 *Jogadores:*\n` +
                        `➤ ${CONFIG.SYMBOLS.X}: ${getUserTag(invitation.inviter)}\n` +
                        `➤ ${CONFIG.SYMBOLS.O}: ${getUserTag(invitation.invitee)}\n\n` +
                        `${game.renderBoard()}\n\n` +
                        `👉 Vez de ${getUserTag(invitation.inviter)}! Digite o número da casa (1 a 9).`;

        return this._formatResponse(true, message, { mentions: [invitation.inviter, invitee] });
    }

    makeMove(groupId, player, position) {
        const game = this.activeGames.get(groupId);
        if (!game) {
            return this._formatResponse(false, '❌ Nenhum jogo da velha em andamento neste grupo!');
        }

        if (Date.now() - game.lastMoveTime > CONFIG.MOVE_TIMEOUT_MS) {
            this.activeGames.delete(groupId);
            return this._formatResponse(false, '❌ Jogo encerrado por inatividade (5 minutos sem jogadas).', { mentions: Object.values(game.players) });
        }

        const result = game.makeMove(player, position);

        if (!result.success) {
            const errorMessages = {
                'not_your_turn': '❌ Não é a sua vez de jogar!',
                'invalid_position': '❌ Posição inválida! Escolha um número de 1 a 9.',
                'position_taken': '❌ Essa casa já está ocupada! Escolha outra.'
            };
            return this._formatResponse(false, errorMessages[result.reason] || '❌ Jogada inválida.');
        }

        if (result.status === 'win') {
            this.activeGames.delete(groupId);
            const message = `🎉 *FIM DE JOGO - VITÓRIA!* 🏆\n\n` +
                            `👑 O vencedor foi ${getUserTag(result.winner)}!\n\n` +
                            `${game.renderBoard()}`;
            return this._formatResponse(true, message, { finished: true, winner: result.winner, mentions: [result.winner] });
        }

        if (result.status === 'draw') {
            this.activeGames.delete(groupId);
            const message = `🤝 *FIM DE JOGO - DEU VELHA!* 🤝\n\n` +
                            `Partida empatada, ninguém conseguiu alinhar três símbolos!\n\n` +
                            `${game.renderBoard()}`;
            return this._formatResponse(true, message, { finished: true, draw: true, mentions: Object.values(game.players) });
        }

        if (result.status === 'continue') {
            const message = `🎮 *JOGO DA VELHA*\n\n` +
                            `${game.renderBoard()}\n\n` +
                            `👉 Vez de ${getUserTag(result.nextPlayer)}! Digite um número de 1 a 9.`;
            return this._formatResponse(true, message, { finished: false, mentions: [result.nextPlayer] });
        }
    }

    endGame(groupId) {
        if (!this.activeGames.has(groupId)) {
            return this._formatResponse(false, '❌ Nenhum jogo da velha em andamento para encerrar!');
        }
        const players = Object.values(this.activeGames.get(groupId).players);
        this.activeGames.delete(groupId);
        return this._formatResponse(true, '🛑 O jogo da velha foi encerrado manualmente!', { mentions: players });
    }

    hasActiveGame(groupId) {
        return this.activeGames.has(groupId);
    }

    getActiveGame(groupId) {
        return this.activeGames.get(groupId);
    }

    hasPendingInvitation(groupId) {
        return this.pendingInvitations.has(groupId);
    }

    getPendingInvitation(groupId) {
        return this.pendingInvitations.get(groupId);
    }

    _formatResponse(success, message, extras = {}) {
        if (Array.isArray(extras.mentions)) {
            const resolvedMentions = [];
            extras.mentions.forEach(m => {
                getMentionJids(m).forEach(j => {
                    if (!resolvedMentions.includes(j)) resolvedMentions.push(j);
                });
            });
            extras.mentions = resolvedMentions;
        }
        return { success, message, ...extras };
    }

    _cleanup() {
        const now = Date.now();
        for (const [groupId, game] of this.activeGames.entries()) {
            if (now - game.startTime > CONFIG.GAME_TIMEOUT_MS) {
                this.activeGames.delete(groupId);
            }
        }
        for (const [groupId, invitation] of this.pendingInvitations.entries()) {
            if (now - invitation.timestamp > CONFIG.INVITATION_TIMEOUT_MS) {
                this.pendingInvitations.delete(groupId);
            }
        }
    }
}

const manager = new GameManager();

module.exports = {
    invitePlayer: (...args) => manager.invitePlayer(...args),
    processInvitationResponse: (...args) => manager.processInvitationResponse(...args),
    makeMove: (...args) => manager.makeMove(...args),
    endGame: (...args) => manager.endGame(...args),
    hasActiveGame: (...args) => manager.hasActiveGame(...args),
    getActiveGame: (...args) => manager.getActiveGame(...args),
    hasPendingInvitation: (...args) => manager.hasPendingInvitation(...args),
    getPendingInvitation: (...args) => manager.getPendingInvitation(...args)
};
