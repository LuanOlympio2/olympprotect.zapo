// creditos Olympio
const { findParticipant, isBotAdmin, resolveToPhoneJid } = require('../../funções/normalizarid');

const aliases = ['suicidio', 'suicidar', 'morrer'];

async function run(conn, msg, config, args, sender, senderName) {
    const from = msg.key.remoteJid;
    const isGroup = from.endsWith('@g.us');

    if (!isGroup) {
        return await conn.sendMessage(from, { 
            text: '⚠️ O comando suicídio só funciona em grupos!' 
        }, { quoted: msg });
    }

    try {
        const groupMetadata = await conn.groupMetadata(from).catch(() => null);
        if (!groupMetadata) {
            return await conn.sendMessage(from, { 
                text: '⚠️ Erro ao obter dados do grupo. Tente novamente.' 
            }, { quoted: msg });
        }

        if (!isBotAdmin(groupMetadata, conn)) {
            return await conn.sendMessage(from, { 
                text: '⚠️ Eu preciso ser administrador do grupo para você conseguir cometer suicídio!' 
            }, { quoted: msg });
        }

        const participant = findParticipant(groupMetadata.participants, sender);
        if (!participant) {
            return await conn.sendMessage(from, { 
                text: '⚠️ Não foi possível localizar seu registro de participante no grupo.' 
            }, { quoted: msg });
        }

        if (participant.admin === 'superadmin') {
            return await conn.sendMessage(from, { 
                text: '👑 Você é o criador/dono supremo do grupo! O WhatsApp impede a remoção do proprietário.' 
            }, { quoted: msg });
        }

        await conn.sendMessage(from, { 
            text: '*essa não, não se vá voce é tao novo*' 
        }, { quoted: msg });

        await new Promise(r => setTimeout(r, 1800));

        const removeId = resolveToPhoneJid(participant.id || sender, groupMetadata.participants);
        await conn.groupParticipantsUpdate(from, [removeId], 'remove');

        await new Promise(r => setTimeout(r, 1500));

        await conn.sendMessage(from, { 
            text: '*finalmente morreu, ninguem aguentava mais esse cara*' 
        });

    } catch (e) {
        console.error('Erro no comando suicidio:', e);
        await conn.sendMessage(from, { 
            text: '⚠️ Houve um erro ao tentar realizar a remoção. Verifique se o bot possui privilégios de administrador!' 
        }, { quoted: msg });
    }
}

module.exports = {
    name: 'suicidio',
    description: 'Remove o próprio usuário do grupo em tom de brincadeira',
    aliases,
    run
};
