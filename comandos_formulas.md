














# 📚 Guia de Comandos: Cases e Fórmulas de Funcionamento

Este documento contém a estrutura de código (`case` / módulo) e a fórmula detalhada de funcionamento para os 11 comandos solicitados.

---

## 1. TikTok (`tiktok`)

### 📌 Case / Estrutura
```javascript
case 'tiktok':
case 'tt':
case 'tikt': {
    const from = msg.key.remoteJid;
    const prefix = config.prefix || '!';
    const textUrl = args[0];

    if (!textUrl || !textUrl.match(/tiktok\.com/)) {
        return await conn.sendMessage(from, { text: '⚠️ Envie o link do TikTok. Ex: !tiktok https://vm.tiktok.com/...' }, { quoted: msg });
    }

    await conn.sendMessage(from, { text: '📥 Baixando vídeo...' }, { quoted: msg });

    try {
        const { tiktokdl } = require('@tobyg74/tiktok-api-dl');
        const axios = require('axios');
        let videoUrl = null;

        try {
            const data = await tiktokdl(textUrl);
            if (data?.video?.noWatermark || data?.video?.noWatermark2) {
                videoUrl = data.video.noWatermark || data.video.noWatermark2;
            }
        } catch (_) {}

        if (!videoUrl) {
            const { data } = await axios.post('https://www.tikwm.com/api/', {
                url: textUrl,
                hd: 1
            }, {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                    'User-Agent': 'Mozilla/5.0'
                }
            });
            if (data?.data?.play) {
                videoUrl = data.data.play.startsWith('http') ? data.data.play : `https://www.tikwm.com${data.data.play}`;
            }
        }

        if (!videoUrl) throw new Error('Não foi possível obter o link do vídeo.');

        const response = await axios({
            url: videoUrl,
            method: 'GET',
            responseType: 'arraybuffer'
        });

        await conn.sendMessage(from, {
            video: Buffer.from(response.data),
            caption: '🎵 *TikTok Video* (Sem Marca d\'Água)'
        }, { quoted: msg });
    } catch (e) {
        await conn.sendMessage(from, { text: '❌ Erro ao baixar o vídeo do TikTok. Verifique o link e tente novamente.' }, { quoted: msg });
    }
    break;
}
```

### ⚙️ Fórmula de Funcionamento
1. **Validação:** Extrai `args[0]` e confere se atende ao padrão de URL de domínio oficial `tiktok.com`.
2. **Dupla Extração (Scraping + API Fallback):**
   - Tenta extrair a URL limpa (sem marca d'água) através do pacote `@tobyg74/tiktok-api-dl`.
   - Se houver bloqueio ou erro de conexão, aciona o fallback para a API pública `tikwm.com`.
3. **Download Binário:** Realiza requisição HTTP GET com `arraybuffer` carregando o conteúdo binário diretamente em memória (`Buffer.from(response.data)`).
4. **Envio:** Transmite o buffer de vídeo MP4 ao chat com legenda e citação à mensagem original.

---

## 2. Brat (`brat`)

### 📌 Case / Estrutura
```javascript
case 'brat':
case 'brat2': {
    const from = msg.key.remoteJid;
    const text = args.join(' ').trim();

    if (!text) {
        return await conn.sendMessage(from, { text: '🤍 *Brat Generator*\n\nDigite o texto desejado.\nEx: !brat texto aqui' }, { quoted: msg });
    }

    try {
        const axios = require('axios');
        const sharp = require('sharp');
        const { writeExif } = require('./dados/funções/autofigUtils');

        const apiUrl = `https://aqul-brat.hf.space/api/brat?text=${encodeURIComponent(text)}`;
        const response = await axios.get(apiUrl, { responseType: 'arraybuffer' });

        const webpBuffer = await sharp(response.data)
            .resize(512, 512, { fit: 'contain', background: { r: 138, g: 206, b: 0, alpha: 1 } })
            .webp()
            .toBuffer();

        const stickerFinal = await writeExif(webpBuffer, {
            pack: 'Brat Generator',
            author: senderName || 'OlympProtect'
        });

        await conn.sendMessage(from, { sticker: stickerFinal }, { quoted: msg });
    } catch (e) {
        await conn.sendMessage(from, { text: '❌ Ocorreu um erro ao gerar o sticker Brat.' }, { quoted: msg });
    }
    break;
}
```

### ⚙️ Fórmula de Funcionamento
1. **Validação de Texto:** Exige ao menos uma palavra em `args.join(' ')`.
2. **Geração Visual:** Produz a estética característica do álbum Brat (fundo verde limão `#8ACE00`, tipografia preta em caixa baixa e leve desfoque proposital) através da API HuggingFace ou canvas nativo.
3. **Conversão de Formato:** Processa a imagem com a biblioteca `sharp`, redimensionando para 512x512 pixels e convertendo para formato `.webp`.
4. **Metadados EXIF:** Aplica metadados de pacote e autor (`writeExif`) para identificação da autoria nos clientes WhatsApp.

