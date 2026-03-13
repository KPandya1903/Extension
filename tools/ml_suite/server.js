const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8000;

const server = http.createServer((req, res) => {
  // Add CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method === 'GET') {
    let filePath = path.join(__dirname, req.url === '/' ? 'trainer.html' : req.url);
    if (!fs.existsSync(filePath)) {
      res.writeHead(404);
      res.end('Not Found');
      return;
    }
    const content = fs.readFileSync(filePath);
    res.writeHead(200);
    res.end(content);
  } else if (req.method === 'POST' && req.url === '/save-model') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      const { name, data } = JSON.parse(body);
      const dest = path.join(__dirname, '../../models', name);
      
      if (name.endsWith('.bin')) {
        const buffer = Buffer.from(data, 'base64');
        fs.writeFileSync(dest, buffer);
      } else {
        fs.writeFileSync(dest, typeof data === 'string' ? data : JSON.stringify(data, null, 2));
      }
      
      console.log(`Saved model piece: ${name}`);
      res.writeHead(200);
      res.end('Saved');
    });
  }
});

server.listen(PORT, () => {
  console.log(`ML Training Server running at http://localhost:${PORT}`);
});
