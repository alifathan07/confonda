// services/whatsappService.js
import pkg from "whatsapp-web.js";
import qrcode from "qrcode-terminal";

const { Client, LocalAuth } = pkg;

// Initialize WhatsApp client
export const client = new Client({
    authStrategy: new LocalAuth({
    dataPath: './.wwebjs_auth' // optional but clean
  }),
 puppeteer: {
 headless: true,
 args: [
 "--no-sandbox",
 "--disable-setuid-sandbox",
 "--disable-dev-shm-usage",
 "--disable-gpu",
 "--no-zygote",
 "--single-process"
 ]
 }
});
export let _isReady = false;
let _readyResolve;
export const readyPromise = new Promise((resolve) => {
    _readyResolve = resolve;
});

// client.on("qr", qr => {
//     qrcode.generate(qr, { small: true });
//     console.log("Scan the QR code with WhatsApp");
    
// });

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