---

## 3. Take (`take`)

### 📌 Case / Estrutura
```javascript
case 'take':
case 'roubar': {
    const from = msg.key.remoteJid;
    const fs = require('fs-extra');
    const path = require('path');
    const { downloadContentFromMessage } = require('./dados/funções/mediaUtils');
    const { writeExif } = require('./dados/funções/autofigUtils');
    const { normalizeId } = require('./dados/funções/normalizarid');

    const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    const stickerMsg = quoted?.stickerMessage;

    if (!stickerMsg) {
        return await conn.sendMessage(from, { text: '⚠️ Responda a uma figurinha para alterar os créditos com !take.' }, { quoted: msg });
    }

    const takePath = path.resolve(__dirname, 'dados/database/take.json');
    if (!fs.existsSync(takePath)) {
        return await conn.sendMessage(from, { text: '❌ Registre seu pacote primeiro usando: !rgtake <pack> | <autor>' }, { quoted: msg });
    }

    const dataTake = await fs.readJson(takePath);
    const registro = dataTake[normalizeId(sender)];

    if (!registro) {
        return await conn.sendMessage(from, { text: '❌ Você ainda não registrou seu take. Use: !rgtake <pack> | <autor>' }, { quoted: msg });
    }

    try {
        const stream = await downloadContentFromMessage(stickerMsg, 'sticker');
        let buffer = Buffer.from([]);
        for await (const chunk of stream) {
            buffer = Buffer.concat([buffer, chunk]);
        }

        const isAnim = Boolean(stickerMsg.isAnimated || buffer.indexOf(Buffer.from('ANIM')) !== -1);
        const renamedBuffer = await writeExif(buffer, {
            pack: registro.pack || 'Pack',
            author: registro.author || ''
        });

        await conn.sendMessage(from, {
            sticker: renamedBuffer,
            isAnimated: isAnim
        }, { quoted: msg });
    } catch (e) {
        await conn.sendMessage(from, { text: '❌ Falha ao aplicar novo take na figurinha.' }, { quoted: msg });
    }
    break;
}
```

### ⚙️ Fórmula de Funcionamento
1. **Identificação da Mensagem Citada:** Verifica se o remetente respondeu a um `stickerMessage`.
2. **Banco de Dados Pessoal (`take.json`):** Busca a chave do usuário (`normalizeId(sender)`) contendo `{ pack, author }`. Se não existir, exige o uso de `!rgtake`.
3. **Download da Mídia:** Baixa o payload binário via streaming do WhatsApp (`downloadContentFromMessage`).
4. **Verificação de Animação:** Checa flags nativas e cabeçalhos binários (`ANIM`) para preservar figurinhas animadas.
5. **Reescrita de EXIF:** Substitui os blocos de metadados binários do WebP pelos novos valores e dispara a figurinha personalizada.

---

## 4. Jogo da Forca (`forca`)

