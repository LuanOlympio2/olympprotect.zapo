// creditos Olympio
const mensagensHandler = require('./mensagens');
const gruposHandler = require('./grupos');
function registrarEventos(conn, config) {
    console.log("👂 [HANDLER] Iniciando listeners de eventos...");
    conn.ev.on('messages.upsert', async (m) => {
        try {
            const type = m.type;
            if (type === 'notify') {
                await mensagensHandler(conn, m, config);
            }
        } catch (e) {
            console.error("❌ Erro no processamento de mensagem:", e);
        }
    });
    conn.ev.on('group-participants.update', async (event) => {
        try {
            await gruposHandler(conn, event, config);
        } catch (e) {
            console.error("❌ Erro no handler de grupos:", e);
        }
    });
}
module.exports = registrarEventos;
