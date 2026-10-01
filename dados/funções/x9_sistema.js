// creditos Olympio
const lidCache = require('./lidCache');
const groupMetadataManager = require('./groupMetadataManager');
const config = require('../../config.json');
const { sendPaymentStyledText } = require('./paymentMessage');
const { buildX9Card } = require('./layout');
const moment = require('moment-timezone');

async function resolveJidToPhone(jid, groupMetadata, olymp, from) {
  if (!jid || typeof jid !== 'string') return '';

  let clean = jid.split(':')[0];
  if (!clean.includes('@')) {
    clean += jid.includes('@lid') ? '@lid' : '@s.whatsapp.net';
  }

  const rawNumber = clean.split('@')[0];

  if (config.ownerlid && (clean.includes(config.ownerlid) || rawNumber === config.ownerlid)) {
    return `${config.ownerNumber}@s.whatsapp.net`;
  }
  if (config.ownerNumber && rawNumber === config.ownerNumber) {
    return `${config.ownerNumber}@s.whatsapp.net`;
  }

  const cached = lidCache.getJid(clean) || lidCache.getJid(rawNumber) || lidCache.getJid(rawNumber + '@lid');
  if (cached && cached.endsWith('@s.whatsapp.net')) {
    return cached.split(':')[0] + '@s.whatsapp.net';
  }

  let metadata = groupMetadata || (from ? groupMetadataManager.get(from) : null);
  if ((!metadata || !Array.isArray(metadata.participants) || metadata.participants.length === 0) && olymp && typeof olymp.groupMetadata === 'function' && from && from.endsWith('@g.us')) {
    try {
      metadata = await olymp.groupMetadata(from);
      if (metadata) groupMetadataManager.set(from, metadata);
    } catch (e) {}
  }

  if (metadata && Array.isArray(metadata.participants)) {
    const found = metadata.participants.find(p => {
      const pId = (p.id || '').split(':')[0].split('@')[0];
      const pLid = (p.lid || '').split(':')[0].split('@')[0];
      return pLid === rawNumber || pId === rawNumber;
    });

    if (found) {
      if (found.id && !found.id.endsWith('@lid')) {
        lidCache.set(found.id, clean);
        return found.id.split(':')[0] + '@s.whatsapp.net';
      }
      if (found.lid && found.id && !found.id.endsWith('@lid')) {
        lidCache.set(found.id, found.lid);
        return found.id.split(':')[0] + '@s.whatsapp.net';
      }
    }
  }

  if (olymp && olymp.store && olymp.store.contacts) {
    for (const [contactJid, contact] of Object.entries(olymp.store.contacts)) {
      if (contactJid.endsWith('@s.whatsapp.net')) {
        const cLid = (contact.lid || '').split(':')[0].split('@')[0];
        if (cLid && cLid === rawNumber) {
          lidCache.set(contactJid, clean);
          return contactJid.split(':')[0] + '@s.whatsapp.net';
        }
      }
    }
  }

  if (clean.endsWith('@s.whatsapp.net') && rawNumber.length <= 13) {
    return clean;
  }

  if (clean.endsWith('@lid') || rawNumber.length > 13) {
    return clean;
  }

  return rawNumber + '@s.whatsapp.net';
}

async function sendX9Notification(olymp, from, text, mentions = [], quoted = null) {
  try {
    await sendPaymentStyledText(olymp, from, text, mentions, mentions[0] || null, quoted);
  } catch (e) {
    try {
      await olymp.sendMessage(from, { text, mentions }, { quoted });
    } catch (err) {
      console.error('[X9] Erro ao enviar notificação:', err);
    }
  }
}

async function handleAntiDeleteX9(olymp, info, from, groupData, groupMetadata, messagesCache) {
  const isGroup = from.endsWith('@g.us');
  if (!isGroup || !groupData?.x9 || !info.message?.protocolMessage || info.message.protocolMessage.type !== 0) return;
  if (info.key.fromMe) return;

  const msgId = info.message.protocolMessage.key.id;
  const cachedMsg = messagesCache ? messagesCache.get(msgId) : null;
  if (!cachedMsg) return;

  const deleterJid = info.key.participant || info.participant || info.message.protocolMessage.key.participant || info.message.protocolMessage.key.remoteJid;
  const cleanSender = await resolveJidToPhone(deleterJid, groupMetadata, olymp, from);

  const botNumber = olymp.user?.id ? olymp.user.id.split(':')[0] + '@s.whatsapp.net' : '';
  if (cleanSender === botNumber || (botNumber && cleanSender.includes(botNumber.split('@')[0]))) return;

  const phoneTag = cleanSender.split('@')[0];
  const textMsg = cachedMsg.conversation || cachedMsg.extendedTextMessage?.text;
  const time = moment().tz('America/Sao_Paulo').format('HH:mm:ss');

  if (textMsg) {
    const alertText = buildX9Card({
      type: 'MENSAGEM APAGADA',
      icon: '🗑️',
      authorTag: phoneTag,
      time,
      content: textMsg
    });
    await sendX9Notification(olymp, from, alertText, [cleanSender], info);
  } else {
    const alertText = buildX9Card({
      type: 'MÍDIA APAGADA',
      icon: '📷',
      authorTag: phoneTag,
      time,
      content: cachedMsg.imageMessage?.caption || cachedMsg.videoMessage?.caption || 'Mídia recuperada abaixo'
    });
    await sendX9Notification(olymp, from, alertText, [cleanSender], info);

    let mediaMsg = cachedMsg.message ? cachedMsg.message : cachedMsg;
    try {
      await olymp.sendMessage(from, mediaMsg, { quoted: info });
    } catch (err1) {
      try {
        const fullMsg = cachedMsg.key ? cachedMsg : { key: info.message.protocolMessage.key, message: cachedMsg };
        await olymp.sendMessage(from, { forward: fullMsg }, { quoted: info });
      } catch (err2) {
        console.error('Erro ao reenviar mídia apagada:', err2);
      }
    }
  }
}

