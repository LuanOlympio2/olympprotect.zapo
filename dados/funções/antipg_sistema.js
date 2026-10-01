// creditos Olympio
const antiPgRecentBans = new Map();
const undecryptedBurstMap = new Map();
setInterval(() => {
    const now = Date.now();
    for (const [k, v] of antiPgRecentBans.entries()) {
        if (now - v > 60000) antiPgRecentBans.delete(k);
    }
    for (const [k, list] of undecryptedBurstMap.entries()) {
        const active = list.filter(t => now - t < 20000);
        if (active.length === 0) undecryptedBurstMap.delete(k);
        else undecryptedBurstMap.set(k, active);
    }
}, 30000);

const INVISIBLE_TRIGGER_CHARS = /[\u00AD\u115F\u1160\u17B4\u17B5\u180E\u200B\u200C\u2060-\u2064\u2800\u3164\uFFA0\uFEFF\u{E0001}-\u{E007F}]/u;

function isTextInvisibleExploit(text) {
    if (typeof text !== 'string' || text.length === 0) return false;
    if (!INVISIBLE_TRIGGER_CHARS.test(text)) return false;

    const strippedWhitespace = text.replace(/[\s\r\n\t]/g, '');
    if (strippedWhitespace.length === 0) return false;

    const strippedEmojis = strippedWhitespace.replace(/\p{Extended_Pictographic}/gu, '');
    const strippedEmojiModifiers = strippedEmojis.replace(/[\u200D\uFE0E\uFE0F\u{1F3FB}-\u{1F3FF}]/gu, '');
    const visibleOnly = strippedEmojiModifiers.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F\u00AD\u061C\u115F\u1160\u17B4\u17B5\u180E\u200B-\u200F\u202A-\u202E\u2060-\u206F\u2800\u3164\uFFA0\uFEFF\uFFF9-\uFFFB\u{E0001}-\u{E007F}]/gu, '');

    if (visibleOnly.length === 0) return true;

    const invisibleCount = (strippedEmojiModifiers.match(/[\u00AD\u115F\u1160\u200B\u200C\u2060-\u2064\u2800\u3164\uFFA0\uFEFF]/g) || []).length;
    if (invisibleCount >= 50) return true;

    return false;
}

function unwrapMessage(msg) {
    if (!msg || typeof msg !== 'object') return null;
    let curr = msg;
    let depth = 0;
    while (curr && typeof curr === 'object' && depth < 10) {
        depth++;
        if (curr.ephemeralMessage?.message) curr = curr.ephemeralMessage.message;
        else if (curr.viewOnceMessage?.message) curr = curr.viewOnceMessage.message;
        else if (curr.viewOnceMessageV2?.message) curr = curr.viewOnceMessageV2.message;
        else if (curr.viewOnceMessageV2Extension?.message) curr = curr.viewOnceMessageV2Extension.message;
        else if (curr.documentWithCaptionMessage?.message) curr = curr.documentWithCaptionMessage.message;
        else if (curr.deviceSentMessage?.message) curr = curr.deviceSentMessage.message;
        else if (curr.botInvokeMessage?.message) curr = curr.botInvokeMessage.message;
        else break;
    }
    return curr;
}

function extractText(message) {
    if (!message) return '';
    const unwrapped = unwrapMessage(message) || message;
    let text = (
        unwrapped.conversation
        ?? unwrapped.extendedTextMessage?.text
        ?? unwrapped.imageMessage?.caption
        ?? unwrapped.videoMessage?.caption
        ?? unwrapped.documentMessage?.caption
        ?? unwrapped.buttonsResponseMessage?.selectedDisplayText
        ?? unwrapped.listResponseMessage?.title
        ?? unwrapped.requestPaymentMessage?.noteMessage?.extendedTextMessage?.text
        ?? unwrapped.requestPaymentMessage?.noteMessage?.conversation
        ?? unwrapped.sendPaymentMessage?.noteMessage?.extendedTextMessage?.text
        ?? unwrapped.sendPaymentMessage?.noteMessage?.conversation
        ?? unwrapped.interactiveMessage?.body?.text
        ?? ''
    );
    return text || '';
}

