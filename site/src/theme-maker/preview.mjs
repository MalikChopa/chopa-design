// Aperçu de « créer ton thème », pièces ajoutées à J2b : s'ajoutent à chaque cadre .doc-tm-frame (le bouton y est déjà,
// posé par theme.astro). Six composants au total : bouton, bouton icône, groupe de boutons, champ texte (avec un
// champ en erreur), liste déroulante, recherche. Tout est créé par le DOM (createElement, textContent : jamais de
// innerHTML), sans `id` (trois cadres sur la page) ni style en ligne ; les classes sont celles de chopa.css.
const SVG_NS = 'http://www.w3.org/2000/svg';
const SPRITE = '/chopa/chopa-icons.svg';

export const APERCU_PIECES = ['Bouton', 'Bouton icône', 'Groupe de boutons', 'Champ texte', 'Liste déroulante', 'Recherche'];

const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text !== undefined) e.textContent = text; return e; };
function icon(name) {
  const s = document.createElementNS(SVG_NS, 'svg');
  s.setAttribute('class', 'ch-icon'); s.setAttribute('aria-hidden', 'true'); s.setAttribute('focusable', 'false');
  const u = document.createElementNS(SVG_NS, 'use');
  u.setAttribute('href', `${SPRITE}#ch-i-${name}`);
  s.appendChild(u);
  return s;
}
function iconButton(variant, glyph, label) {
  const b = el('button', `ch-btn ch-btn--icon ch-btn--${variant}`); b.type = 'button'; b.setAttribute('aria-label', label);
  b.appendChild(icon(glyph));
  return b;
}
function field(labelText, control, help, error) {
  const l = el('label', `ch-field${error ? ' is-error' : ''}`);
  l.append(el('span', 'ch-label', labelText), control);
  if (help) l.append(el('span', 'ch-field__help', help));
  return l;
}

/** Retourne le bloc des pièces ajoutées pour un cadre (un nouveau jeu d'éléments par cadre). */
export function buildPieces(themeName) {
  const root = el('div', 'doc-tm-frame__pieces');

  const row1 = el('div', 'doc-tm-frame__row');
  row1.append(iconButton('primary', 'plus', `Ajouter (thème ${themeName})`), iconButton('secondary', 'copy', `Copier (thème ${themeName})`), iconButton('ghost', 'close', `Fermer (thème ${themeName})`));
  const group = el('div', 'ch-btn-group ch-btn-group--attached'); group.setAttribute('role', 'group'); group.setAttribute('aria-label', `Affichage (thème ${themeName})`);
  for (const [t, on] of [['Grille', true], ['Liste', false]]) { const b = el('button', 'ch-btn', t); b.type = 'button'; b.setAttribute('aria-pressed', String(on)); group.append(b); }
  row1.append(group);

  const input = el('input', 'ch-input'); input.type = 'text'; input.placeholder = 'nom@exemple.fr';
  const bad = el('input', 'ch-input'); bad.type = 'text'; bad.value = 'exemple'; bad.setAttribute('aria-invalid', 'true');
  const select = el('select', 'ch-select');
  for (const t of ['Découverte', 'Normal', 'Expert']) select.append(el('option', undefined, t));
  const grid = el('div', 'doc-tm-frame__fields');
  grid.append(field('Champ texte', input, 'Aide sous le champ.'), field('Champ en erreur', bad, 'Ce n\'est pas une adresse valide.', true), field('Liste déroulante', select));

  const search = el('form', 'ch-search'); search.setAttribute('role', 'search'); search.setAttribute('aria-label', `Recherche d'essai (thème ${themeName})`); search.addEventListener('submit', (e) => e.preventDefault());
  const q = el('input', 'ch-input'); q.type = 'search'; q.setAttribute('aria-label', `Mots à chercher (thème ${themeName})`); q.placeholder = 'Rechercher';
  const go = el('button', 'ch-btn ch-btn--primary'); go.type = 'submit'; go.append('Chercher');
  search.append(q, go);

  root.append(row1, grid, search);
  return root;
}

/** Ajoute les pièces dans chaque cadre, avant la teinte d'accent, et corrige la phrase d'introduction (la liste de pièces vient d'ici). */
export function addPieces(doc = document) {
  const frames = doc.querySelectorAll('.doc-tm-frame');
  frames.forEach((f) => {
    if (f.querySelector('.doc-tm-frame__pieces')) return;
    const name = (f.getAttribute('data-ch-theme') || '').trim();
    const tint = f.querySelector('.doc-tm-frame__tint');
    const block = buildPieces(name);
    if (tint) f.insertBefore(block, tint); else f.append(block);
  });
  const wrap = doc.querySelector('.doc-tm-frames');
  const lead = wrap && wrap.previousElementSibling;
  if (lead && lead.classList.contains('doc-lead')) {
    lead.textContent = `Les réglages ne s'appliquent qu'à ces trois cadres : les couleurs et le thème de la documentation ne changent pas. Pièces montrées (${APERCU_PIECES.length}) : ${APERCU_PIECES.join(', ').toLowerCase()}, plus deux échantillons de rôles (lien d'accent, teinte d'accent) qui ne sont pas des composants.`;
  }
}
