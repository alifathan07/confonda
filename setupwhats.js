// services/whatsappService.js
import pkg from "whatsapp-web.js";
import qrcode from "qrcode-terminal";

const { Client, LocalAuth } = pkg;

const createClient = () => new Client({
  authStrategy: new LocalAuth({
    dataPath: './.wwebjs_auth'
  }),
  puppeteer: {
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
      "--no-zygote",
      // ❌ REMOVED --single-process (causes CPU leaks)
    ]
  }
});

export let client = createClient();
export let _isReady = false;
let _readyResolve;

export let readyPromise = new Promise((resolve) => {
  _readyResolve = resolve;
});

const setupListeners = () => {
  client.on("qr", qr => {
    qrcode.generate(qr, { small: true });
    console.log("Scan the QR code with WhatsApp");
  });

  client.on("ready", () => {
    _isReady = true;
    if (_readyResolve) _readyResolve(true);
    console.log("✅ WhatsApp is ready!");
  });

  client.on("auth_failure", (msg) => {
    console.error("❌ WhatsApp auth failure:", msg);
    scheduleReconnect();
  });

  client.on("disconnected", (reason) => {
    _isReady = false;
    console.warn("⚠️ WhatsApp disconnected:", reason);
    scheduleReconnect();
  });
};

// Auto-reconnect with 30s delay
let reconnectTimer = null;
const scheduleReconnect = () => {
  if (reconnectTimer) return; // already scheduled
  console.log("🔄 Reconnecting in 30s...");
  reconnectTimer = setTimeout(async () => {
    reconnectTimer = null;
    try {
      await client.destroy(); // cleanly kill Chrome
    } catch (e) { /* ignore */ }

    // Reset ready promise
    readyPromise = new Promise((resolve) => {
      _readyResolve = resolve;
    });

    client = createClient();
    setupListeners();
    client.initialize();
  }, 30_000);
};

setupListeners();
client.initialize();