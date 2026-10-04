// creditos Olympio
const { EventEmitter } = require('events');

function createZapoAdapter(client) {
    const ev = new EventEmitter();

    const conn = {
        rawClient: client,
        ev,
        get user() {
            const creds = client.getCredentials();
            const meJid = creds?.meJid || '';
            const meLid = creds?.meLid || '';
            return {
                id: meJid,
                jid: meJid,
                lid: meLid,
                name: 'OlympProtect'
            };
        },
        async sendMessage(jid, content, options = {}) {
            let sendPayload;
            const contextInfo = {};
            if (content.mentions && Array.isArray(content.mentions)) {
                contextInfo.mentionedJid = content.mentions;
            }
            if (options.quoted) {
                contextInfo.quoted = {
                    key: options.quoted.key,
                    message: options.quoted.message
                };
            }

            if (typeof content === 'string') {
                sendPayload = { type: 'text', text: content, contextInfo };
            } else if (content.text) {
                sendPayload = { type: 'text', text: content.text, contextInfo };
            } else if (content.image) {
                let mime = content.mimetype;
                if (!mime) {
                    if (Buffer.isBuffer(content.image) && content.image[0] === 0x89) {
                        mime = 'image/png';
                    } else if (typeof content.image === 'string' && content.image.endsWith('.png')) {
                        mime = 'image/png';
                    } else {
                        mime = 'image/jpeg';
                    }
                }
                sendPayload = {
                    type: 'image',
                    media: content.image,
                    caption: content.caption || '',
                    mimetype: mime,
                    contextInfo
                };
            } else if (content.video) {
                sendPayload = {
                    type: 'video',
                    media: content.video,
                    caption: content.caption || '',
                    mimetype: content.mimetype || 'video/mp4',
                    contextInfo
                };
            } else if (content.audio) {
                sendPayload = {
                    type: 'audio',
                    media: content.audio,
                    mimetype: content.mimetype || 'audio/mp4',
                    ptt: !!content.ptt,
                    contextInfo
                };
            } else if (content.sticker) {
                sendPayload = {
                    type: 'sticker',
                    media: content.sticker,
                    contextInfo
                };
            } else if (content.document) {
                sendPayload = {
                    type: 'document',
                    media: content.document,
                    fileName: content.fileName || 'document',
                    mimetype: content.mimetype || 'application/octet-stream',
                    caption: content.caption || '',
                    contextInfo
                };
            } else if (content.react) {
                sendPayload = {
                    type: 'reaction',
                    emoji: content.react.text,
                    target: content.react.key
                };
            } else if (content.delete) {
                sendPayload = {
                    type: 'revoke',
                    target: content.delete
                };
            } else {
                sendPayload = content;
            }

            const res = await client.message.send(jid, sendPayload);
            return {
                key: {
                    remoteJid: jid,
                    fromMe: true,
                    id: res?.id || Date.now().toString()
                },
                message: sendPayload
            };
        },
        async groupMetadata(jid) {
            const meta = await client.group.queryGroupMetadata(jid);
            const lidCache = require('./lidCache');
            return {
                id: meta.jid,
                subject: meta.subject,
                subjectOwner: meta.subjectOwner,
                subjectTime: meta.subjectTime,
                creation: meta.creation,
                owner: meta.owner || meta.ownerPhoneNumber || '',
                desc: meta.desc || '',
                descId: meta.descId,
                restrict: !!meta.restrict,
                announce: !!meta.announce,
                size: meta.size || meta.participants?.length || 0,
                participants: (meta.participants || []).map(p => {
                    const id = p.jid;
                    const phone = p.phoneNumber || (!p.jid?.includes('@lid') ? p.jid : null);
                    const lid = p.lid || (p.jid?.includes('@lid') ? p.jid : null);
                    if (phone && lid) {
                        const cleanPhone = phone.includes('@') ? phone : `${phone.split(':')[0]}@s.whatsapp.net`;
                        lidCache.set(cleanPhone, lid);
                    }
                    return {
                        id,
                        admin: p.isSuperAdmin ? 'superadmin' : (p.isAdmin ? 'admin' : null),
                        lid,
                        phoneNumber: phone
                    };
                })
            };
        },
        async groupParticipantsUpdate(jid, participants, action) {
            let list = Array.isArray(participants) ? [...participants] : [participants];
            try {
                const meta = await client.group.queryGroupMetadata(jid).catch(() => null);
                if (meta && Array.isArray(meta.participants)) {
                    list = list.map(target => {
                        const targetNorm = String(target).split('@')[0].split(':')[0];
                        const match = meta.participants.find(p => {
                            const pNorm = String(p.jid).split('@')[0].split(':')[0];
                            const pPhoneNorm = p.phoneNumber ? String(p.phoneNumber).split('@')[0].split(':')[0] : null;
                            const pLidNorm = p.lid ? String(p.lid).split('@')[0].split(':')[0] : null;
                            return pNorm === targetNorm || (pPhoneNorm && pPhoneNorm === targetNorm) || (pLidNorm && pLidNorm === targetNorm);
                        });
                        return match?.jid || target;
                    });
                }
            } catch (_) {}
            if (action === 'remove') return await client.group.removeParticipants(jid, list);
            if (action === 'add') return await client.group.addParticipants(jid, list);
            if (action === 'promote') return await client.group.promoteParticipants(jid, list);
            if (action === 'demote') return await client.group.demoteParticipants(jid, list);
        },
        async groupSettingUpdate(jid, setting) {
            if (setting === 'announcement' || setting === 'announce') return await client.group.setSetting(jid, 'announcement', true);
            if (setting === 'not_announcement' || setting === 'not_announce') return await client.group.setSetting(jid, 'announcement', false);
            if (setting === 'locked' || setting === 'restrict') return await client.group.setSetting(jid, 'restrict', true);
            if (setting === 'unlocked' || setting === 'not_restrict') return await client.group.setSetting(jid, 'restrict', false);
        },
        async groupUpdateSubject(jid, subject) {
            return await client.group.setSubject(jid, subject);
        },
        async groupUpdateDescription(jid, description) {
            return await client.group.setDescription(jid, description);
        },
        async groupInviteCode(jid) {
            return await client.group.queryInviteCode(jid);
        },
        async groupRevokeInvite(jid) {
            return await client.group.revokeInvite(jid);
        },
        async groupAcceptInvite(code) {
            return await client.group.joinGroupViaInvite(code);
        },
        async groupFetchAllParticipating() {
            const groups = await client.group.queryAllGroups();
            const map = {};
            for (const g of groups) {
                map[g.jid] = {
                    id: g.jid,
                    subject: g.subject,
                    owner: g.owner || g.ownerPhoneNumber || '',
                    participants: (g.participants || []).map(p => ({
                        id: p.jid,
                        admin: p.isSuperAdmin ? 'superadmin' : (p.isAdmin ? 'admin' : null)
                    }))
                };
            }
            return map;
        },
        async profilePictureUrl(jid) {
            try {
                const res = await client.profile.getProfilePicture(jid);
                return res?.url || null;
            } catch (_) {
                return null;
            }
        },
        async updateProfilePicture(jid, content) {
            const bytes = Buffer.isBuffer(content) ? content : (content?.img ? content.img : content);
            return await client.profile.setProfilePicture(bytes, jid);
        },
        async updateProfileStatus(status) {
            return await client.profile.setStatus(status);
        },
        async sendPresenceUpdate(presence, jid) {
            try {
                if (jid) {
                    const state = presence === 'recording' ? 'recording' : (presence === 'composing' ? 'composing' : 'paused');
                    return await client.presence.sendChatstate(jid, state);
                }
                return await client.presence.send(presence === 'available' ? 'available' : 'unavailable');
            } catch (_) {}
        },
        async onWhatsApp(jid) {
            const raw = String(jid).split('@')[0].split(':')[0];
            const cleanJid = `${raw}@s.whatsapp.net`;
            return [{ jid: cleanJid, exists: true }];
        },
        async relayMessage(jid, message) {
            return await client.message.send(jid, message);
        },
        async downloadMediaMessage(msg) {
            return await client.message.downloadBytes(msg);
        }
    };

    return conn;
}

module.exports = {
    createZapoAdapter
};
