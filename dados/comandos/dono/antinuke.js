// creditos Olympio
const Grupo = require('../../modelos/grupos');
const { isBotAdmin, normalizeId } = require('../../funções/normalizarid');
const { isOwnerSender } = require('../../funções/ownerAuth');
const groupCache = require('../../funções/groupCache');

const aliases = ['antinuke', 'anuke'];

async function run(conn, msg, config, args, sender) {
    const from = msg.key.remoteJid;
    if (!from.endsWith('@g.us')) {
        return await conn.sendMessage(from, { text: '❌ Esse comando só funciona em grupos.' }, { quoted: msg });
    }

    try {
        const groupMetadata = await conn.groupMetadata(from);
        const senderClean = normalizeId(sender);
        const botOwnerNumber = normalizeId(config.ownerNumber);
        const groupOwner = normalizeId(groupMetadata.owner || '');
        const isOwner = isOwnerSender(config, sender, msg, conn);
        const isRealGroupOwner = senderClean === groupOwner;

        if (!isOwner && !isRealGroupOwner) {
            return await conn.sendMessage(from, {
                text: '❌ Apenas o dono do grupo ou o dono do bot podem configurar o Anti Nuke.'
            }, { quoted: msg });
        }

        if (!isBotAdmin(groupMetadata, conn.user.id)) {
            return await conn.sendMessage(from, {
                text: '⚠️ Eu preciso ser administrador para restaurar cargos e punir rebaixamentos indevidos.'
            }, { quoted: msg });
        }

        let grupoDB = await Grupo.findOne({ groupId: from });
        if (!grupoDB) {
            grupoDB = new Grupo({ groupId: from });
        }
        if (!Array.isArray(grupoDB.donos)) {
            grupoDB.donos = [];
        }

        grupoDB.groupOwnerId = groupMetadata.owner || null;

        const sub = (args[0] || '').toLowerCase();

        if (sub === 'on' || sub === '1' || sub === 'ativar' || sub === 'ligar') {
            grupoDB.antinuke = true;
            await grupoDB.save();
            groupCache.del(from);
            return await conn.sendMessage(from, {
                text: '🛡️ *Anti Nuke ATIVADO!*\n\nQualquer pessoa não autorizada que rebaixar administradores terá o cargo retirado na hora e os administradores serão restaurados.'
            }, { quoted: msg });
        }

        if (sub === 'off' || sub === '0' || sub === 'desativar' || sub === 'desligar') {
            grupoDB.antinuke = false;
            await grupoDB.save();
            groupCache.del(from);
            return await conn.sendMessage(from, {
                text: '🔓 *Anti Nuke DESATIVADO!*\n\nRebaixamentos de administradores não serão revertidos automaticamente.'
            }, { quoted: msg });
        }

        if (sub === 'add' || sub === 'adicionar' || sub === 'set') {
            let target = null;
            if (msg.message?.extendedTextMessage?.contextInfo?.participant) {
                target = msg.message.extendedTextMessage.contextInfo.participant;
            } else if (msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0]) {
                target = msg.message.extendedTextMessage.contextInfo.mentionedJid[0];
            } else if (args[1]) {
                target = args[1].replace(/[^0-9]/g, '') + '@s.whatsapp.net';
            }

            if (!target) {
                return await conn.sendMessage(from, {
                    text: `❌ Marque alguém ou informe o número para autorizar no Anti Nuke, exemplo: *${config.prefix}antinuke add @user*`
                }, { quoted: msg });
            }

            const targetClean = normalizeId(target);
            if (grupoDB.donos.includes(targetClean)) {
                return await conn.sendMessage(from, {
                    text: `⚠️ O usuário @${targetClean.split('@')[0]} já está autorizado a alterar cargos.`,
                    mentions: [target]
                }, { quoted: msg });
            }

            grupoDB.donos.push(targetClean);
            await grupoDB.save();
            groupCache.del(from);

            return await conn.sendMessage(from, {
                text: `✅ Usuário @${targetClean.split('@')[0]} autorizado com sucesso, agora ele pode gerenciar cargos sem ser punido pelo Anti Nuke.`,
                mentions: [target]
            }, { quoted: msg });
        }

        if (sub === 'del' || sub === 'remove' || sub === 'remover') {
            let target = null;
            if (msg.message?.extendedTextMessage?.contextInfo?.participant) {
                target = msg.message.extendedTextMessage.contextInfo.participant;
            } else if (msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0]) {
                target = msg.message.extendedTextMessage.contextInfo.mentionedJid[0];
            } else if (args[1]) {
                target = args[1].replace(/[^0-9]/g, '') + '@s.whatsapp.net';
            }

            if (!target) {
                return await conn.sendMessage(from, {
                    text: `❌ Marque alguém ou informe o número para remover do Anti Nuke, exemplo: *${config.prefix}antinuke del @user*`
                }, { quoted: msg });
            }

            const targetClean = normalizeId(target);
            const index = grupoDB.donos.indexOf(targetClean);
            if (index === -1) {
                return await conn.sendMessage(from, {
                    text: `⚠️ O usuário @${targetClean.split('@')[0]} não está na lista de autorizados.`,
                    mentions: [target]
                }, { quoted: msg });
            }

            grupoDB.donos.splice(index, 1);
            await grupoDB.save();
            groupCache.del(from);

            return await conn.sendMessage(from, {
                text: `✅ Usuário @${targetClean.split('@')[0]} removido da lista de autorizados do Anti Nuke.`,
                mentions: [target]
            }, { quoted: msg });
        }

        if (sub === 'list' || sub === 'lista') {
            if (grupoDB.donos.length === 0) {
                return await conn.sendMessage(from, {
                    text: `📋 *Anti Nuke, Autorizados:*\n\nNenhum usuário secundário cadastrado, apenas o criador do grupo e o dono do bot têm autorização.\n\nPara autorizar use: *${config.prefix}antinuke add @user*`
                }, { quoted: msg });
            }

            const linhas = grupoDB.donos.map((d) => `@${d.split('@')[0]}`).join('\n');
            return await conn.sendMessage(from, {
                text: `📋 *Anti Nuke, Usuários Autorizados:*\n\n${linhas}\n\nEstes usuários podem alterar cargos sem ativação do Anti Nuke.`,
                mentions: grupoDB.donos.map((d) => d.includes('@') ? d : `${d}@s.whatsapp.net`)
            }, { quoted: msg });
        }

        grupoDB.antinuke = !grupoDB.antinuke;
        await grupoDB.save();
        groupCache.del(from);

        const status = grupoDB.antinuke ? 'ATIVADO 🛡️' : 'DESATIVADO 🔓';
        const ajuda = [
            `🛡️ *Anti Nuke ${status}*`,
            '',
            `O Anti Nuke impede que pessoas não autorizadas rebaixem ou promovam administradores.`,
            '',
            `Comandos disponíveis:`,
            `• *${config.prefix}antinuke on*, ativa a proteção`,
            `• *${config.prefix}antinuke off*, desativa a proteção`,
            `• *${config.prefix}antinuke add @user*, autoriza alguém a mexer nos cargos`,
            `• *${config.prefix}antinuke del @user*, remove autorização`,
            `• *${config.prefix}antinuke list*, lista os usuários autorizados`
        ].join('\n');

        await conn.sendMessage(from, { text: ajuda }, { quoted: msg });
    } catch (e) {
        console.error('Erro no comando antinuke:', e);
        await conn.sendMessage(from, { text: '❌ Erro ao salvar a configuração do Anti Nuke.' }, { quoted: msg });
    }
}

module.exports = {
    run,
    aliases
};
