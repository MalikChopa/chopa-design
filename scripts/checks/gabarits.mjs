// Gabarits (Diapason, 2026-11-16) : chaque site/src/templates/<genre>/<page>.html est une vraie page faite SEULEMENT avec
// la bibliothèque. Contrôles : document complet (doctype, <html lang="fr" data-ch-theme>, <title>, description), chopa.css
// lié par /chopa/chopa.css, un seul <h1>, un seul <main>, aucune classe hors ch- et is- (états de la bibliothèque), aucun attribut style, aucun <style>,
// aucun script en ligne (seuls chopa-theme.js, chopa.js et chopa-effects.js, par src) ; la page construite existe.
// Un besoin que la bibliothèque ne couvre pas se signale (JOURNAL) au lieu d'être réglé dans le gabarit.
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';

export default function gabarits(ctx) {
  const res = [];
  const racine = join(ctx.ROOT, 'site', 'src', 'templates');
  if (!existsSync(racine)) return [{ nom: 'gabarits : aucun dossier site/src/templates (rien à contrôler)', ok: true }];
  const fichiers = readdirSync(racine, { withFileTypes: true }).filter((d) => d.isDirectory())
    .flatMap((d) => readdirSync(join(racine, d.name)).filter((f) => f.endsWith('.html')).map((f) => join(racine, d.name, f)));
  for (const f of fichiers) {
    const nom = relative(ctx.ROOT, f);
    const h = readFileSync(f, 'utf8');
    const [, genre, page] = f.match(/templates\/([\w-]+)\/([\w-]+)\.html$/) ?? [];
    const c = (titre, ok, detail = '') => res.push({ nom: `gabarits : ${nom} : ${titre}`, ok, detail });
    c('doctype', /^\s*<!doctype html>/i.test(h));
    c('<html lang="fr" data-ch-theme>', /<html\b[^>]*\blang="fr"[^>]*\bdata-ch-theme="(sombre|clair|chaud)"|<html\b[^>]*\bdata-ch-theme="(sombre|clair|chaud)"[^>]*\blang="fr"/i.test(h));
    c('<title> et description', /<title>[^<]+<\/title>/i.test(h) && /<meta\s+name="description"\s+content="[^"]+"/i.test(h));
    c('chopa.css lié', /<link\s+rel="stylesheet"\s+href="\/chopa\/chopa\.css"/i.test(h));
    const h1 = (h.match(/<h1\b/gi) || []).length;
    c('un seul <h1>', h1 === 1, `${h1} trouvé(s)`);
    const main = (h.match(/<main\b/gi) || []).length;
    c('un seul <main>', main === 1, `${main} trouvé(s)`);
    c('aucun attribut style', !/<[a-z][^>]*\sstyle\s*=/i.test(h));
    c('aucun <style>', !/<style\b/i.test(h));
    const scripts = [...h.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)];
    const mauvais = scripts.filter(([, attrs, corps]) => corps.trim() || !/\ssrc="\/chopa\/chopa(-theme|-effects)?\.js"/.test(attrs));
    c('scripts : chopa-theme.js, chopa.js, chopa-effects.js seulement', mauvais.length === 0, mauvais.map((m) => m[0].slice(0, 60)).join(' | '));
    const hors = [...h.matchAll(/\sclass="([^"]*)"/g)].flatMap((m) => m[1].split(/\s+/).filter(Boolean)).filter((k) => !k.startsWith('ch-') && !k.startsWith('is-'));
    c('classes ch- et is- seulement', hors.length === 0, [...new Set(hors)].join(', '));
    c('page construite', existsSync(join(ctx.dist.site, 'gabarits', genre, page, 'index.html')));
  }
  res.push({ nom: `gabarits : ${fichiers.length} gabarit(s) lu(s)`, ok: true });
  return res;
}
