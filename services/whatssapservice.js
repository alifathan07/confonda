// services/whatsappService.js
import pkg from "whatsapp-web.js";
import qrcode from "qrcode-terminal";

const { Client, LocalAuth, MessageMedia } = pkg;

// ─── Debug logger ─────────────────────────────────────────────────────────────
const debug = (tag, msg, data = null) => {
  const ts = new Date().toISOString();
  if (data) {
    console.log(`[${ts}] [WA:${tag}] ${msg}`, data);
  } else {
    console.log(`[${ts}] [WA:${tag}] ${msg}`);
  }
};

const state = {
  client: null,
  isReady: false,
  readyPromise: null,
  _readyResolve: null,
  reconnectTimer: null,
  sendCount: 0,       // track total sends attempted
  reconnectCount: 0,  // track how many times we've reconnected
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
  debug("PROMISE", "Resetting readyPromise → client is now BLOCKED until reconnect");
  state.readyPromise = new Promise((resolve) => {
    state._readyResolve = resolve;
  });
};

const scheduleReconnect = () => {
  if (state.reconnectTimer) {
    debug("RECONNECT", "Reconnect already scheduled, skipping");
    return;
  }

  state.reconnectCount++;
  debug("RECONNECT", `Scheduling reconnect #${state.reconnectCount} in 30s...`);

  state.reconnectTimer = setTimeout(async () => {
    state.reconnectTimer = null;
    state.isReady = false;

    debug("RECONNECT", `Starting reconnect #${state.reconnectCount} — destroying old client...`);
    try {
      await state.client.destroy();
      debug("RECONNECT", "Old client destroyed successfully");
    } catch (e) {
      debug("RECONNECT", "Error destroying old client (ignored):", e.message);
    }

    resetReadyPromise();
    state.client = createClient();
    setupListeners();
    debug("RECONNECT", "New client created, calling initialize()...");
    state.client.initialize();
  }, 30_000);
};

const setupListeners = () => {
  state.client.on("qr", (qr) => {
    qrcode.generate(qr, { small: true });
    debug("QR", "QR code generated — waiting for scan...");
  });

  state.client.on("loading_screen", (percent, message) => {
    debug("LOADING", `WhatsApp loading: ${percent}% — ${message}`);
  });

  state.client.on("authenticated", () => {
    debug("AUTH", "Session authenticated ✅ (loading WhatsApp...)");
  });

  state.client.on("ready", () => {
    state.isReady = true;
    state._readyResolve?.(true);
    debug("READY", `Client is READY ✅ (reconnects so far: ${state.reconnectCount})`);
  });

  state.client.on("auth_failure", (msg) => {
    debug("AUTH", `Auth FAILED ❌ — reason: ${msg}`);
    state.isReady = false;
    resetReadyPromise();
    scheduleReconnect();
  });

  state.client.on("disconnected", (reason) => {
    debug("DISCONNECT", `Client disconnected ⚠️ — reason: ${reason}`);
    state.isReady = false;
    resetReadyPromise();
    scheduleReconnect();
  });
};

// ─── Core send (text + optional media) ───────────────────────────────────────
const sendMessage = async (to, message, media = null) => {
  const sendId = ++state.sendCount;
  const tag = `SEND#${sendId}`;

  debug(tag, `New send request`, {
    to,
    messagePreview: message?.slice(0, 60),
    hasMedia: !!media,
    mediaFilename: media?.filename ?? null,
    mediaType: media?.mimetype ?? null,
    clientReady: state.isReady,
  });

  debug(tag, "Awaiting readyPromise...");
  await waitUntilReady();
  debug(tag, "readyPromise resolved — client is ready");

  const client = getClient();
  if (!client) {
    debug(tag, "ERROR: client is null after readyPromise resolved ❌");
    throw new Error("WhatsApp client not initialized");
  }

  // Guard: check if Puppeteer page is still alive
  try {
    const page = client.pupPage;
    if (!page) {
      debug(tag, "ERROR: pupPage is null — triggering reconnect ❌");
      state.isReady = false;
      resetReadyPromise();
      scheduleReconnect();
      throw new Error("WhatsApp pupPage is null, reconnecting...");
    }
    if (page.isClosed()) {
      debug(tag, "ERROR: pupPage is CLOSED (detached frame) — triggering reconnect ❌");
      state.isReady = false;
      resetReadyPromise();
      scheduleReconnect();
      throw new Error("WhatsApp page is closed, reconnecting...");
    }
    debug(tag, "pupPage check passed ✅ — page is alive");
  } catch (e) {
    if (e.message.includes("detached") || e.message.includes("closed")) {
      debug(tag, `pupPage threw detached/closed error — triggering reconnect ❌`, e.message);
      state.isReady = false;
      resetReadyPromise();
      scheduleReconnect();
    }
    throw e;
  }

  // Normalize number
  const chatId = to.includes("@c.us") ? to : `${to.replace(/\D/g, "")}@c.us`;
  debug(tag, `Normalized chatId: ${chatId}`);

  try {
    if (media) {
      debug(tag, `Preparing MessageMedia — size: ${
        media.data instanceof Buffer
          ? `${(media.data.length / 1024).toFixed(1)} KB`
          : "base64 string"
      }`);

      const messageMedia = new MessageMedia(
        media.mimetype,
        media.data instanceof Buffer
          ? media.data.toString("base64")
          : media.data,
        media.filename
      );

      debug(tag, "Calling client.sendMessage() with media + caption...");
      await client.sendMessage(chatId, messageMedia, { caption: message });
      debug(tag, `✅ Media message sent successfully to ${chatId}`);
    } else {
      debug(tag, "Calling client.sendMessage() with text only...");
      await client.sendMessage(chatId, message);
      debug(tag, `✅ Text message sent successfully to ${chatId}`);
    }
  } catch (e) {
    debug(tag, `❌ client.sendMessage() threw an error:`, {
      message: e.message,
      stack: e.stack?.split("\n")[1]?.trim(),
    });
    throw e;
  }
};

// ─── Named export ─────────────────────────────────────────────────────────────
export const whatsappService = {
  sendMessage,
  getClient,
  isReady,
  waitUntilReady,
};

// ─── Bootstrap ────────────────────────────────────────────────────────────────
debug("BOOT", "Initializing WhatsApp service...");
resetReadyPromise();
state.client = createClient();
setupListeners();
state.client.initialize();
debug("BOOT", "client.initialize() called — waiting for QR or session restore...");