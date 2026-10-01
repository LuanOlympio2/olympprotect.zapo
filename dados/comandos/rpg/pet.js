// creditos Olympio
const { getOrCriaPlayer, verificarModoRpg, formatOuro } = require('../../funções/rpg/rpgHelper');
const { PETS } = require('../../funções/rpg/dadosRpg');

const aliases = ['pet', 'pets', 'mascote', 'mascotes'];

async function run(conn, msg, config, args, sender, senderName) {
    const from = msg.key.remoteJid;
    const prefix = config.prefix || '!';

    if (!(await verificarModoRpg(conn, from, msg, prefix))) return;

    const senderNumber = sender.replace(/[^0-9]/g, '');
    const player = await getOrCriaPlayer(senderNumber, senderName);

    const subcomando = args[0]?.toLowerCase();

    if (subcomando === 'loja' || subcomando === 'lista' || subcomando === 'comprar_lista') {
        let texto = `╭─〔 🐾 *SANTUÁRIO DE PETS & DINOSSAUROS* 〕\n`;
        texto += `│ _Adote mascotes leais para receber bônus poderosos_\n│ _de ataque, defesa, estamina e lucros no mercado!_\n`;

        texto += `│ 🐶 *PETS BÁSICOS & DOMÉSTICOS:*\n`;
        Object.keys(PETS).filter(k => PETS[k].tipo === 'basico').forEach(k => {
            const p = PETS[k];
            texto += `│ • ${p.icone} *${p.nome}* [ID: \`${p.id}\`]\n`;
            texto += `│   💰 Preço: ${formatOuro(p.preco)}\n`;
            texto += `│   📜 _${p.descricao}_\n`;
        });
        texto += `│\n`;

        texto += `│ 🦖 *DINOSSAUROS & CRIATURAS MÍTICAS:*\n`;
        Object.keys(PETS).filter(k => PETS[k].tipo !== 'basico').forEach(k => {
            const p = PETS[k];
            texto += `│ • ${p.icone} *${p.nome}* [ID: \`${p.id}\`]\n`;
            texto += `│   💰 Preço: ${formatOuro(p.preco)}\n`;
            texto += `│   🔥 _${p.descricao}_\n`;
        });

        texto += `╰────────────────────────\n`;
        texto += `💡 Como adotar:\n👉 *${prefix}pet comprar <id>*\nExemplo: *${prefix}pet comprar cachorro*\nExemplo: *${prefix}pet comprar dragao*\n\n💡 Como equipar:\n👉 *${prefix}pet equipar <id>*`;

        return await conn.sendMessage(from, { text: texto }, { quoted: msg });
    }

    if (subcomando === 'comprar' || subcomando === 'adotar') {
        const petId = args[1]?.toLowerCase();
        if (!petId || !PETS[petId]) {
            return await conn.sendMessage(from, {
                text: `❌ Pet inválido ou não encontrado!\n\nDigite *${prefix}pet loja* para ver os mascotes disponíveis.`
            }, { quoted: msg });
        }

        const petInfo = PETS[petId];

        if (player.petsPossuidos && player.petsPossuidos.includes(petId)) {
            return await conn.sendMessage(from, {
                text: `❌ Você já possui o pet *${petInfo.icone} ${petInfo.nome}*!\nPara ativá-lo, digite: *${prefix}pet equipar ${petId}*.`
            }, { quoted: msg });
        }

        if (player.ouro < petInfo.preco) {
            return await conn.sendMessage(from, {
                text: `❌ Ouro insuficiente!\n\nVocê precisa de *${formatOuro(petInfo.preco)}*, mas possui *${formatOuro(player.ouro)}*.`
            }, { quoted: msg });
        }

        player.ouro -= petInfo.preco;
        if (!player.petsPossuidos) player.petsPossuidos = [];
        player.petsPossuidos.push(petId);

        if (!player.petAtivo) {
            player.petAtivo = petId;
        }

        await player.save();

        return await conn.sendMessage(from, {
            text: `🎉 *PARABÉNS! VOCÊ ADOTOU UM NOVO MASCOTE!* 🐾\n\n👤 Dono: *@${senderNumber}*\n🐾 Pet: *${petInfo.icone} ${petInfo.nome}*\n✨ Bônus: ${petInfo.descricao}\n💰 Saldo restante: ${formatOuro(player.ouro)}\n\n💡 _Equipado e ativo ao seu lado na jornada!_`,
            mentions: [sender]
        }, { quoted: msg });
    }

    if (subcomando === 'equipar' || subcomando === 'ativar' || subcomando === 'usar') {
        const petId = args[1]?.toLowerCase();
        if (!petId || !PETS[petId]) {
            return await conn.sendMessage(from, {
                text: `❌ Especifique qual pet deseja equipar!\nExemplo: *${prefix}pet equipar cachorro*`
            }, { quoted: msg });
        }

        if (!player.petsPossuidos || !player.petsPossuidos.includes(petId)) {
            return await conn.sendMessage(from, {
                text: `❌ Você ainda não adotou esse pet!\nConsulte o santuário com *${prefix}pet loja*.`
            }, { quoted: msg });
        }

        player.petAtivo = petId;
        await player.save();

        const petInfo = PETS[petId];
        return await conn.sendMessage(from, {
            text: `✅ *PET ATIVADO!* 🐾\n\nAgora *${petInfo.icone} ${petInfo.nome}* está te acompanhando!\n📜 Bônus Ativo: ${petInfo.descricao}`,
            mentions: [sender]
        }, { quoted: msg });
    }

    if (subcomando === 'desequipar' || subcomando === 'remover') {
        player.petAtivo = null;
        await player.save();
        return await conn.sendMessage(from, {
            text: `💤 Seu pet foi guardado no abrigo e está descansando.`
        }, { quoted: msg });
    }

    const petAtivoInfo = player.petAtivo ? PETS[player.petAtivo] : null;

    let texto = [
        `╭─〔 🐾 *SEU COMPANHEIRO DE JORNADA* 〕`,
        `│ • *Tutor:* ${player.nome}`,
        `│ • *Pet:* ${petAtivoInfo ? `${petAtivoInfo.icone} *${petAtivoInfo.nome}*` : '_Nenhum mascote ativo_'}`
    ];

    if (petAtivoInfo) {
        texto.push(`│ • *Bônus:* ${petAtivoInfo.descricao}`);
    }

    texto.push(`├─〔 *Mascotes Adotados (${player.petsPossuidos?.length || 0})* 〕`);

    if (player.petsPossuidos && player.petsPossuidos.length > 0) {
        player.petsPossuidos.forEach(id => {
            const p = PETS[id];
            const isAtivo = player.petAtivo === id ? ' *(ATIVO)*' : '';
            if (p) texto.push(`│ • ${p.icone} ${p.nome}${isAtivo}`);
        });
    } else {
        texto.push(`│ _Você ainda não possui nenhum pet._`);
    }

    texto.push(`╰────────────────────────`);
    texto.push(``);
    texto.push(`💡 *COMANDOS DE PET:*`);
    texto.push(`• *${prefix}pet loja* - Ver catálogo e preços de todos os mascotes`);
    texto.push(`• *${prefix}pet comprar <id>* - Adotar um novo mascote`);
    texto.push(`• *${prefix}pet equipar <id>* - Escolher o mascote ativo`);

    await conn.sendMessage(from, { text: texto.join('\n') }, { quoted: msg });
}

module.exports = {
    run,
    aliases
};
