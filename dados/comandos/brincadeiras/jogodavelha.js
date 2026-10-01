// creditos Olympio
const tictactoe = require('../../funções/tictactoe');
const { compareIds, findParticipant, resolveToPhoneJid } = require('../../funções/normalizarid');

const aliases = ['jogodavelha', 'ttt', 'velha', 'fimjogo', 'tttend', 'rv'];

async function run(conn, msg, config, args, sender, senderName) {
    const from = msg.key.remoteJid;
    const isGroup = from.endsWith('@g.us');
    const prefix = config.prefix || '+';

    if (!isGroup) {
        return await conn.sendMessage(from, { 
            text: '⚠️ O jogo da velha só pode ser jogado dentro de grupos!' 
        }, { quoted: msg });
    }

    const fullText = msg.message?.conversation || 
                     msg.message?.extendedTextMessage?.text || 
                     msg.message?.imageMessage?.caption || 
                     msg.message?.videoMessage?.caption || '';

    let commandUsed = '';
    if (fullText.startsWith(prefix)) {
        commandUsed = fullText.slice(prefix.length).trim().split(/\s+/)[0].toLowerCase();
    } else {
        commandUsed = aliases.find(a => fullText.toLowerCase().includes(a)) || aliases[0];
    }

    if (['fimjogo', 'tttend', 'rv'].includes(commandUsed)) {
        const result = tictactoe.endGame(from);
        return await conn.sendMessage(from, { 
            text: result.message,
            mentions: result.mentions || []
        }, { quoted: msg });
    }

    const contextInfo = msg.message?.extendedTextMessage?.contextInfo;
    let targetJid = null;

    if (contextInfo?.participant) {
        targetJid = contextInfo.participant;
    } else if (contextInfo?.mentionedJid && contextInfo.mentionedJid.length > 0) {
        targetJid = contextInfo.mentionedJid[0];
    }

    if (!targetJid) {
        return await conn.sendMessage(from, { 
            text: `🎮 *JOGO DA VELHA*\n\n👉 Para desafiar alguém, marque o oponente:\n*${prefix}jogodavelha @usuario* ou responda a mensagem dele!\n\n_Para encerrar um jogo em andamento: *${prefix}fimjogo*_`
        }, { quoted: msg });
    }

    if (compareIds(targetJid, sender)) {
        return await conn.sendMessage(from, { 
            text: '❌ Você não pode desafiar a si mesmo! Escolha outro membro do grupo.' 
        }, { quoted: msg });
    }

    const groupMetadata = await conn.groupMetadata(from).catch(() => null);
    if (groupMetadata?.participants) {
        targetJid = resolveToPhoneJid(targetJid, groupMetadata.participants);
    }

    const result = tictactoe.invitePlayer(from, sender, targetJid);
    await conn.sendMessage(from, { 
        text: result.message,
        mentions: result.mentions || []
    }, { quoted: msg });
}

module.exports = {
    name: 'jogodavelha',
    description: 'Jogo da Velha em dupla no grupo',
    aliases,
    run
};
