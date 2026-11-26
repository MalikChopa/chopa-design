// Tuiles du mur et de la grille (I1, docs/ARCHITECTURE.md §16.4, décisions M7 et M8).
// Sources : site/src/tuiles/<slug>.html (une miniature par fiche et par entrée de site/src/immersif/familles-mur.mjs).
// Règles d'un fichier : classes ch-, is-, im- seulement ; aucun id, name, for, form, list, headers, commande de fenêtre,
// attribut de référence ARIA, style, <style>, <script>, <dialog>, popover ; href seulement « # » (et <use> vers le sprite
// d'icônes, dont le glyphe doit exister) ; aucun tracé SVG ; bouton icône nommé ; aucun mot de tests/denylist.txt.
// Rapport : une tuile par fiche et par entrée de familles-mur.mjs, aucune tuile orpheline ; pages construites (site/dist).
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';
import { pathToFileURL } from 'node:url';
import { motif, lireListe } from './denylist.mjs';

const sansAccents = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '');
const attr = (tag, nom) => {
  const m = tag.match(new RegExp(`\\s${nom}\\s*=\\s*(?:"([^"]*)"|'([^']*)')`, 'i'));
  return m ? (m[1] ?? m[2]).trim() : null;
};
const INTERDITS = ['id', 'name', 'for', 'form', 'list', 'headers', 'style', 'popover', 'popovertarget', 'popovertargetaction', 'commandfor', 'command',
  'aria-labelledby', 'aria-describedby', 'aria-controls', 'aria-owns', 'aria-details', 'aria-errormessage', 'aria-activedescendant', 'aria-flowto'];
const DESSIN = /<(path|circle|rect|line|polyline|polygon|ellipse)\b/i;

