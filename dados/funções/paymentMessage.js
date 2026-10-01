// creditos Olympio
const { generateWAMessageFromContent } = require('baileys');
async function sendPaymentStyledText(conn, jid, text, mentionedJid = [], requestFrom = null, quoted = null) {
    const botJid = (conn.user?.id || '').split(':')[0] + '@s.whatsapp.net';
    const contextInfo = {
        mentionedJid: Array.isArray(mentionedJid) ? mentionedJid : []
    };
    if (quoted) {
        contextInfo.stanzaId = quoted.key?.id;
        contextInfo.participant = quoted.key?.participant || quoted.participant;
        contextInfo.quotedMessage = quoted.message;
    }

    const paymentObject = {
        requestPaymentMessage: {
            currencyCodeIso4217: 'BRL',
            amount1000: '0',
            requestFrom: requestFrom || botJid,
            noteMessage: {
                extendedTextMessage: {
                    text,
                    contextInfo
                }
            },
            amount: {
                value: '0',
                offset: 1000,
                currencyCode: 'BRL'
            },
            expiryTimestamp: Math.floor(Date.now() / 1000) + 86400
        }
    };
    const waMessage = await generateWAMessageFromContent(jid, paymentObject, {
        userJid: conn.user?.id || botJid
    });
    await conn.relayMessage(jid, waMessage.message, {
        messageId: waMessage.key.id
    });
    return waMessage;
}
module.exports = {
    sendPaymentStyledText,
    sendPaymentMessage: sendPaymentStyledText
};