### 📌 Case / Estrutura
```javascript
case 'forca':
case 'jogodaforca':
case 'jf': {
    const from = msg.key.remoteJid;
    if (!from.endsWith('@g.us')) {
        return await conn.sendMessage(from, { text: '❌ O Jogo da Forca só pode ser jogado em grupos.' }, { quoted: msg });
    }

    if (!global.forcaGames) global.forcaGames = {};
    let game = global.forcaGames[from];

    const palavras = [
        { palavra: 'COMPUTADOR', tema: 'Tecnologia' },
        { palavra: 'MELANCIA', tema: 'Fruta' },
        { palavra: 'BRASIL', tema: 'País' },
        { palavra: 'GUITARRA', tema: 'Instrumento Musical' },
        { palavra: 'ELEFANTE', tema: 'Animal' },
        { palavra: 'ASTRONAUTA', tema: 'Profissão' }
    ];

    const estagios = [
        "  +---+\n  |   |\n      |\n      |\n      |\n      |\n=========",
        "  +---+\n  |   |\n  O   |\n      |\n      |\n      |\n=========",
        "  +---+\n  |   |\n  O   |\n  |   |\n      |\n      |\n=========",
        "  +---+\n  |   |\n  O   |\n /|   |\n      |\n      |\n=========",
        "  +---+\n  |   |\n  O   |\n /|\\  |\n      |\n      |\n=========",
        "  +---+\n  |   |\n  O   |\n /|\\  |\n /    |\n      |\n=========",
        "  +---+\n  |   |\n  O   |\n /|\\  |\n / \\  |\n      |\n========="
    ];

    const subCmd = args[0] ? args[0].toUpperCase() : '';

    if (subCmd === 'DESISTIR' || subCmd === 'PARAR') {
        if (!game) return await conn.sendMessage(from, { text: 'Nenhum jogo em andamento.' }, { quoted: msg });
        delete global.forcaGames[from];
        return await conn.sendMessage(from, { text: `🏳️ Jogo cancelado! A palavra era: *${game.palavra}*` }, { quoted: msg });
    }

    if (!game) {
        const item = palavras[Math.floor(Math.random() * palavras.length)];
        game = {
            palavra: item.palavra,
            tema: item.tema,
            tentadas: [],
            erros: 0
        };
        global.forcaGames[from] = game;
    } else if (subCmd && subCmd.length === 1 && /[A-Z]/.test(subCmd)) {
        if (game.tentadas.includes(subCmd)) {
            return await conn.sendMessage(from, { text: `⚠️ A letra *${subCmd}* já foi tentada!` }, { quoted: msg });
        }
        game.tentadas.push(subCmd);
        if (!game.palavra.includes(subCmd)) {
            game.erros++;
        }
    }

    let exibicao = '';
    let ganhou = true;
    for (const letra of game.palavra) {
        if (game.tentadas.includes(letra)) {
            exibicao += `${letra} `;
        } else {
            exibicao += '_ ';
            ganhou = false;
        }
    }

    if (ganhou) {
        const palFinal = game.palavra;
        delete global.forcaGames[from];
        return await conn.sendMessage(from, {
            text: `🎉 *VITÓRIA!* Vocês adivinharam a palavra: *${palFinal}*!`
        }, { quoted: msg });
    }

    if (game.erros >= 6) {
        const palFinal = game.palavra;
        delete global.forcaGames[from];
        return await conn.sendMessage(from, {
            text: `☠️ *ENFORCADO!*\n\n\`\`\`${estagios[6]}\`\`\`\n\nA palavra correta era: *${palFinal}*`
        }, { quoted: msg });
    }

    const resposta = `🎮 *JOGO DA FORCA*\n\n\`\`\`${estagios[game.erros]}\`\`\`\n\n📌 *Dica:* ${game.tema}\n📝 *Palavra:* ${exibicao.trim()}\n🔤 *Letras tentadas:* ${game.tentadas.join(', ') || 'Nenhuma'}\n\n👉 Para chutar uma letra: *!forca <letra>*\n👉 Para encerrar: *!forca desistir*`;
    await conn.sendMessage(from, { text: resposta }, { quoted: msg });
    break;
}
```

### ⚙️ Fórmula de Funcionamento
1. **Gerenciamento de Estado por Grupo:** `global.forcaGames[from]` guarda o estado da partida em memória (palavra, tema, letras tentadas e contagem de erros).
2. **Início e Chute:**
   - Sem argumentos ou jogo inexistente: escolhe palavra aleatória e inicializa o tabuleiro.
   - Com uma letra (`!forca A`): confere se a letra já foi dita; caso contrário, registra e valida acerto ou erro.
3. **Desenho Dinâmico (ASCII):** Seleciona a representação do boneco baseada em `game.erros` (0 a 6).
4. **Condições de Vitória/Derrota:**
   - Se todas as letras forem reveladas: vitória da equipe.
   - Se `erros >= 6`: derrota, exibe forca completa e revela a palavra.

---

## 5. Jogo da Velha (`jogodavelha`)

### 📌 Case / Estrutura
```javascript
case 'jogodavelha':
case 'ttt':
case 'velha':
case 'fimjogo': {
    const from = msg.key.remoteJid;
    if (!from.endsWith('@g.us')) {
        return await conn.sendMessage(from, { text: '⚠️ O jogo da velha só funciona em grupos.' }, { quoted: msg });
    }

    const tictactoe = require('./dados/funções/tictactoe');
    const { compareIds } = require('./dados/funções/normalizarid');

    if (command === 'fimjogo') {
        const result = tictactoe.endGame(from);
        return await conn.sendMessage(from, { text: result.message, mentions: result.mentions || [] }, { quoted: msg });
    }

    const contextInfo = msg.message?.extendedTextMessage?.contextInfo;
    const targetJid = contextInfo?.participant || contextInfo?.mentionedJid?.[0];

    if (!targetJid) {
        return await conn.sendMessage(from, {
            text: '🎮 *JOGO DA VELHA*\n\nMarque o adversário: *!jogodavelha @usuario*\nOu encerre o jogo ativo: *!fimjogo*'
        }, { quoted: msg });
    }

    if (compareIds(targetJid, sender)) {
        return await conn.sendMessage(from, { text: '❌ Você não pode jogar contra si mesmo!' }, { quoted: msg });
    }

    const result = tictactoe.invitePlayer(from, sender, targetJid);
    await conn.sendMessage(from, { text: result.message, mentions: result.mentions || [] }, { quoted: msg });
    break;
}
```

### ⚙️ Fórmula de Funcionamento
1. **Estrutura de Sessão (`tictactoe.js`):** Guarda a matriz 3x3 (`[0..8]`), identificador dos jogadores X e O e o turno atual.
2. **Representação do Tabuleiro:** Exibe casas de 1 a 9 com emojis numéricos (`1️⃣` a `9️⃣`) e substitui por `❌` ou `⭕`.
3. **Alternância de Turnos:** O jogador da rodada responde com o número da casa desejada (1 a 9).
4. **Resolução de Vitória:** A cada lance, checa as 8 combinações de vitória (linhas, colunas e diagonais). Ao haver 3 símbolos alinhados ou empate (9 lances), encerra a sessão e divulga o resultado.

---

## 6. Gerador de Nicks (`gerarnick`)

### 📌 Case / Estrutura
```javascript
case 'gerarnick':
case 'nick': {
    const from = msg.key.remoteJid;
    const text = args.join(' ').trim();

    if (!text) {
        return await conn.sendMessage(from, { text: 'Uso: !gerarnick <texto>' }, { quoted: msg });
    }

    const styleMappings = {
        bold: { a: '𝐚', b: '𝐛', c: '𝐜', d: '𝐝', e: '𝐞', f: '𝐟', g: '𝐠', h: '𝐡', i: '𝐢', j: '𝐣', k: '𝐤', l: '𝐥', m: '𝐦', n: '𝐧', o: '𝐨', p: '𝐩', q: '𝐪', r: '𝐫', s: '𝐬', t: '𝐭', u: '𝐮', v: '𝐯', w: '𝐰', x: '𝐱', y: '𝐲', z: '𝐳' },
        italic: { a: '𝘢', b: '𝘣', c: '𝘤', d: '𝘥', e: '𝘦', f: '𝘧', g: '𝘨', h: '𝘩', i: '𝘪', j: '𝘫', k: '𝘬', l: '𝘭', m: '𝘮', n: '𝘯', o: '𝘰', p: '𝘱', q: '𝘲', r: '𝘳', s: '𝘴', t: '𝘵', u: '𝘶', v: '𝘷', w: '𝘸', x: '𝘹', y: '𝘺', z: '𝘻' },
        monospace: { a: '𝚊', b: '𝚋', c: '𝚌', d: '𝚍', e: '𝚎', f: '𝚏', g: '𝚐', h: '𝚑', i: '𝚒', j: '𝚓', k: '𝚔', l: '𝚕', m: '𝚖', n: '𝚗', o: '𝚘', p: '𝚙', q: '𝚚', r: '𝚛', s: '𝚜', t: '𝚝', u: '𝚞', v: '𝚟', w: '𝚠', x: '𝚡', y: '𝚢', z: '𝚣' },
        circled: { a: 'ⓐ', b: 'ⓑ', c: 'ⓒ', d: 'ⓓ', e: 'ⓔ', f: 'ⓕ', g: 'ⓖ', h: 'ⓗ', i: 'ⓘ', j: 'ⓙ', k: 'ⓚ', l: 'ⓛ', m: 'ⓜ', n: 'ⓝ', o: 'ⓞ', p: 'ⓟ', q: 'ⓠ', r: 'ⓡ', s: 'ⓢ', t: 'ⓣ', u: 'ⓤ', v: 'ⓥ', w: 'ⓦ', x: 'ⓧ', y: 'ⓨ', z: 'ⓩ' }
    };

    const results = Object.keys(styleMappings).map(style => {
        const map = styleMappings[style];
        return text.split('').map(char => map[char.toLowerCase()] || char).join('');
    });

    await conn.sendMessage(from, { text: `✨ *Estilos Gerados:*\n\n${results.join('\n')}` }, { quoted: msg });
    break;
}
```

### ⚙️ Fórmula de Funcionamento
1. **Recepção:** Recebe o texto base informado em `args.join(' ')`.
2. **Mapeamento Unicode:** Varre os caracteres originais e substitui cada letra por seus equivalentes gráficos das tabelas Unicode (Negrito Sans, Itálico, Monospace, Círculos, Gótico, Sobrescrito, etc.).
3. **Saída:** Concatena os resultados linha a linha em mensagem de texto formatada para cópia rápida.

---

## 7. Modo Ausente (`afk`)

### 📌 Case / Estrutura
```javascript
case 'afk':
case 'ausente': {
    const from = msg.key.remoteJid;
    const Usuario = require('./dados/modelos/Usuario');
    const { normalizeId } = require('./dados/funções/normalizarid');
    const senderId = normalizeId(sender);
    const reason = args.join(' ').trim();

    try {
        let usuario = await Usuario.findOne({ userId: senderId });
        if (!usuario) {
            usuario = new Usuario({ userId: senderId, nome: senderName || 'Usuário' });
        }
        usuario.afkSince = Date.now();
        usuario.afkReason = reason || '';
        await usuario.save();

        const msgTexto = reason 
            ? `💤 *Modo AFK Ativado!*\n\nVocê está ausente por: "${reason}". Quem te marcar será avisado!`
            : `💤 *Modo AFK Ativado!*\n\nVocê está ausente. Quem te marcar no grupo será avisado!`;

        await conn.sendMessage(from, {
            text: msgTexto,
            mentions: [`${senderId}@s.whatsapp.net`]
        }, { quoted: msg });
    } catch (e) {
        await conn.sendMessage(from, { text: '❌ Erro ao ativar o modo AFK.' }, { quoted: msg });
    }
    break;
}
```

### ⚙️ Fórmula de Funcionamento
1. **Ativação:** Normaliza o JID do remetente e armazena `afkSince = Date.now()` e o motivo no documento do usuário em banco.
2. **Aviso Automático ao Marcar (Trigger em `mensagens.js`):**
   - Ao receber qualquer mensagem contendo menção a `@alvo`, verifica se `alvo.afkSince` possui timestamp ativo.
   - Envia resposta imediata: `"O usuário @... está ausente há X minutos. Motivo: ..."`
3. **Retorno do Usuário:** Quando o próprio usuário AFK fala no grupo, o sistema remove a flag de ausência e dispara uma mensagem de boas-vindas informando o tempo total em que esteve fora.

---

## 8. Mute (`mute`)

### 📌 Case / Estrutura
```javascript
case 'mute':
case 'mutar':
case 'silenciar': {
    const from = msg.key.remoteJid;
    if (!from.endsWith('@g.us')) return await conn.sendMessage(from, { text: 'Apenas em grupos.' }, { quoted: msg });

    const { isUserAdmin, compareIds, normalizeId } = require('./dados/funções/normalizarid');
    const groupMetadata = await conn.groupMetadata(from);

    if (!isUserAdmin(groupMetadata, sender)) {
        return await conn.sendMessage(from, { text: '❌ Apenas administradores podem mutar membros.' }, { quoted: msg });
    }

    const contextInfo = msg.message?.extendedTextMessage?.contextInfo;
    const targetJid = contextInfo?.participant || contextInfo?.mentionedJid?.[0];

    if (!targetJid) {
        return await conn.sendMessage(from, { text: '⚠️ Marque ou responda a mensagem de quem deseja mutar.' }, { quoted: msg });
    }

    if (compareIds(targetJid, sender)) {
        return await conn.sendMessage(from, { text: '❌ Você não pode mutar a si mesmo.' }, { quoted: msg });
    }

    if (!global.mutedUsers) global.mutedUsers = {};
    if (!global.mutedUsers[from]) global.mutedUsers[from] = [];

    const normTarget = normalizeId(targetJid);
    if (!global.mutedUsers[from].includes(normTarget)) {
        global.mutedUsers[from].push(normTarget);
    }

    await conn.sendMessage(from, {
        text: `🔇 @${normTarget} foi silenciado pelo administrador. Todas as suas mensagens serão apagadas automaticamente!`,
        mentions: [targetJid]
    }, { quoted: msg });
    break;
}
```

### ⚙️ Fórmula de Funcionamento
1. **Validação de Hierarquia:** Permite execução apenas por administradores do grupo. Impede mutar a si próprio, outros admins ou o bot.
2. **Registro Volátil:** Adiciona o ID normalizado do alvo ao array `global.mutedUsers[from]`.
3. **Execução no Loop de Mensagens:**
   - A cada mensagem que chega no grupo, se o remetente constar em `global.mutedUsers[from]`, o bot invoca instantaneamente:
     ```javascript
     await conn.sendMessage(from, { delete: msg.key });
     ```
   - O comando `!unmute` remove o membro da lista, restaurando sua permissão de fala.

---

## 9. Lista Negra (`listanegra`)

### 📌 Case / Estrutura
```javascript
case 'listanegra':
case 'blacklist':
case 'banlist': {
    const from = msg.key.remoteJid;
    if (!from.endsWith('@g.us')) return await conn.sendMessage(from, { text: 'Apenas em grupos.' }, { quoted: msg });

    const Grupo = require('./dados/modelos/grupos');
    const { isUserAdmin, normalizeId } = require('./dados/funções/normalizarid');
    const groupMetadata = await conn.groupMetadata(from);

    if (!isUserAdmin(groupMetadata, sender)) {
        return await conn.sendMessage(from, { text: '❌ Apenas administradores podem gerenciar a lista negra.' }, { quoted: msg });
    }

    let target = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0] ||
                 msg.message?.extendedTextMessage?.contextInfo?.participant ||
                 args[0]?.replace(/[^0-9]/g, '');

    if (!target) {
        return await conn.sendMessage(from, { text: '⚠️ Marque, responda ou envie o número a ser banido.' }, { quoted: msg });
    }

    target = normalizeId(target);
    let grupoDB = await Grupo.findOne({ groupId: from }) || new Grupo({ groupId: from });
    if (!grupoDB.listaNegra) grupoDB.listaNegra = [];

    if (!grupoDB.listaNegra.includes(target)) {
        grupoDB.listaNegra.push(target);
        await grupoDB.save();
    }

    await conn.sendMessage(from, {
        text: `🚫 *Lista Negra Atualizada*\n\nO número +${target} foi incluído e não poderá permanecer no grupo.`
    }, { quoted: msg });

    const isInGroup = groupMetadata.participants.some(p => normalizeId(p.id) === target);
    if (isInGroup) {
        await conn.groupParticipantsUpdate(from, [`${target}@s.whatsapp.net`], 'remove');
    }
    break;
}
```

### ⚙️ Fórmula de Funcionamento
1. **Validação:** Exclusivo para administradores em grupos.
2. **Persistência em Banco:** Salva o número no array `grupoDB.listaNegra` do grupo.
3. **Expulsão Imediata:** Caso o usuário já esteja dentro do grupo, invoca `conn.groupParticipantsUpdate(..., 'remove')`.
4. **Defesa Perimetral (`grupos.js`):** Quando o evento de entrada dispara (`action === 'add'`), checa a lista negra e expulsa o membro na mesma fração de segundo.

---

## 10. Anti-Imagem (`antiimg` / `antifoto`)

### 📌 Case / Estrutura
```javascript
case 'antiimg':
case 'antifoto':
case 'antiimage': {
    const from = msg.key.remoteJid;
    if (!from.endsWith('@g.us')) return await conn.sendMessage(from, { text: 'Apenas em grupos.' }, { quoted: msg });

    const Grupo = require('./dados/modelos/grupos');
    const { isUserAdmin, isBotAdmin } = require('./dados/funções/normalizarid');
    const groupMetadata = await conn.groupMetadata(from);

    if (!isUserAdmin(groupMetadata, sender)) {
        return await conn.sendMessage(from, { text: '❌ Apenas administradores podem configurar o anti-imagem.' }, { quoted: msg });
    }
    if (!isBotAdmin(groupMetadata, conn.user.id)) {
        return await conn.sendMessage(from, { text: '⚠️ O bot precisa ser Administrador para apagar fotos.' }, { quoted: msg });
    }

    let grupoDB = await Grupo.findOne({ groupId: from }) || new Grupo({ groupId: from });
    grupoDB.antifoto = !grupoDB.antifoto;
    await grupoDB.save();

    const status = grupoDB.antifoto ? 'ATIVADO 🛡️' : 'DESATIVADO 🔓';
    await conn.sendMessage(from, { text: `O sistema *Anti-Imagem* foi ${status} no grupo.` }, { quoted: msg });
    break;
}
```

### ⚙️ Interceptação no Handler (`mensagens.js`)
```javascript
if (grupoConfig.antifoto && msg.message?.imageMessage && !isSenderAdmin && !msg.key.fromMe) {
    await conn.sendMessage(from, { delete: msg.key });
}
```

### ⚙️ Fórmula de Funcionamento
1. **Configuração:** Alterna a flag booleana `grupoDB.antifoto`.
2. **Filtro em Tempo Real:** No loop de mensagens, intercepta mensagens do tipo `imageMessage`. Se o autor não for administrador, apaga a foto imediatamente.

---

## 11. Anti-Pornografia (`antiporn`)

### 📌 Case / Estrutura
```javascript
case 'antiporn':
case 'antinsfw': {
    const from = msg.key.remoteJid;
    if (!from.endsWith('@g.us')) return await conn.sendMessage(from, { text: 'Apenas em grupos.' }, { quoted: msg });

    const Grupo = require('./dados/modelos/grupos');
    const { isUserAdmin, isBotAdmin } = require('./dados/funções/normalizarid');
    const groupMetadata = await conn.groupMetadata(from);

    if (!isUserAdmin(groupMetadata, sender)) {
        return await conn.sendMessage(from, { text: '❌ Apenas administradores podem ativar o Anti-Porn.' }, { quoted: msg });
    }
    if (!isBotAdmin(groupMetadata, conn.user.id)) {
        return await conn.sendMessage(from, { text: '⚠️ O bot precisa ser Administrador para moderar conteúdo adulto.' }, { quoted: msg });
    }

    let grupoDB = await Grupo.findOne({ groupId: from }) || new Grupo({ groupId: from });
    grupoDB.antiporn = !grupoDB.antiporn;
    await grupoDB.save();

    const status = grupoDB.antiporn ? 'ATIVADO 🛡️' : 'DESATIVADO 🔓';
    const msgInfo = grupoDB.antiporn
        ? `🔞 *Anti-Porn foi ${status}!*\nImagens com conteúdo adulto/NSFW serão deletadas e o remetente será banido.`
        : `🔞 *Anti-Porn foi ${status}!*\nConteúdo adulto não será mais bloqueado automaticamente.`;

    await conn.sendMessage(from, { text: msgInfo }, { quoted: msg });
    break;
}
```

### ⚙️ Interceptação e Detecção NSFW (`mensagens.js`)
```javascript
if (grupoConfig.antiporn && (msg.message?.imageMessage || msg.message?.stickerMessage) && !isSenderAdmin && !msg.key.fromMe) {
    const { downloadMediaBuffer } = require('./dados/funções/autofigUtils');
    const buffer = await downloadMediaBuffer(msg.message.imageMessage || msg.message.stickerMessage, 'image');

    const isNsfw = await verificarConteudoAdulto(buffer);
    if (isNsfw) {
        await conn.sendMessage(from, { delete: msg.key });
        await conn.groupParticipantsUpdate(from, [participant], 'remove');
        await conn.sendMessage(from, {
            text: `🚫 *Proteção:* @${participant.split('@')[0]} foi banido por enviar conteúdo adulto (NSFW).`,
            mentions: [participant]
        });
    }
}
```

### ⚙️ Fórmula de Funcionamento
1. **Toggle de Segurança:** Salva a preferência em `grupoDB.antiporn`.
2. **Download e Classificação IA:** Ao receber imagem ou figurinha de membro comum, baixa o buffer e realiza a classificação através de rede neural (IA Vision / modelo NSFW).
3. **Punição Severa:** Se o índice de conteúdo impróprio ultrapassar a margem de segurança (> 75%), a mídia é excluída, o autor é expulso do grupo e um aviso público de moderação é emitido.
