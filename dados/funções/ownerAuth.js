// creditos Olympio
const { normalizeId, isBotNumber, isOwnerNumber } = require('./normalizarid');

function isOwnerSender(config, sender, msg = null, conn = null) {
    if (msg?.key?.fromMe) return true;
    if (sender && isBotNumber(sender, conn)) return true;
    if (msg?.key?.participant && isBotNumber(msg.key.participant, conn)) return true;
    if (sender && isOwnerNumber(sender)) return true;
    const senderId = normalizeId(sender);
    const ownerNumber = normalizeId(config?.ownerNumber);
    const ownerLid = normalizeId(config?.ownerlid);
    return senderId === ownerNumber || senderId === ownerLid;
}

module.exports = {
    isOwnerSender
};
