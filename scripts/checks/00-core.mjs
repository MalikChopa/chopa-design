// Les 22 contrôles de structure du J0, déplacés ici depuis check-dist.mjs (J1b-1), mêmes contrôles, même logique.
// Seule adaptation : les 3 sélecteurs de thème cherchent `data-ch-theme` (migration D3, faite à J1a-1).
// Lit dist-lib/ et site/dist/ (sous CH_OUT s'il est défini) et site/src/ ; rend [{ nom, ok, detail }].
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { walkBlocks } from '../lib/css.mjs';

export default function core(ctx) {
  const { ROOT, OUT, css, dist } = ctx;
  const res = [];
  const check = (nom, ok, detail = '') => res.push({ nom, ok: Boolean(ok), detail });
  // Chemins relatifs à la racine de sortie pour dist-lib/ et site/dist|public, sinon au dépôt (comme avant).
  const base = (p) => (/^(dist-lib|site\/dist|site\/public)(\/|$)/.test(p) ? OUT : ROOT);
  const read = (p) => {
    const f = join(base(p), p);
    if (existsSync(f)) return readFileSync(f, 'utf8');
    check(`fichier absent : ${p}`, false);
    return '';
  };

  // --- dist-lib/chopa.css ---
  check('sélecteur sombre', css.includes(':root, [data-ch-theme="sombre"]'));
  check('sélecteur clair', css.includes('[data-ch-theme="clair"]'));
  check('sélecteur chaud', css.includes('[data-ch-theme="chaud"]'));
  check('aucun :root[', !css.includes(':root['));
  const faces = css.match(/@font-face/g) || [];
  check('6 @font-face', faces.length === 6, `trouvé ${faces.length}`);
  const urls = [...css.matchAll(/url\("\.\/fonts\/([^"]+\.woff2)"\)/g)].map((m) => m[1]);
  check('6 url woff2', urls.length === 6, `trouvé ${urls.length}`);
  for (const u of urls) check(`police présente : ${u}`, existsSync(join(dist.lib, 'fonts', u)));
  for (const l of ['LICENSE-inter-tight.txt', 'LICENSE-ibm-plex-mono.txt']) check(`licence présente : ${l}`, existsSync(join(dist.lib, 'fonts', l)));
  // Adaptation (Diapason, J2c, 2026-11-15) : la seule exception approuvée par l'utilisateur (CLAUDE.md, radio rond)
  // est acceptée ici comme dans check-radius : `50%` seulement si TOUS les sélecteurs du bloc sont `.ch-radio…`.
  // Tout autre arrondi reste refusé ; le nombre de déclarations lues doit égaler celui de l'ancienne lecture par regex.
  const RADIO = /^\.ch-radio(?![\w-])/;
  let lus = 0;
  walkBlocks(css, (selector, decls) => {
    for (const { prop, value: v } of decls) {
      if (prop !== 'border-radius') continue;
      lus++;
      const radio = selector.split(',').every((x) => RADIO.test(x.trim()));
      check('border-radius', v === '0' || v === 'var(--ch-radius)' || (radio && v === '50%'), `${selector} { border-radius: ${v} }`);
    }
  });
  const parRegex = [...css.matchAll(/border-radius\s*:\s*([^;}]+)/g)].length;
  check('border-radius : toutes les déclarations lues', lus === parRegex, `${lus} lues par blocs, ${parRegex} par regex`);
  check('chopa-theme.js copié', existsSync(join(dist.lib, 'chopa-theme.js')));

  // --- site/dist/index.html ---
  const html = read('site/dist/index.html');
  check('lien chopa.css', /<link[^>]+href="[^"]*chopa\.css"/.test(html));
  const head = (html.match(/<head>([\s\S]*?)<\/head>/) || [, ''])[1];
  const scripts = [...head.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)];
  const themeScript = scripts.find((s) => s[2].includes('ch-theme'));
  check('script de thème dans <head> avec la clé ch-theme', !!themeScript);
  check('script de thème sans defer ni async', !!themeScript && !/\b(defer|async)\b/.test(themeScript[1]));
  // Exemple : l'HTML source apparaît dans l'aperçu (tel quel) et dans le bloc code (échappé, balisage de coloration retiré).
  const decode = (s) => s.replace(/&#x3C;/g, '<').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#x26;/g, '&').replace(/&amp;/g, '&');
  const src = read('site/src/examples/button/primary.html').trim();
  const previews = [...html.matchAll(/<div class="doc-example__preview"[^>]*>([\s\S]*?)<\/div>/g)].map((m) => m[1]);
  check('exemple dans l\'aperçu', previews.some((p) => p.trim() === src));
  const codes = [...html.matchAll(/<div class="doc-example__code">([\s\S]*?)<\/code><\/pre>/g)].map((m) => decode(m[1].replace(/<[^>]+>/g, '')));
  check('exemple dans le bloc code', codes.some((c) => c.trim() === src));

  // --- copie dans le site ---
  check('site/public/chopa/chopa.css identique à dist-lib/chopa.css', css !== '' && read('site/public/chopa/chopa.css') === css);
  return res;
}
