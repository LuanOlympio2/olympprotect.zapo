// creditos Olympio
const fs = require('fs');
const path = require('path');

function patchBaileys() {
    try {
        const signalPath = path.resolve(__dirname, '../../node_modules/baileys/lib/Utils/signal.js');
        const sendPath = path.resolve(__dirname, '../../node_modules/baileys/lib/Socket/messages-send.js');

        if (fs.existsSync(signalPath)) {
            let signalCode = fs.readFileSync(signalPath, 'utf8');
            let signalChanged = false;

            if (!signalCode.includes('const { user, server } = (0, WABinary_1.jidDecode)(id);')) {
                signalCode = signalCode.replace(
                    /const \{ user \} = \(0, WABinary_1\.jidDecode\)\(id\);/g,
                    'const { user, server } = (0, WABinary_1.jidDecode)(id);'
                );
                signalChanged = true;
            }
            if (!signalCode.includes('extracted.push({ user, device, server });')) {
                signalCode = signalCode.replace(
                    /extracted\.push\(\{ user, device \}\);/g,
                    'extracted.push({ user, device, server });'
                );
                signalChanged = true;
            }

            if (!signalCode.includes('const validNodes = [];')) {
                const searchAssert = `    for (const node of nodes) {
        (0, WABinary_1.assertNodeErrorFree)(node);
    }`;
                const replaceAssert = `    const validNodes = [];
    for (const node of nodes) {
        try {
            (0, WABinary_1.assertNodeErrorFree)(node);
            validNodes.push(node);
        } catch (_) {}
    }`;
                if (signalCode.includes(searchAssert)) {
                    signalCode = signalCode.replace(searchAssert, replaceAssert);
                    signalCode = signalCode.replace(
                        'const chunks = (0, lodash_1.chunk)(nodes, chunkSize);',
                        'const chunks = (0, lodash_1.chunk)(validNodes, chunkSize);'
                    );
                    signalChanged = true;
                }
            }

            if (signalChanged) {
                fs.writeFileSync(signalPath, signalCode, 'utf8');
                console.log('✅ [PATCH] Baileys signal.js aplicado com sucesso.');
            }
        }

        if (fs.existsSync(sendPath)) {
            let sendCode = fs.readFileSync(sendPath, 'utf8');
            let sendChanged = false;

            if (!sendCode.includes('server: pServer')) {
                sendCode = sendCode.replace(
                    /const \{ user, device \} = \(0, WABinary_1\.jidDecode\)\(participant\.jid\);\s*devices\.push\(\{ user, device \}\);/,
                    'const { user, device, server: pServer } = (0, WABinary_1.jidDecode)(participant.jid);\n            devices.push({ user, device, server: pServer });'
                );
                sendChanged = true;
            }

            if (!sendCode.includes('d.server || (isLid ? \'lid\'')) {
                sendCode = sendCode.replace(
                    /devices\.map\(d => \(0, WABinary_1\.jidEncode\)\(d\.user, isLid \? 'lid' : 's\.whatsapp\.net', d\.device\)\)/g,
                    "devices.map(d => (0, WABinary_1.jidEncode)(d.user, d.server || (isLid ? 'lid' : (d.user && d.user.length >= 14 ? 'lid' : 's.whatsapp.net')), d.device))"
                );
                sendChanged = true;
            }

            if (!sendCode.includes('server: dServer } of devices')) {
                sendCode = sendCode.replace(
                    /for \(const \{ user, device \} of devices\) \{\s*const jid = \(0, WABinary_1\.jidEncode\)\(user, isLid \? 'lid' : 's\.whatsapp\.net', device\);/g,
                    `for (const { user, device, server: dServer } of devices) {
                    const targetServer = dServer || (isLid ? 'lid' : (user && user.length >= 14 ? 'lid' : 's.whatsapp.net'));
                    const jid = (0, WABinary_1.jidEncode)(user, targetServer, device);`
                );
                sendChanged = true;
            }

            if (sendChanged) {
                fs.writeFileSync(sendPath, sendCode, 'utf8');
                console.log('✅ [PATCH] Baileys messages-send.js aplicado com sucesso.');
            }
        }
        const recvPath = path.resolve(__dirname, '../../node_modules/baileys/lib/Socket/messages-recv.js');

        if (fs.existsSync(recvPath)) {
            let recvCode = fs.readFileSync(recvPath, 'utf8');
            if (!recvCode.includes('const isGroup = (0, WABinary_1.isJidGroup)(remoteJid);')) {
                const searchRecv = `        const sendToAll = !((_a = (0, WABinary_1.jidDecode)(participant)) === null || _a === void 0 ? void 0 : _a.device);
        await assertSessions([participant], true);
        if ((0, WABinary_1.isJidGroup)(remoteJid)) {
            await authState.keys.set({ 'sender-key-memory': { [remoteJid]: null } });
        }`;
                const replaceRecv = `        const isGroup = (0, WABinary_1.isJidGroup)(remoteJid);
        const sendToAll = !isGroup && !((_a = (0, WABinary_1.jidDecode)(participant)) === null || _a === void 0 ? void 0 : _a.device);
        await assertSessions([participant], true);
        if (isGroup && sendToAll) {
            await authState.keys.set({ 'sender-key-memory': { [remoteJid]: null } });
        }`;
                if (recvCode.includes(searchRecv)) {
                    recvCode = recvCode.replace(searchRecv, replaceRecv);
                    fs.writeFileSync(recvPath, recvCode, 'utf8');
                    console.log('✅ [PATCH] Baileys messages-recv.js aplicado com sucesso.');
                }
            }
        }

        const libsignalRecordPath = path.resolve(__dirname, '../../node_modules/libsignal/src/session_record.js');
        if (fs.existsSync(libsignalRecordPath)) {
            let recordCode = fs.readFileSync(libsignalRecordPath, 'utf8');
            let recordChanged = false;
            if (recordCode.includes('console.info("Closing session:", session);')) {
                recordCode = recordCode.replace('console.info("Closing session:", session);', '// console.info("Closing session:", session);');
                recordChanged = true;
            }
            if (recordCode.includes('console.info("Opening session:", session);')) {
                recordCode = recordCode.replace('console.info("Opening session:", session);', '// console.info("Opening session:", session);');
                recordChanged = true;
            }
            if (recordChanged) {
                fs.writeFileSync(libsignalRecordPath, recordCode, 'utf8');
                console.log('✅ [PATCH] libsignal session_record.js silenciado com sucesso.');
            }
        }

        const libsignalBuilderPath = path.resolve(__dirname, '../../node_modules/libsignal/src/session_builder.js');
        if (fs.existsSync(libsignalBuilderPath)) {
            let builderCode = fs.readFileSync(libsignalBuilderPath, 'utf8');
            if (builderCode.includes('console.warn("Closing open session in favor of incoming prekey bundle");')) {
                builderCode = builderCode.replace('console.warn("Closing open session in favor of incoming prekey bundle");', '// console.warn("Closing open session in favor of incoming prekey bundle");');
                fs.writeFileSync(libsignalBuilderPath, builderCode, 'utf8');
                console.log('✅ [PATCH] libsignal session_builder.js silenciado com sucesso.');
            }
        }
    } catch (e) {
        console.error('⚠️ [PATCH] Falha ao verificar/aplicar patch no Baileys:', e.message);
    }
}

module.exports = patchBaileys;
