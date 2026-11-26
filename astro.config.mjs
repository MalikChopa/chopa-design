import { defineConfig } from 'astro/config';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { OUT, HAS_CH_OUT, SITE_PUBLIC, SITE_DIST } from './scripts/lib/paths.mjs';

// Chemins absolus : mesuré à J0, un outDir relatif ('./site/dist' ou './dist') est résolu depuis le dossier
// courant, pas depuis root (voir docs/JOURNAL.md, J0). On ancre donc tout sur ce fichier.
// J1a-1 : la racine de sortie est lue dans CH_OUT (scripts/lib/paths.mjs ; défaut : le dépôt). Avec CH_OUT,
// publicDir et outDir sont sous CH_OUT/site/ et le cache d'Astro aussi, pour que deux builds parallèles ne se partagent rien.
const here = (p) => fileURLToPath(new URL(p, import.meta.url));

export default defineConfig({
  root: here('./site/'),
  srcDir: here('./site/src/'),
  publicDir: SITE_PUBLIC,
  outDir: SITE_DIST,
  ...(HAS_CH_OUT ? { cacheDir: join(OUT, '.astro-cache') } : {}),
});
