import fetch from 'node-fetch';

fetch('https://api.telegram.org/bot8798805211:AAElHM6qfreLXdTqvIKECcax-CSoDiH2X7A/sendMessage', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    chat_id: 6027161132,
    text: 'Test notification!'
  })
})
.then(r => r.json())
.then(d => console.log(JSON.stringify(d)))
.catch(err => console.error(err));