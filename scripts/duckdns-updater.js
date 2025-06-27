const https = require('https');

const DUCKDNS_TOKEN = 'YOUR_DUCKDNS_TOKEN'; // <-- Set your DuckDNS token here
const DUCKDNS_DOMAIN = 'rithesh'; // <-- Set your DuckDNS domain here

function updateDuckDNS() {
  const url = `https://www.duckdns.org/update?domains=${DUCKDNS_DOMAIN}&token=${DUCKDNS_TOKEN}&ip=`;
  https.get(url, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      console.log(`[${new Date().toISOString()}] IP updated: ${data.trim()}`);
    });
  }).on('error', (err) => {
    console.log(`[${new Date().toISOString()}] DuckDNS update error: ${err.message}`);
  });
}

updateDuckDNS();
setInterval(updateDuckDNS, 5 * 60 * 1000); // every 5 minutes 