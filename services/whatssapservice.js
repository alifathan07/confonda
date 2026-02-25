import pkg from "whatsapp-web.js";
import { client, _isReady, readyPromise } from "../setupwhats.js";

const { MessageMedia } = pkg;

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

    async sendMessage(number, message, attachment) {
        try {
            await this.waitUntilReady();

            const normalized = this.normalizeNumber(number);
            if (!normalized) throw new Error("Invalid WhatsApp number");

            const chatId = `${normalized}@c.us`;
            const text = String(message ?? "");

            if (attachment) {
                const filename = attachment?.filename || "document.pdf";
                const mimetype = attachment?.mimetype || "application/pdf";

                let dataBase64 = null;
                if (Buffer.isBuffer(attachment)) {
                    dataBase64 = attachment.toString("base64");
                } else if (typeof attachment === "string") {
                    dataBase64 = attachment;
                } else if (attachment?.data && Buffer.isBuffer(attachment.data)) {
                    dataBase64 = attachment.data.toString("base64");
                } else if (attachment?.data && typeof attachment.data === "string") {
                    dataBase64 = attachment.data;
                }

                if (!dataBase64) throw new Error("Invalid attachment: expected Buffer or base64 string");
                console.log("Is buffer:", Buffer.isBuffer(attachment.data));
                console.log("Type:", typeof attachment.data);
                console.log("Chat ID:", chatId);
                const media = new MessageMedia(mimetype, dataBase64, filename);
                await this.client.sendMessage(chatId, media, { caption: text });
            } else {
                await this.client.sendMessage(chatId, text);
            }
            console.log(`Message sent to ${chatId}`);
        } catch (err) {
            console.error("Failed to send WhatsApp message:", err);
            throw err;
        }
    }
}

export const whatsappService = new WhatsAppService(client);