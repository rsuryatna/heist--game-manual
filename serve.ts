// A tiny static server for game/ (Node 22, standard library only), so the game can
// be played locally without a build step: `node serve.ts`, then open
// http://localhost:8080. Development convenience only — the game itself is plain
// static files under game/.
import { createReadStream, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('./game', import.meta.url)));
const args = process.argv.slice(2);
const portIndex = args.indexOf('--port');
const requested = portIndex === -1 ? 8080 : Number(args[portIndex + 1]);
const port = Number.isInteger(requested) && requested > 0 && requested < 65536 ? requested : 8080;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
};

createServer((request, response) => {
  const url = decodeURIComponent((request.url || '/').split('?')[0]);
  const path = normalize(join(root, url === '/' ? 'index.html' : url));
  if (!path.startsWith(root + sep) && path !== root) {
    response.writeHead(403);
    response.end();
    return;
  }
  let stat;
  try {
    stat = statSync(path);
  } catch {
    response.writeHead(404);
    response.end('not found');
    return;
  }
  if (!stat.isFile()) {
    response.writeHead(404);
    response.end('not found');
    return;
  }
  response.writeHead(200, { 'content-type': MIME[extname(path)] || 'application/octet-stream' });
  createReadStream(path).pipe(response);
}).listen(port, () => {
  console.log(`VELVET VAULT on http://localhost:${port}`);
});
