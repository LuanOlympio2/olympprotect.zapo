# OlympProtect.zapo - Bot de WhatsApp

Esta versão do OlympProtect utiliza exclusivamente a biblioteca **Zapo** (`zapo-js`) para a conexão com o WhatsApp, contando com persistência robusta em SQLite e gerenciamento de alta performance.

## Funcionalidades
- Gerenciamento e moderação de grupos
- Sistema de proteção avançado (Anti-Spam, Anti-PG, Anti-Link, Anti-Fake, Anti-Nuke, X9)
- Sistema completo de RPG e minigames
- Integrações com Inteligência Artificial
- Envio de mídias, áudios, vídeos e figurinhas
- Mensagens personalizadas de entrada e saída com imagem

## Requisitos
- Node.js versão 20.9.0 ou superior
- FFmpeg instalado no sistema
- Executável yt-dlp na pasta principal do projeto

## Instalação

1. Acesse a pasta do projeto:
   ```bash
   cd OlympProtect
   ```

2. Instale as dependências:
   ```bash
   npm install
   ```

3. Configure os arquivos na raiz do projeto:
   - Copie `config.json.example` para `config.json` e informe o número do dono e prefixo do bot.
   - Copie `apis.json.example` para `apis.json` e informe suas chaves de API (Groq, Gemini, etc.).

## Como Executar

Execute o comando abaixo para iniciar o bot:
```bash
npm start
```
