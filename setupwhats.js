// services/whatsappService.js
import pkg from "whatsapp-web.js";
import qrcode from "qrcode-terminal";

const { Client, LocalAuth } = pkg;

// ─── Internal state object (single reference, mutated in place) ───────────────
const state = {
  client: null,
  isReady: false,
  readyPromise: null,
  _readyResolve: null,
  reconnectTimer: null,
};

// ─── Getters (always return current values, safe across reconnects) ───────────
export const getClient = () => state.client;
export const isReady = () => state.isReady;
export const waitUntilReady = () => state.readyPromise;

// ─── Factory ──────────────────────────────────────────────────────────────────
const createClient = () =>
  new Client({
    authStrategy: new LocalAuth({ dataPath: "./.wwebjs_auth" }),
    puppeteer: {
      headless: true,
       protocolTimeout: 600_000, // ← just add this
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
        "--no-zygote",
      ],
    },
  });

// ─── Reset the ready promise (called on each reconnect cycle) ─────────────────
const resetReadyPromise = () => {
  state.readyPromise = new Promise((resolve) => {
    state._readyResolve = resolve;
  });
};

// ─── Reconnect logic ──────────────────────────────────────────────────────────
const scheduleReconnect = () => {
  if (state.reconnectTimer) return; // already scheduled
  console.log("🔄 Reconnecting in 30s...");

  state.reconnectTimer = setTimeout(async () => {
    state.reconnectTimer = null;
    state.isReady = false;

    try {
      await state.client.destroy();
    } catch (_) { /* ignore – client may already be dead */ }

    resetReadyPromise();
    state.client = createClient();
    setupListeners();
    state.client.initialize();
  }, 30_000);
};

// ─── Event listeners ──────────────────────────────────────────────────────────
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

// ─── Safe send helper (use this everywhere instead of client directly) ────────
export const sendMessage = async (to, message) => {
  await waitUntilReady(); // always await current promise
  const client = getClient();
  if (!client) throw new Error("WhatsApp client not initialized");
  return client.sendMessage(to, message);
};

// ─── Bootstrap ────────────────────────────────────────────────────────────────
resetReadyPromise();
state.client = createClient();
setupListeners();
state.client.initialize();