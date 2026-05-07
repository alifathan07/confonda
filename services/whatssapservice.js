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
  sendCount: 0,
  reconnectCount: 0,
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

// ─── Detect browser-level fatal errors ───────────────────────────────────────
const isFatalBrowserError = (message = "") =>
  message.includes("detached") ||
  message.includes("Detached") ||
  message.includes("Target closed") ||
  message.includes("Session closed") ||
  message.includes("page is closed") ||
  message.includes("Protocol error") ||
  message.includes("Connection closed");

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

const triggerReconnect = (tag, reason) => {
  debug(tag, `Triggering reconnect — reason: ${reason}`);
  state.isReady = false;
  resetReadyPromise();
  scheduleReconnect();
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
    triggerReconnect("AUTH", msg);
  });

  state.client.on("disconnected", (reason) => {
    debug("DISCONNECT", `Client disconnected ⚠️ — reason: ${reason}`);
    triggerReconnect("DISCONNECT", reason);
  });
};

// ─── Puppeteer page health check ─────────────────────────────────────────────
const assertPageAlive = (tag) => {
  const client = getClient();

  if (!client) {
    throw new Error("WhatsApp client is null");
  }

  const page = client.pupPage;

  if (!page) {
    triggerReconnect(tag, "pupPage is null");
    throw new Error("WhatsApp pupPage is null, reconnecting...");
  }

  if (page.isClosed()) {
    triggerReconnect(tag, "pupPage.isClosed() === true");
    throw new Error("WhatsApp page is closed, reconnecting...");
  }

  // Note: isClosed() does NOT catch detached frames.
  // Detached frame errors only surface during actual sendMessage() execution,
  // so we handle them in the sendMessage catch block below.
  debug(tag, "pupPage check passed ✅ — page is alive");
};

// ─── Core send (text + optional media) ───────────────────────────────────────
const sendMessage = async (to, message, media = null) => {
  const sendId = ++state.sendCount;
  const tag = `SEND#${sendId}`;

  debug(tag, "New send request", {
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

  // Will throw + trigger reconnect if page is null or closed
  assertPageAlive(tag);

  const client = getClient();
  const chatId = to.includes("@c.us") ? to : `${to.replace(/\D/g, "")}@c.us`;
  debug(tag, `Normalized chatId: ${chatId}`);

  try {
    if (media) {
      const sizeLabel =
        media.data instanceof Buffer
          ? `${(media.data.length / 1024).toFixed(1)} KB`
          : "base64 string";

      debug(tag, `Preparing MessageMedia — size: ${sizeLabel}`);

      const messageMedia = new MessageMedia(
        media.mimetype,
        media.data instanceof Buffer ? media.data.toString("base64") : media.data,
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

    // Detached frame or dead browser context — must reconnect
    if (isFatalBrowserError(e.message)) {
      triggerReconnect(tag, e.message);
    }

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