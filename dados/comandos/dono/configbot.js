// creditos Olympio
const aliases = ['configbot', 'configurar', 'setup'];
async function run(conn, msg, config, args, sender, senderName) {
    const from = msg.key.remoteJid;
    const prefix = config.prefix || "!";
    const text = `
╭┈⊰ ⚙️ *CONFIGURAÇÃO DO SISTEMA*
┊
┊ Para configurar seu bot, use os
┊ comandos abaixo na ordem:
┊
┊ 1️⃣ *Definir Dono (Importante)*
┊ Salva seu Número e seu ID de Dispositivo (LID)
┊ para garantir acesso total.
┊ 👉 Use: *${prefix}setdono*
┊
┊ 2️⃣ *Alterar Prefixo*
┊ Muda o símbolo antes dos comandos.
┊ 👉 Use: *${prefix}setprefix .*
┊ (Troque o ponto pelo que quiser)
┊
╰─┈┈┈┈┈◜☣︎◞┈┈┈┈┈─╯`.trim();
    await conn.sendMessage(from, { text: text }, { quoted: msg });
}
module.exports = {
    run,
    aliases
};
