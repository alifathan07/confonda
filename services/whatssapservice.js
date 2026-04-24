// services/whatsappService.js
import pkg from "whatsapp-web.js";
import qrcode from "qrcode-terminal";

const { Client, LocalAuth, MessageMedia } = pkg;

const state = {
  client: null,
  isReady: false,
  readyPromise: null,
  _readyResolve: null,
  reconnectTimer: null,
};

export const getClient = () => state.client;
export const isReady = () => state.isReady;
export const waitUntilReady = () => state.readyPromise;

const createClient = () =>
  new Client({
    authStrategy: new LocalAuth({ dataPath: "./.wwebjs_auth" }),
    puppeteer: {
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
        "--no-zygote",
      ],
    },
  });

const resetReadyPromise = () => {
  state.readyPromise = new Promise((resolve) => {
    state._readyResolve = resolve;
  });
};

const scheduleReconnect = () => {
  if (state.reconnectTimer) return;
  console.log("🔄 Reconnecting in 30s...");
  state.reconnectTimer = setTimeout(async () => {
    state.reconnectTimer = null;
    state.isReady = false;
    try { await state.client.destroy(); } catch (_) {}
    resetReadyPromise();
    state.client = createClient();
    setupListeners();
    state.client.initialize();
  }, 30_000);
};

const setupListeners = () => {
  state.client.on("qr", (qr) => {
    qrcode.generate(qr, { small: true });
    console.log("📱 Scan the QR code with WhatsApp");
  });

  state.client.on("ready", () => {
    state.isReady = true;
    state._readyResolve?.(true);
    console.log("✅ WhatsApp is ready!");
  });

  state.client.on("auth_failure", (msg) => {
    console.error("❌ Auth failure:", msg);
    scheduleReconnect();
  });

  state.client.on("disconnected", (reason) => {
    state.isReady = false;
    console.warn("⚠️ Disconnected:", reason);
    scheduleReconnect();
  });
};

// ─── Core send (text + optional media) ───────────────────────────────────────
const sendMessage = async (to, message, media = null) => {
  await waitUntilReady();
  const client = getClient();
  if (!client) throw new Error("WhatsApp client not initialized");

  // Normalize phone number to WhatsApp chat ID
  const chatId = to.includes("@c.us") ? to : `${to.replace(/\D/g, "")}@c.us`;

  if (media) {
    // media = { data: Buffer, filename: string, mimetype: string }
    const messageMedia = new MessageMedia(
      media.mimetype,
      media.data instanceof Buffer
        ? media.data.toString("base64")  // convert Buffer → base64 string
        : media.data,                    // already base64
      media.filename
    );

    // Send media with caption
    await client.sendMessage(chatId, messageMedia, { caption: message });
  } else {
    await client.sendMessage(chatId, message);
  }
};

// ─── Named export matching your controller's import ───────────────────────────
export const whatsappService = {
  sendMessage,
  getClient,
  isReady,
  waitUntilReady,
};

// ─── Bootstrap ────────────────────────────────────────────────────────────────
resetReadyPromise();
state.client = createClient();
setupListeners();
state.client.initialize();