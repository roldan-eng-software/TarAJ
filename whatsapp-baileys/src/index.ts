import express from 'express';
import { makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion, WASocket } from '@whiskeysockets/baileys';
import pino from 'pino';
import qrcode from 'qrcode-terminal';
import type { SendRequest, SendResponse, StatusResponse } from './types';

const app = express();
app.use(express.json());

const logger = pino({ level: 'silent' });
let sock: WASocket | null = null;
let connectionStatus: 'connecting' | 'open' | 'close' = 'close';

async function startWhatsApp(): Promise<void> {
  const { state, saveCreds } = await useMultiFileAuthState('./auth_info');
  const { version } = await fetchLatestBaileysVersion();

  sock = makeWASocket({
    version,
    auth: state,
    logger,
    printQRInTerminal: false,
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      console.log('\n📱 Escaneie o QR Code abaixo com seu WhatsApp:');
      qrcode.generate(qr, { small: true });
      console.log('');
    }

    if (connection === 'close') {
      connectionStatus = 'close';
      const statusCode = (lastDisconnect?.error as any)?.output?.statusCode;
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
      console.log(`❌ Desconectado (reason: ${statusCode}). Reconnect: ${shouldReconnect}`);

      if (shouldReconnect) {
        setTimeout(startWhatsApp, 5000);
      } else {
        console.log('🛑 Sessão encerrada. Execute novamente para reconectar.');
      }
    }

    if (connection === 'open') {
      connectionStatus = 'open';
      console.log('✅ WhatsApp conectado com sucesso!');
    }

    if (connection === 'connecting') {
      connectionStatus = 'connecting';
      console.log('🔄 Conectando ao WhatsApp...');
    }
  });
}

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

// Status
app.get('/status', (_req, res) => {
  const response: StatusResponse = { connected: sock?.user != null };
  res.json(response);
});

// Send message
app.post('/send', async (req, res) => {
  try {
    const { phone, message } = req.body as SendRequest;

    if (!phone || !message) {
      return res.status(400).json({ success: false, error: 'phone and message are required' });
    }

    if (!sock?.user) {
      return res.status(503).json({ success: false, error: 'WhatsApp not connected' });
    }

    const jid = phone.replace(/\D/g, '') + '@s.whatsapp.net';

    await sock.sendMessage(jid, { text: message });

    const response: SendResponse = { success: true };
    res.json(response);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('Send error:', message);
    const response: SendResponse = { success: false, error: message };
    res.status(500).json(response);
  }
});

const PORT = parseInt(process.env.PORT || '3001', 10);

startWhatsApp()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`🚀 Baileys service running on http://localhost:${PORT}`);
      console.log(`   GET  /health  — Health check`);
      console.log(`   GET  /status  — Connection status`);
      console.log(`   POST /send    — Send WhatsApp message`);
    });
  })
  .catch((err) => {
    console.error('Failed to start WhatsApp:', err);
    process.exit(1);
  });
