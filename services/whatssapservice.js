// services/whatsappService.js
import pkg from "whatsapp-web.js";
import qrcode from "qrcode-terminal";

const { Client, LocalAuth } = pkg;

// Initialize WhatsApp client
const client = new Client({ authStrategy: new LocalAuth() });

let _isReady = false;
let _readyResolve;
const readyPromise = new Promise((resolve) => {
    _readyResolve = resolve;
});

client.on("qr", qr => {
    qrcode.generate(qr, { small: true });
    console.log("Scan the QR code with WhatsApp");
});

client.on("ready", () => {
    _isReady = true;
    if (_readyResolve) _readyResolve(true);
    console.log("WhatsApp is ready!");
});

client.on("auth_failure", (msg) => {
    console.error("WhatsApp auth failure:", msg);
});

client.on("disconnected", (reason) => {
    _isReady = false;
    console.error("WhatsApp disconnected:", reason);
});

client.initialize();

// Service class
class WhatsAppService {
    constructor(client) {
        this.client = client;
    }

    normalizeNumber(number) {
        return String(number || "").replace(/\D/g, "");
    }

    async waitUntilReady(timeoutMs = 15000) {
        if (_isReady) return;

        await Promise.race([
            readyPromise,
            new Promise((_, reject) => setTimeout(() => reject(new Error("WhatsApp not ready (scan QR / auth needed)")), timeoutMs))
        ]);
    }

    async sendMessage(number, message) {
        try {
            await this.waitUntilReady();

            const normalized = this.normalizeNumber(number);
            if (!normalized) throw new Error("Invalid WhatsApp number");

            const chatId = `${normalized}@c.us`;
            await this.client.sendMessage(chatId, String(message ?? ""));
            console.log(`Message sent to ${chatId}`);
        } catch (err) {
            console.error("Failed to send WhatsApp message:", err);
            throw err;
        }
    }
}

export const whatsappService = new WhatsAppService(client);