function hasPaymentMessage(value, depth = 0, seenObjects = new WeakSet()) {
    if (!value || typeof value !== 'object' || depth > 10 || seenObjects.has(value)) {
        return false;
    }
    seenObjects.add(value);

    const unwrapped = depth === 0 ? (unwrapMessage(value) || value) : value;

    if (depth === 0 && value.ephemeralMessage) {
        const isLegitimateMedia = !!(
            unwrapped.imageMessage ||
            unwrapped.videoMessage ||
            unwrapped.audioMessage ||
            unwrapped.stickerMessage ||
            unwrapped.documentMessage ||
            unwrapped.contactMessage ||
            unwrapped.contactsArrayMessage ||
            unwrapped.locationMessage ||
            unwrapped.liveLocationMessage ||
            unwrapped.reactionMessage ||
            unwrapped.pollCreationMessage ||
            unwrapped.pollCreationMessageV2 ||
            unwrapped.pollCreationMessageV3 ||
            unwrapped.pollUpdateMessage ||
            unwrapped.protocolMessage ||
            unwrapped.senderKeyDistributionMessage
        );
        const text = extractText(value);
        if (!isLegitimateMedia) {
            if (isTextInvisibleExploit(text)) {
                return true;
            }
            if ((unwrapped.extendedTextMessage || unwrapped.conversation !== undefined) && (!text || text.trim().length === 0)) {
                return true;
            }
        }
    }

    const directText = extractText(unwrapped);
    if (directText && isTextInvisibleExploit(directText)) {
        return true;
    }

    if (
        unwrapped.requestPaymentMessage ||
        unwrapped.sendPaymentMessage ||
        unwrapped.paymentInviteMessage ||
        unwrapped.cancelPaymentRequestMessage ||
        unwrapped.declinePaymentRequestMessage ||
        unwrapped.orderMessage ||
        unwrapped.invoiceMessage
    ) {
        return true;
    }

    if (unwrapped.interactiveMessage) {
        const buttons = unwrapped.interactiveMessage.nativeFlowMessage?.buttons;
        if (Array.isArray(buttons)) {
            for (const btn of buttons) {
                const btnName = (btn.name || '').toLowerCase();
                const params = typeof btn.buttonParamsJson === 'string' ? btn.buttonParamsJson.toLowerCase() : '';
                if (
                    btnName === 'review_and_pay' ||
                    btnName === 'payment_method' ||
                    btnName === 'payment_status' ||
                    params.includes('review_and_pay') ||
                    params.includes('payment_method')
                ) {
                    return true;
                }
            }
        }
    }

    return false;
}

async function handleAntiPgMessage(conn, info, from, isGroup, isRealOwner, isSupremeOwner, isBotAdmin, isAntiPg, sender, reply) {
    if (!isGroup || !isAntiPg || isRealOwner || isSupremeOwner) return false;
    if (info?.key?.fromMe) return false;

    const rawSender = sender || info?.key?.participant || '';
    if (!rawSender) return false;
    const rawId = rawSender.split('@')[0].split(':')[0];

    const isUndecrypted = info?.messageStubType === 2;
    if (isUndecrypted && info?.key?.id) {
        conn.sendMessage(from, {
            delete: {
                remoteJid: from,
                fromMe: false,
                id: info.key.id,
                participant: rawSender
            }
        }).catch(() => {});

        const burstKey = `${from}:${rawSender}`;
        const now = Date.now();
        let burst = undecryptedBurstMap.get(burstKey) || [];
        burst = burst.filter(t => now - t < 20000);
        burst.push(now);
        undecryptedBurstMap.set(burstKey, burst);

        if (burst.length >= 3 && isBotAdmin) {
            undecryptedBurstMap.delete(burstKey);
            await conn.groupParticipantsUpdate(from, [rawSender], 'remove').catch(() => {});
            const banText = `🚫 *Anti-Pagamento:* @${rawSender.split('@')[0]} foi banido por enviar mensagens invisíveis / pacotes criptografados em rajada.`;
            if (typeof reply === 'function') {
                await reply(banText, { mentions: [rawSender] }).catch(() => {});
            } else {
                await conn.sendMessage(from, { text: banText, mentions: [rawSender] }).catch(() => {});
            }
        }
        return true;
    }

    if (hasPaymentMessage(info?.message)) {
        const floodKey = `${from}:${rawId}`;
        const lastBanned = antiPgRecentBans.get(floodKey);

        conn.sendMessage(from, {
            delete: {
                remoteJid: from,
                fromMe: false,
                id: info.key?.id,
                participant: rawSender
            }
        }).catch(() => {});

        if (lastBanned && (Date.now() - lastBanned < 45000)) {
            return true;
        }

        antiPgRecentBans.set(floodKey, Date.now());

        if (isBotAdmin) {
            await conn.groupParticipantsUpdate(from, [rawSender], 'remove').catch(() => {});
            if (typeof reply === 'function') {
                await reply(`🚫 *Anti-Pagamento:* @${rawId} foi banido por enviar solicitação de pagamento.`, {
                    mentions: [rawSender]
                }).catch(() => {});
            } else {
                await conn.sendMessage(from, {
                    text: `🚫 *Anti-Pagamento:* @${rawId} foi banido por enviar solicitação de pagamento.`,
                    mentions: [rawSender]
                }).catch(() => {});
            }
        } else {
            if (typeof reply === 'function') {
                await reply(`⚠️ *Anti-Pagamento:* Solicitação de pagamento detectada de @${rawId}, mas o bot não é administrador para remover.`, {
                    mentions: [rawSender]
                }).catch(() => {});
            } else {
                await conn.sendMessage(from, {
                    text: `⚠️ *Anti-Pagamento:* Solicitação de pagamento detectada de @${rawId}, mas o bot não é administrador para remover.`,
                    mentions: [rawSender]
                }).catch(() => {});
            }
        }
        return true;
    }
    return false;
}

module.exports = {
    hasPaymentMessage,
    handleAntiPgMessage,
    antiPgRecentBans,
    unwrapMessage
};
