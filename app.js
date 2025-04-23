const express = require('express');
const bodyParser = require('body-parser');
const dns = require('dns').promises;
const arp = require('node-arp');
const axios = require('axios');
const { exec } = require('child_process');

const app = express();
const port = 3000;

// Middleware to parse JSON requests and serve static files
app.use(bodyParser.json());
app.use(express.static('public'));
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/scanip.html');
  });


// old technique
// Utility: Get manufacturer from MAC address
// async function getManufacturer(mac) {
//   if (!mac || mac === 'Unknown') return 'Unknown';
//   try {
//     const response = await axios.get(`https://api.macvendors.com/${mac}`);
//     return response.data || 'Unknown';
//   } catch (err) {
//     return 'Unknown';
//   }
// }

const cheerio = require('cheerio');
// Its more better 
async function getManufacturer(mac) {
  if (!mac || mac === 'Unknown') return 'Unknown';
  try {
    const url = `https://maclookup.app/search/result?mac=${mac}`;
    const response = await axios.get(url);
    const $ = cheerio.load(response.data);

    const metaContent = $('meta[name="description"]').attr('content');
    if (!metaContent) return 'Unknown';

    // Extract vendor/company name from the content string
    const match = metaContent.match(/Vendor\/Company:\s*([^,]+)/);
    const manufacturer = match ? match[1].trim() : 'Unknown';

    // console.log(manufacturer); // for debugging
    return manufacturer;
  } catch (err) {
    console.error(`Error fetching vendor for MAC ${mac}:`, err.message);
    return 'Unknown';
  }
}

// Utility: Get MAC from IP using ARP
function getMacFromIP(ip) {
  return new Promise((resolve, reject) => {
    arp.getMAC(ip, (err, mac) => {
      if (err || !mac) resolve('Unknown');
      else resolve(mac);
    });
  });
}

// Utility: Reverse DNS lookup for hostname
async function getHostname(ip) {
  try {
    const hostnames = await dns.reverse(ip);
    return hostnames[0] || 'Unknown';
  } catch {
    return 'Unknown';
  }
}

// Utility: Ping IP to check if it's reachable
function pingIP(ip) {
  return new Promise((resolve, reject) => {
    exec(`ping -n 1 -w 1000 ${ip}`, (error, stdout, stderr) => {
      if (error || stderr) reject('unreachable');
      else resolve('reachable');
    });
  });
}

// Generate IP list in range
function generateIPs(startIP, endIP) {
  const ips = [];
  const base = startIP.split('.').slice(0, 3).join('.');
  const start = parseInt(startIP.split('.')[3]);
  const end = parseInt(endIP.split('.')[3]);

  for (let i = start; i <= end; i++) {
    ips.push(`${base}.${i}`);
  }
  return ips;
}

// Core scan function
async function scanIPRange(startIP, endIP) {
  const ips = generateIPs(startIP, endIP);
  const results = [];

  const batchSize = 10;
  for (let i = 0; i < ips.length; i += batchSize) {
    const batch = ips.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(async (ip) => {
      try {
        const pingStatus = await pingIP(ip);
        if (pingStatus === 'reachable') {
          const mac = await getMacFromIP(ip);
          const hostname = await getHostname(ip);
          const manufacturer = await getManufacturer(mac);
          const status = mac === 'Unknown' ? 'Inactive' : 'Active';
          return { IP: ip, MAC: mac, Status: status, Hostname: hostname, Manufacturer: manufacturer };
        } else {
          return { IP: ip, Status: 'Unreachable', MAC: 'Unknown', Hostname: 'Unknown', Manufacturer: 'Unknown' };
        }
      } catch {
        return { IP: ip, Status: 'Error', MAC: 'Unknown', Hostname: 'Unknown', Manufacturer: 'Unknown' };
      }
    }));

    results.push(...batchResults);
  }

  return results;
}

// POST /scan endpoint with macOnly support
app.post('/scan', async (req, res) => {
  const { startIP, endIP, macOnly } = req.body;

  if (!startIP || !endIP) {
    return res.status(400).json({ error: 'Start and end IP are required' });
  }

  try {
    const results = await scanIPRange(startIP, endIP);
    const filteredResults = macOnly
      ? results.filter(device => device.MAC && device.MAC !== 'Unknown')
      : results;

    res.json(filteredResults);
  } catch (err) {
    res.status(500).json({ error: 'Error scanning IP range' });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
