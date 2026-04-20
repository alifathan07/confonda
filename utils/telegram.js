async function sendTelegram(message) {
  const BOT_TOKEN = "8798805211:AAElHM6qfreLXdTqvIKECcax-CSoDiH2X7A";
  const CHAT_ID = "6027161132";

  try {
    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text: message,
        parse_mode: 'HTML'
      })
    });
  } catch (err) {
    console.error('Telegram notification failed:', err.message);
  }
}

module.exports = { sendTelegram };
