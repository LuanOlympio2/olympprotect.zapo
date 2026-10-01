# OlympProtect - Bot de WhatsApp

Bot de segurança e gerenciamento para WhatsApp utilizando a biblioteca Baileys.

## Funcionalidades
- Gerenciamento de grupos
- Sistema de proteção avançado
- Integrações de Inteligência Artificial
- Sistema de cobrança automatizada com Mercado Pago
- Envio de mídias e figurinhas
- Mensagens personalizadas de entrada e saída com imagem

## Requisitos
- Node.js versão 18 ou superior
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
