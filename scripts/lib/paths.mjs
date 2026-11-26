// Chemins du dépôt et racine de sortie. CH_OUT (variable d'environnement) redirige dist-lib/, site/public/chopa/
// et site/dist/ : sert aux builds parallèles (docs/ARCHITECTURE.md, sections 2 et 11). Défaut : la racine du dépôt.
// Une valeur relative est résolue depuis le dossier courant. Aucune dépendance.
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
export const OUT = process.env.CH_OUT ? resolve(process.env.CH_OUT) : ROOT;
export const HAS_CH_OUT = Boolean(process.env.CH_OUT);
export const SRC = join(ROOT, 'src');
export const DIST = join(OUT, 'dist-lib');
export const SITE_PUBLIC = join(OUT, 'site', 'public');
export const PUBLIC_CHOPA = join(SITE_PUBLIC, 'chopa');
export const SITE_DIST = join(OUT, 'site', 'dist');
export const FONTS_FROM = join(ROOT, 'maquette', 'assets', 'fonts');
