// creditos Olympio
const { getOrCriaPlayer, verificarModoRpg, formatOuro } = require('../../funções/rpg/rpgHelper');
const RpgClan = require('../../modelos/RpgClan');

const aliases = ['cla', 'clan', 'guilda', 'guild'];

async function run(conn, msg, config, args, sender, senderName) {
    const from = msg.key.remoteJid;
    const prefix = config.prefix || '!';

    if (!(await verificarModoRpg(conn, from, msg, prefix))) return;

    const senderNumber = sender.replace(/[^0-9]/g, '');
    const player = await getOrCriaPlayer(senderNumber, senderName);

    const subcomando = args[0]?.toLowerCase();

    if (subcomando === 'criar' || subcomando === 'fundar') {
        if (player.clanId) {
            return await conn.sendMessage(from, { text: `❌ Você já é membro do clã *${player.clanId}*! Saia antes de fundar um novo.` }, { quoted: msg });
        }

        const nomeCla = args.slice(1).join(' ').trim();
        if (!nomeCla || nomeCla.length < 3 || nomeCla.length > 25) {
            return await conn.sendMessage(from, {
                text: `❌ Nome inválido para o clã! Deve ter entre 3 e 25 caracteres.\nExemplo: *${prefix}cla criar Espartanos*`
            }, { quoted: msg });
        }

        const custoCriacao = 3000;
        if (player.ouro < custoCriacao) {
            return await conn.sendMessage(from, {
                text: `❌ Criar um clã imperial custa *${formatOuro(custoCriacao)}*, mas você possui apenas *${formatOuro(player.ouro)}*.`
            }, { quoted: msg });
        }

        const claExistente = await RpgClan.findOne({ clanId: nomeCla.toLowerCase() });
        if (claExistente) {
            return await conn.sendMessage(from, { text: '❌ Já existe um clã com esse nome! Escolha outro.' }, { quoted: msg });
        }

        player.ouro -= custoCriacao;
        player.clanId = nomeCla;

        const novoCla = new RpgClan({
            clanId: nomeCla.toLowerCase(),
            nome: nomeCla,
            lider: senderNumber,
            membros: [senderNumber],
            nivel: 1,
            cofre: 500,
            vitoriasGuerra: 0
        });

        await novoCla.save();
        await player.save();

        let resposta = [
            `🏰 *CLÃ IMPERIAL FUNDADO COM GLÓRIA!* ⚔️`,
            ``,
            `🛡️ Nome da Guilda: *${nomeCla}*`,
            `👑 Líder Supremo: *@${senderNumber}*`,
            `💰 Cofre Inicial: ${formatOuro(500)}`,
            ``,
            `💡 _Recrute amigos do grupo para o seu clã! Eles podem entrar digitando:_\n👉 *${prefix}cla entrar ${nomeCla}*`
        ].join('\n');

        return await conn.sendMessage(from, { text: resposta, mentions: [sender] }, { quoted: msg });
    }

    if (subcomando === 'entrar' || subcomando === 'join') {
        if (player.clanId) {
            return await conn.sendMessage(from, { text: `❌ Você já faz parte do clã *${player.clanId}*! Use *${prefix}cla sair* primeiro.` }, { quoted: msg });
        }

        const nomeCla = args.slice(1).join(' ').trim().toLowerCase();
        if (!nomeCla) {
            return await conn.sendMessage(from, { text: `❌ Digite o nome do clã que deseja entrar!\nExemplo: *${prefix}cla entrar Espartanos*` }, { quoted: msg });
        }

        const cla = await RpgClan.findOne({ clanId: nomeCla });
        if (!cla) {
            return await conn.sendMessage(from, { text: '❌ Nenhum clã com esse nome foi encontrado!' }, { quoted: msg });
        }

        if (cla.membros.length >= 20) {
            return await conn.sendMessage(from, { text: '❌ Este clã já atingiu a capacidade máxima de 20 membros!' }, { quoted: msg });
        }

        cla.membros.push(senderNumber);
        player.clanId = cla.nome;

        await cla.save();
        await player.save();

        return await conn.sendMessage(from, {
            text: `🎉 *@${senderNumber}* agora é um guerreiro oficial do clã *🛡️ ${cla.nome}*!\n\nAjude seu clã a evoluir doando ouro no cofre com *${prefix}cla doar <valor>*.`,
            mentions: [sender]
        }, { quoted: msg });
    }

    if (subcomando === 'doar' || subcomando === 'deposito') {
        if (!player.clanId) {
            return await conn.sendMessage(from, { text: '❌ Você precisa estar em um clã para doar ouro!' }, { quoted: msg });
        }

        const cla = await RpgClan.findOne({ clanId: player.clanId.toLowerCase() });
        if (!cla) return await conn.sendMessage(from, { text: '❌ Erro ao localizar os dados do seu clã.' }, { quoted: msg });

        const valor = parseInt(args[1], 10);
        if (!valor || valor <= 0) {
            return await conn.sendMessage(from, { text: `❌ Especifique quanto quer doar!\nExemplo: *${prefix}cla doar 500*` }, { quoted: msg });
        }

        if (player.ouro < valor) {
            return await conn.sendMessage(from, { text: `❌ Você não possui *${formatOuro(valor)}* na carteira!` }, { quoted: msg });
        }

        player.ouro -= valor;
        cla.cofre += valor;

        const xpFortaleza = Math.floor(cla.cofre / 10000) + 1;
        if (xpFortaleza > cla.nivel) {
            cla.nivel = xpFortaleza;
        }

        await player.save();
        await cla.save();

        return await conn.sendMessage(from, {
            text: `🪙 *DOAÇÃO RECEBIDA PELO CLÃ!* 🏰\n\n👤 Doador: *@${senderNumber}*\n💰 Ouro Doado: *+${formatOuro(valor)}*\n🏛️ Cofre do Clã: *${formatOuro(cla.cofre)}*\n🛡️ Nível da Fortaleza: *Nível ${cla.nivel}*`,
            mentions: [sender]
        }, { quoted: msg });
    }

    if (subcomando === 'sair' || subcomando === 'leave') {
        if (!player.clanId) {
            return await conn.sendMessage(from, { text: '❌ Você não está em nenhum clã no momento.' }, { quoted: msg });
        }

        const cla = await RpgClan.findOne({ clanId: player.clanId.toLowerCase() });
        if (cla) {
            cla.membros = cla.membros.filter(m => m !== senderNumber);
            await cla.save();
        }

        const nomeAntigo = player.clanId;
        player.clanId = null;
        await player.save();

        return await conn.sendMessage(from, {
            text: `👋 *@${senderNumber}* abandonou o clã *${nomeAntigo}* e agora segue como um guerreiro solitário.`,
            mentions: [sender]
        }, { quoted: msg });
    }

    if (player.clanId) {
        const cla = await RpgClan.findOne({ clanId: player.clanId.toLowerCase() });
        if (cla) {
            let listaMembros = cla.membros.map((m, i) => `│   ${i + 1}. @${m} ${m === cla.lider ? '👑 *(Líder)*' : ''}`).join('\n');

            let texto = [
                `╭─〔 🏰 *FORTALEZA DO CLÃ: ${cla.nome.toUpperCase()}* 〕`,
                `│ 👑 *Líder:* @${cla.lider}`,
                `│ 🛡️ *Nível da Fortaleza:* ${cla.nivel}`,
                `│ 💰 *Cofre do Clã:* ${formatOuro(cla.cofre)}`,
                `│ ⚔️ *Vitórias em Guerras:* ${cla.vitoriasGuerra}`,
                `│ 👥 *Membros Alistados (${cla.membros.length}/20):*`,
                listaMembros,
                `╰────────────────────────`,
                ``,
                `💡 *AÇÕES DO CLÃ:*`,
                `• *${prefix}cla doar <valor>* - Ajudar no crescimento do cofre`,
                `• *${prefix}cla sair* - Desfazer aliança e sair da guilda`
            ].join('\n');

            const mentions = cla.membros.map(m => `${m}@s.whatsapp.net`);
            return await conn.sendMessage(from, { text: texto, mentions }, { quoted: msg });
        }
    }

    let texto = [
        `╭─〔 🏰 *SISTEMA DE CLÃS & GUILDAS* 〕`,
        `│ _Junte-se a outros guerreiros para dominar o império!_`,
        `│ _Clãs evoluem suas fortalezas e batalham em guerras épicas._`,
        `│ 📌 *Status:* Você não faz parte de nenhum clã.`,
        `╰────────────────────────`,
        ``,
        `💡 *COMO PARTICIPAR:*`,
        `• *${prefix}cla criar <nome>* - Fundar um novo clã (Custa ${formatOuro(3000)})`,
        `• *${prefix}cla entrar <nome>* - Alistar-se num clã existente`
    ].join('\n');

    await conn.sendMessage(from, { text: texto }, { quoted: msg });
}

module.exports = {
    run,
    aliases
};
