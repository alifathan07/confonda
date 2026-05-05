// Uses API to call the running app's WhatsApp service
import http from 'http';

const req = http.get('http://localhost:3000/api/demandes-fourniture/send-whatsapp?numero=169', (res) => {
  let data = '';
  res.on('data', c => data += c);
  res.on('end', () => console.log(data || 'Done!'));
});
req.on('error', e => console.error('Error:', e.message));
