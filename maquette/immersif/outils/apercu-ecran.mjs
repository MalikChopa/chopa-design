// Captures d'écran de contrôle de la maquette immersive (pour la relecture à l'œil, pas un test).
// Usage : node maquette/immersif/outils/apercu-ecran.mjs <dossier-de-sortie> [chemin] [thème] [largeur] [hauteur]
// Écrit seulement dans le dossier de sortie donné (à choisir hors du projet, par exemple un dossier temporaire).
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdirSync } from 'node:fs';
import { startServer, launch, openPage } from '../../../scripts/lib/browser.mjs';

const ICI = dirname(fileURLToPath(import.meta.url));
const [sortie, chemin = '/index.html', theme = 'sombre', w = '1440', h = '900', attente = '1500', defile = '0', mx = '0.6', my = '0.45'] = process.argv.slice(2);
if (!sortie) { console.error('dossier de sortie manquant'); process.exit(2); }
mkdirSync(sortie, { recursive: true });
const server = await startServer(join(ICI, '..'));
const { browser } = await launch('chromium');
try {
  const { page, problems, close } = await openPage(browser, server.url + chemin, { width: +w, height: +h, theme });
  await page.waitForFunction(() => window.__imMur?.mode === 'mur' || !document.documentElement.classList.contains('im-mur'), null, { timeout: 8000 }).catch(() => {});
  await page.waitForTimeout(300);
  if (+defile) await page.evaluate((y) => scrollTo(0, y), +defile);
  await page.mouse.move(+w * +mx, +h * +my);
  await page.waitForTimeout(+attente);
  const nom = `${chemin.replace(/[^a-z0-9]+/gi, '_')}-${theme}-${w}-${defile}.png`;
  await page.screenshot({ path: join(sortie, nom) });
  const info = await page.evaluate(() => ({ mode: window.__imMur?.mode, images: window.__imMur?.images, erreur: window.__imMur?.erreur, classes: document.documentElement.className }));
  console.log(nom, JSON.stringify(info), problems.length ? problems : 'aucun problème');
  await close();
} finally {
  await browser.close();
  await server.close();
}
