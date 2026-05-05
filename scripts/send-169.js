// This script calls the API which uses the existing WhatsApp from the running app
import http from 'http';

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/demandes-fourniture/send-whatsapp?numero=169',
  method: 'GET'
};

console.log('🔄 Sending demande #169 via API...');

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    console.log('Response:', data);
  });
});

req.on('error', (e) => {
  console.error('Error:', e.message);
});

req.end();
