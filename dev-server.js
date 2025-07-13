const http = require('http');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

// 1. Получаем порт из аргумента, env, .env или по умолчанию
function getPort() {
  // Аргумент командной строки
  const argPort = process.argv[2] && !isNaN(Number(process.argv[2])) ? Number(process.argv[2]) : undefined;
  // Переменная окружения
  const envPort = process.env.DEV_PORT && !isNaN(Number(process.env.DEV_PORT)) ? Number(process.env.DEV_PORT) : undefined;
  // .env файл
  let dotEnvPort;
  try {
    const envPath = path.join(__dirname, '.env');
    if (fs.existsSync(envPath)) {
      const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('DEV_PORT=')) {
          const val = trimmed.split('=')[1];
          if (!isNaN(Number(val))) dotEnvPort = Number(val);
        }
      }
    }
  } catch {}
  return argPort || envPort || dotEnvPort || 3000;
}

const PORT = getPort();
const DIST_DIR = path.join(__dirname, 'dist');

const mimeTypes = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.eot': 'application/vnd.ms-fontobject',
  '.otf': 'font/otf',
};

const server = http.createServer((req, res) => {
  let filePath = req.url.split('?')[0];
  if (filePath === '/' || filePath === '') filePath = '/index.html';
  const absPath = path.join(DIST_DIR, filePath);

  fs.readFile(absPath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found');
      return;
    }
    const ext = path.extname(absPath);
    const mimeType = mimeTypes[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': mimeType });
    res.end(data);
  });
});

server.listen(PORT, () => {
  const url = `http://localhost:${PORT}`;
  console.log(`\x1b[32mDev server running at ${url}\x1b[0m`);
  // Открываем браузер (macOS, Windows, Linux)
  const startCmd =
    process.platform === 'darwin' ? `open ${url}` :
    process.platform === 'win32' ? `start ${url}` :
    `xdg-open ${url}`;
  exec(startCmd);
}); 