async function handleViewOnceX9(olymp, info, from, groupData, groupMetadata, sender, isVisuU, isVisuU2, reply) {
  const isGroup = from.endsWith('@g.us');
  if (!isGroup || !groupData?.x9 || (!isVisuU && !isVisuU2)) return;

  const cleanSender = await resolveJidToPhone(sender, groupMetadata, olymp, from);
  const phoneTag = cleanSender.split('@')[0];
  const time = moment().tz('America/Sao_Paulo').format('HH:mm:ss');
  const textAlert = buildX9Card({
    type: 'VISUALIZAÇÃO ÚNICA',
    icon: '👁️',
    authorTag: phoneTag,
    time,
    content: 'Mídia de visualização única interceptada e revelada abaixo'
  });

  if (typeof reply === 'function') {
    await reply(textAlert, { mentions: [cleanSender] });
  } else {
    await sendX9Notification(olymp, from, textAlert, [cleanSender]);
  }

  const clone = JSON.parse(JSON.stringify(info.message));
  const unwrapped = clone.viewOnceMessage?.message || clone.viewOnceMessageV2?.message || clone;

  if (unwrapped.imageMessage) unwrapped.imageMessage.viewOnce = false;
  if (unwrapped.videoMessage) unwrapped.videoMessage.viewOnce = false;
  if (unwrapped.audioMessage) unwrapped.audioMessage.viewOnce = false;

  await olymp.sendMessage(from, unwrapped);
}

async function handleX9Stub(olymp, msg) {
  const from = msg.key.remoteJid;
  if (!from || !from.endsWith('@g.us')) return;

  const Grupo = require('../modelos/grupos');
  const groupSettings = await Grupo.findOne({ groupId: from });
  if (!groupSettings || !groupSettings.x9) return;

  const action = msg.messageStubType === 29 ? '🔺 promovido a ADM' : '🔻 rebaixado de ADM';

  let author = msg.key.participant || msg.participant;
  let target = msg.messageStubParameters?.[0];

  if (target) {
    const jidMatch = target.match(/([a-zA-Z0-9._-]+@(s\.whatsapp\.net|lid))/);
    if (jidMatch) {
      target = jidMatch[1];
    } else {
      try {
        const parsed = JSON.parse(target);
        if (Array.isArray(parsed) && parsed.length > 0) {
          target = parsed[0];
        } else if (parsed && typeof parsed === 'object') {
          target = parsed.id || parsed.jid || target;
        } else if (parsed) {
          target = parsed;
        }
      } catch(e) {}
    }
  }

  if (author) {
    const jidMatch = author.match(/([a-zA-Z0-9._-]+@(s\.whatsapp\.net|lid))/);
    if (jidMatch) {
      author = jidMatch[1];
    }
  }

  if (!target || !author) return;

  target = await resolveJidToPhone(target, null, olymp, from);
  author = await resolveJidToPhone(author, null, olymp, from);

  const authorName = author.split('@')[0];
  const userName = target.split('@')[0];
  const time = moment().tz('America/Sao_Paulo').format('HH:mm:ss');

  const alertText = buildX9Card({
    type: msg.messageStubType === 29 ? 'PROMOÇÃO DE ADMIN' : 'REBAIXAMENTO DE ADMIN',
    icon: msg.messageStubType === 29 ? '👑' : '🔻',
    authorTag: authorName,
    time,
    extraInfo: `@${userName} foi ${action}`
  });

  await sendX9Notification(olymp, from, alertText, [target, author]);
}

module.exports = {
  resolveJidToPhone,
  sendX9Notification,
  handleAntiDeleteX9,
  handleViewOnceX9,
  handleX9Stub
};
