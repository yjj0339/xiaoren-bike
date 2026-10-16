const http = require('http'), fs = require('fs'), path = require('path'), os = require('os');
const root = path.join(__dirname, '..');
const port = process.env.PORT || 8123;
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml',
  '.json': 'application/json', '.ico': 'image/x-icon'
};
http.createServer((req, res) => {
  let p = decodeURIComponent((req.url || '/').split('?')[0]);
  if (p === '/') p = '/index.html';
  const f = path.normalize(path.join(root, p));
  if (!f.startsWith(path.normalize(root))) { res.writeHead(403); return res.end('403'); }
  fs.readFile(f, (e, d) => {
    if (e) { res.writeHead(404); return res.end('404'); }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(f).toLowerCase()] || 'application/octet-stream' });
    res.end(d);
  });
}).listen(port, () => {
  console.log(`本地:   http://127.0.0.1:${port}/`);
  const ifs = os.networkInterfaces();
  for (const name of Object.keys(ifs)) for (const it of ifs[name]) {
    if (it.family === 'IPv4' && !it.internal) console.log(`局域网: http://${it.address}:${port}/`);
  }
});