export default async function tuiles(ctx) {
  const res = [];
  const dossier = join(ctx.ROOT, 'site', 'src', 'tuiles');
  const fichiers = existsSync(dossier) ? readdirSync(dossier).filter((f) => f.endsWith('.html')).sort() : [];
  const slugs = fichiers.map((f) => f.replace(/\.html$/, ''));
  const c = (nom, ok, detail = '') => res.push({ nom: `tuiles : ${nom}`, ok, detail });

  // ---- Attendu : les fiches (63 aujourd'hui) + les entrées de familles-mur.mjs ----
  const fiches = ctx.fiches.map((f) => f.replace(/^.*\/([^/]+)\.mjs$/, '$1'));
  const { FAMILLES_MUR } = await import(pathToFileURL(join(ctx.ROOT, 'site', 'src', 'immersif', 'familles-mur.mjs')).href);
  const propres = FAMILLES_MUR.flatMap((g) => g.pieces);
  const attendus = [...fiches, ...propres.map((p) => p.slug)];
  c(`${fiches.length} fiche(s) et ${propres.length} entrée(s) de familles-mur.mjs, ${FAMILLES_MUR.length} familles propres`, fiches.length > 0 && propres.length === 9 && FAMILLES_MUR.length === 2, `fiches ${fiches.length}, entrées ${propres.length}, familles ${FAMILLES_MUR.length}`);
  const doublons = attendus.filter((s, i) => attendus.indexOf(s) !== i);
  c('aucun slug en double entre fiches et familles-mur.mjs', doublons.length === 0, doublons.join(', '));
  const manquantes = attendus.filter((s) => !slugs.includes(s));
  const orphelines = slugs.filter((s) => !attendus.includes(s));
  c(`${attendus.length} tuiles attendues, ${slugs.length} fichier(s) dans site/src/tuiles/`, slugs.length === attendus.length);
  c('aucune tuile manquante', manquantes.length === 0, `manquante(s) : ${manquantes.map((s) => `site/src/tuiles/${s}.html`).join(', ')}`);
  c('aucune tuile orpheline', orphelines.length === 0, `orpheline(s) : ${orphelines.map((s) => `site/src/tuiles/${s}.html`).join(', ')}`);
  const nomsFichiers = fichiers.filter((f) => !/^[a-z0-9]+(-[a-z0-9]+)*\.html$/.test(f));
  c('noms de fichier en minuscules, chiffres et traits d\'union', nomsFichiers.length === 0, nomsFichiers.join(', '));

  // ---- Gabarits : un genre = une tuile ; chaque href de familles-mur.mjs vise une page construite ----
  const genres = existsSync(join(ctx.ROOT, 'site', 'src', 'templates'))
    ? readdirSync(join(ctx.ROOT, 'site', 'src', 'templates'), { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name) : [];
  const sansTuile = genres.filter((g) => !propres.some((p) => p.href.startsWith(`/gabarits/${g}/`)));
  c(`${genres.length} genre(s) de gabarits, chacun a sa tuile`, genres.length > 0 && sansTuile.length === 0, `sans tuile : ${sansTuile.join(', ')}`);
  const pagesBatit = existsSync(ctx.dist.site);
  c('site/dist présent (pages construites lues)', pagesBatit, 'lancer npm run build (CH_OUT compris)');
  if (pagesBatit) {
    const mauvais = propres.filter((p) => !existsSync(join(ctx.dist.site, p.href, 'index.html')));
    c('chaque href de familles-mur.mjs vise une page construite', mauvais.length === 0, mauvais.map((p) => `${p.slug} → ${p.href}`).join(' ; '));
  }

  // ---- Règles de chaque fichier ----
  const liste = join(ctx.ROOT, 'tests', 'denylist.txt');
  const motifs = existsSync(liste) ? lireListe(liste).map((e) => [e, motif(e)]) : [];
  c('liste tests/denylist.txt lue', motifs.length > 0);
  const sprite = join(ctx.dist.site, 'chopa', 'chopa-icons.svg');
  const symboles = existsSync(sprite) ? new Set([...readFileSync(sprite, 'utf8').matchAll(/<symbol\b[^>]*\bid="([^"]+)"/g)].map((m) => m[1])) : null;
  c('sprite d\'icônes lu (site/dist/chopa/chopa-icons.svg)', symboles !== null && symboles.size > 0, 'sprite absent : lancer npm run build');

  for (const f of fichiers) {
    const html = readFileSync(join(dossier, f), 'utf8');
    const nom = relative(ctx.ROOT, join(dossier, f));
    const p = (titre, ok, detail = '') => res.push({ nom: `tuiles : ${nom} : ${titre}`, ok, detail });
    const balises = [...html.matchAll(/<[a-zA-Z][^>]*>/g)].map((m) => m[0]);
    p('non vide', html.trim().length > 0 && balises.length > 0);
    const hors = [...new Set(balises.flatMap((b) => (attr(b, 'class') ?? '').split(/\s+/).filter(Boolean)).filter((k) => !/^(ch|is|im)-/.test(k)))];
    p('classes ch-, is-, im- seulement', hors.length === 0, hors.join(', '));
    const interdits = [...new Set(balises.flatMap((b) => INTERDITS.filter((a) => attr(b, a) !== null || new RegExp(`\\s${a}(\\s|=|/?>)`, 'i').test(b))))];
    p('ni id, name, for, form, style, référence ARIA, popover ni commande', interdits.length === 0, interdits.join(', '));
    p('ni <style>, <script> ni <dialog>', !/<(style|script|dialog)\b/i.test(html));
    p('aucun gestionnaire en ligne (on…=)', !balises.some((b) => /\son[a-z]+\s*=/i.test(b)));
    const href = balises.flatMap((b) => {
      const v = attr(b, 'href');
      if (v === null) return [];
      return /^<use\b/i.test(b) ? [['use', v]] : [['a', v]];
    });
    const mauvaisA = href.filter(([t, v]) => t === 'a' && !v.startsWith('#')).map(([, v]) => v);
    p('href seulement « # »', mauvaisA.length === 0, mauvaisA.join(', '));
    const usages = href.filter(([t]) => t === 'use').map(([, v]) => v);
    const mauvaisU = usages.filter((v) => !/^\/chopa\/chopa-icons\.svg#ch-i-[a-z0-9-]+$/.test(v) || (symboles && !symboles.has(v.slice(v.indexOf('#') + 1))));
    p('<use> vers un glyphe existant du sprite', mauvaisU.length === 0, mauvaisU.join(', '));
    p('aucun tracé SVG', !DESSIN.test(html));
    const sansNom = balises.filter((b) => /^<(button|a|input|summary)\b/i.test(b) && /(?:^|\s)ch-btn--icon(?:\s|")/.test(attr(b, 'class') ?? '') && !attr(b, 'aria-label'));
    p('bouton icône avec aria-label', sansNom.length === 0, sansNom.join(' | '));
    const lectures = [html, html.replace(/<[^>]*>/g, ''), html.replace(/<[^>]*>/g, ' ')].map((v) => sansAccents(v).toLowerCase().replace(/&nbsp;|&#160;/g, ' '));
    const mots = motifs.filter(([, re]) => lectures.some((v) => re.test(v))).map(([e]) => e);
    p('aucun mot de tests/denylist.txt', mots.length === 0, mots.join(', '));
    const z = html.match(/^\s*<div class="(im-z\d+)"/);
    p('réduction im-z50 à im-z80 seulement, portée par la racine', !/im-z\d+/.test(html) || (z !== null && ['im-z50', 'im-z60', 'im-z70', 'im-z80'].includes(z[1])), z ? z[1] : 'im-z hors de la racine');
  }

  // ---- Page construite /composants/ ----
  if (pagesBatit && existsSync(join(ctx.dist.site, 'composants', 'index.html'))) {
    const page = readFileSync(join(ctx.dist.site, 'composants', 'index.html'), 'utf8');
    const lis = [...page.matchAll(/<li class="im-tuile"[^>]*\bdata-slug="([^"]+)"/g)].map((m) => m[1]);
    c(`/composants/ : ${fiches.length} tuiles de fiche, sans doublon`, lis.length === fiches.length && new Set(lis).size === lis.length && fiches.every((s) => lis.includes(s)), `${lis.length} tuile(s)`);
    const apercus = [...page.matchAll(/<div class="im-tuile__apercu"([^>]*)>/g)].map((m) => m[1]);
    c('/composants/ : chaque aperçu est inert et aria-hidden', apercus.length === lis.length && apercus.every((a) => /\binert\b/.test(a) && /aria-hidden="true"/.test(a)), `${apercus.length} aperçu(s)`);
    const liens = [...page.matchAll(/<a class="im-tuile__lien" href="([^"]+)"/g)].map((m) => m[1]);
    c('/composants/ : un lien /composants/<slug>/ distinct par tuile', liens.length === lis.length && new Set(liens).size === liens.length && fiches.every((s) => liens.includes(`/composants/${s}/`)), `${liens.length} lien(s)`);
  }
  return res;
}
