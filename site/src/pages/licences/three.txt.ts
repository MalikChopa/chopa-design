// Licence de three.js (MIT), servie à /licences/three.txt : la mention disparaît du fichier réduit par Vite
// (docs/ARCHITECTURE.md §16.5 M11), le texte est donc lu dans node_modules à la construction. Lien dans le pied du mur.
// La construction part de la racine du dépôt (npm run build) ; le dossier du site est essayé aussi.
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

export function GET() {
  const candidats = ['node_modules/three/LICENSE', '../node_modules/three/LICENSE'].map((p) => resolve(process.cwd(), p));
  const fichier = candidats.find((p) => existsSync(p));
  if (!fichier) throw new Error(`licence de three introuvable (cherchée : ${candidats.join(', ')})`);
  const texte = 'three.js 0.187.0, licence MIT (copie de node_modules/three/LICENSE)\n\n' + readFileSync(fichier, 'utf8');
  return new Response(texte, { headers: { 'content-type': 'text/plain; charset=utf-8' } });
}
