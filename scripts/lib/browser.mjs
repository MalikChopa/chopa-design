// Banc navigateur (J2a-1) : lanceur Chromium/WebKit depuis le cache Playwright, petit serveur statique,
// ouverture de page (fenêtre, thème), collecte des erreurs console et des requêtes en échec.
// Aucun téléchargement : le cache ~/Library/Caches/ms-playwright/ est lu tel quel ; repli : Google Chrome installé.
import { createServer } from 'node:http';
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, extname, resolve, sep } from 'node:path';
import { homedir } from 'node:os';
import { chromium, webkit } from 'playwright-core';
import { SITE_DIST } from './paths.mjs';

export const THEMES = ['sombre', 'clair', 'chaud'];
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const MIME = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2', '.woff': 'font/woff', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp',
  '.ico': 'image/x-icon', '.txt': 'text/plain; charset=utf-8', '.xml': 'application/xml',
};

/** Toutes les pages construites : chaque index.html sous site/dist, triées. Retourne [{ route, file }]. */
export function listPages(dist = SITE_DIST) {
  if (!existsSync(dist)) throw new Error(`site/dist introuvable (${dist}) : lancer « npm run build » (CH_OUT compris)`);
  const out = [];
  const walk = (dir) => {
    for (const n of readdirSync(dir).sort()) {
      const p = join(dir, n);
      if (statSync(p).isDirectory()) walk(p);
      else if (n === 'index.html') out.push(p);
    }
  };
  walk(dist);
  const pages = out.map((file) => {
    const rel = file.slice(dist.length).split(sep).join('/').replace(/index\.html$/, '');
    return { route: rel || '/', file };
  });
  if (!pages.length) throw new Error(`aucune page index.html sous ${dist}`);
  return pages;
}

/**
 * Serveur statique sur un port libre choisi par le système (port 0), lié à 127.0.0.1.
 * Options (J2a-2, facultatives ; sans elles le comportement de J2a-1 est inchangé) :
 *   mounts  : { '/préfixe/': dossier } sert un autre dossier sous un préfixe (ex. '/maquette/', '/tests/', '/chopa/') ;
 *   virtual : { '/chemin': 'texte' | { body, type } } pages ou feuilles en mémoire, prioritaires (aucun fichier écrit).
 * Retourne aussi `virtual` (objet vivant : on peut le modifier après le démarrage).
 */
export async function startServer(dist = SITE_DIST, { mounts = {}, virtual = {} } = {}) {
  const root = resolve(dist);
  const server = createServer((req, res) => {
    try {
      let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
      const v = virtual[p];
      if (v !== undefined) {
        const body = typeof v === 'string' ? v : v.body;
        const type = typeof v === 'string' ? MIME[extname(p)] || 'text/html; charset=utf-8' : v.type;
        res.writeHead(200, { 'content-type': type, 'cache-control': 'no-store' }).end(body);
        return;
      }
      let base = root;
      for (const [prefix, dir] of Object.entries(mounts)) {
        if (p.startsWith(prefix)) { base = resolve(dir); p = '/' + p.slice(prefix.length); break; }
      }
      let f = resolve(join(base, p));
      if (f !== base && !f.startsWith(base + sep)) { res.writeHead(403).end('interdit'); return; }
      if (existsSync(f) && statSync(f).isDirectory()) f = join(f, 'index.html');
      if (!existsSync(f) && existsSync(f + '.html')) f += '.html';
      if (!existsSync(f)) { res.writeHead(404, { 'content-type': 'text/plain' }).end('introuvable'); return; }
      res.writeHead(200, { 'content-type': MIME[extname(f)] || 'application/octet-stream', 'cache-control': 'no-store' });
      res.end(readFileSync(f));
    } catch (e) { res.writeHead(500).end(String(e)); }
  });
  await new Promise((ok, ko) => { server.once('error', ko); server.listen(0, '127.0.0.1', ok); });
  const { port } = server.address();
  return { port, url: `http://127.0.0.1:${port}`, virtual, close: () => new Promise((ok) => { server.closeAllConnections?.(); server.close(() => ok()); }) };
}

/** Lance un moteur ('chromium' | 'webkit'). Retourne { browser, engine, note } ; note non vide si repli. */
export async function launch(engine = 'chromium') {
  if (engine === 'webkit') return { browser: await webkit.launch(), engine, note: '' };
  try {
    return { browser: await chromium.launch(), engine, note: '' };
  } catch (e) {
    if (!existsSync(CHROME)) throw e;
    const note = `repli Google Chrome (Chromium du cache indisponible : ${String(e.message).split('\n')[0]})`;
    return { browser: await chromium.launch({ executablePath: CHROME }), engine, note };
  }
}

/**
 * Ouvre une page : fenêtre { width, height }, thème ('sombre'|'clair'|'chaud').
 * Le thème est posé dans localStorage « ch-theme » avant le chargement, puis vérifié sur <html data-ch-theme>.
 * Retourne { page, problems, close } ; problems = erreurs console, erreurs de page, requêtes en échec, réponses ≥ 400.
 */
export async function openPage(browser, url, { width = 1280, height = 900, theme = 'sombre' } = {}) {
  const context = await browser.newContext({ viewport: { width, height } });
  const problems = [];
  await context.addInitScript((t) => { try { localStorage.setItem('ch-theme', t); } catch (_) {} }, theme);
  const page = await context.newPage();
  page.on('console', (m) => { if (m.type() === 'error') problems.push(`console : ${m.text()}`); });
  page.on('pageerror', (e) => problems.push(`erreur de page : ${e.message}`));
  page.on('requestfailed', (r) => problems.push(`requête en échec : ${r.url()} (${r.failure()?.errorText})`));
  page.on('response', (r) => { if (r.status() >= 400) problems.push(`réponse ${r.status()} : ${r.url()}`); });
  await page.goto(url, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  const got = await page.evaluate(() => document.documentElement.getAttribute('data-ch-theme'));
  if (got !== theme) problems.push(`thème : attendu « ${theme} », trouvé « ${got} »`);
  return { page, problems, close: () => context.close().catch(() => {}) };
}

/** Exécute fn({ server, launch }) puis ferme tout, même en cas d'erreur. */
export async function withBench(fn, serverOptions = {}, dist = SITE_DIST) {
  const server = await startServer(dist, serverOptions);
  const opened = [];
  try {
    return await fn({
      server,
      launch: async (engine) => { const l = await launch(engine); opened.push(l.browser); return l; },
    });
  } finally {
    for (const b of opened) await b.close().catch(() => {});
    await server.close();
  }
}
