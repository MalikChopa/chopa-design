// Pages de pièce (maquette immersive, brief 31) : typo vivante, boutons aimantés, copie du code,
// et remplissage de la page modèle (piece.html?p=<slug>) depuis donnees.js.
// Mouvement réduit : ni typo vivante, ni aimants, aucune animation créée (document.getAnimations() reste vide).
import { pieces } from './donnees.js';

const reduit = matchMedia('(prefers-reduced-motion: reduce)');
const souris = matchMedia('(hover: hover) and (pointer: fine)');
const etat = { vivant: 0, aimants: 0, images: 0 };
window.__imPage = etat; // lu par outils/mesurer.mjs

// ---------- Page modèle : une pièce sans page complète dans la maquette ----------
const modele = document.querySelector('[data-im-modele]');
if (modele) {
  const slug = new URLSearchParams(location.search).get('p');
  const i = pieces.findIndex((p) => p.slug === slug);
  const p = pieces[i];
  if (p) {
    document.title = `${p.titre} · Chopa Design (maquette immersive)`;
    document.querySelector('[data-im-titre]').textContent = p.titre;
    document.querySelector('[data-im-but]').textContent = p.but;
    const fil = document.querySelector('[data-im-fil]');
    fil.textContent = p.famille;
    fil.href = `index.html#p-${p.slug}`;
    document.querySelector('[data-im-num]').textContent = p.num;
    const ap = document.querySelector('[data-im-apercu]');
    ap.innerHTML = p.apercu;
    if (p.z) ap.classList.add(`im-z${p.z}`);
    document.querySelectorAll('[data-im-retour]').forEach((a) => { a.href = `index.html#p-${p.slug}`; });
    suite(i);
  }
}
function suite(i) {
  const prev = pieces[i - 1], next = pieces[i + 1];
  const nav = document.querySelector('[data-im-suite]');
  if (!nav) return;
  nav.replaceChildren();
  for (const [p, sens] of [[prev, 'Précédente'], [next, 'Suivante']]) {
    if (!p) continue;
    const a = document.createElement('a');
    a.href = p.href;
    const s = document.createElement('span'); s.className = 'ch-label'; s.textContent = `${sens} · ${p.num}`;
    const b = document.createElement('b'); b.textContent = p.titre;
    a.append(s, b);
    nav.appendChild(a);
  }
}

// ---------- Copier le code ----------
const annonce = document.querySelector('[data-im-annonce]');
document.addEventListener('click', async (e) => {
  const b = e.target.closest && e.target.closest('[data-im-copier]');
  if (!b) return;
  const code = b.closest('.ch-code').querySelector('code').textContent;
  let ok = false;
  try { await navigator.clipboard.writeText(code); ok = true; } catch (_) { ok = false; }
  const txt = b.querySelector('[data-im-etat]');
  txt.textContent = ok ? 'Copié' : 'Copie impossible';
  b.setAttribute('data-ch-state', ok ? 'ok' : 'ko');
  if (annonce) annonce.textContent = ok ? 'Code copié.' : 'Copie impossible : sélectionne le code à la main.';
  setTimeout(() => { txt.textContent = 'Copier'; b.removeAttribute('data-ch-state'); }, 2200);
});

// ---------- Typo vivante ----------
// Le texte reste lisible tel quel pour un lecteur d'écran (copie masquée) ; les lettres découpées sont aria-hidden.
function decouper(h) {
  const texte = h.textContent.trim();
  h.textContent = '';
  const sr = document.createElement('span'); sr.className = 'im-sr'; sr.textContent = texte;
  const vu = document.createElement('span'); vu.setAttribute('aria-hidden', 'true');
  const lettres = [];
  texte.split(/\s+/).forEach((mot, k, tous) => {
    const m = document.createElement('span'); m.className = 'im-vivant__mot';
    for (const c of mot) { const l = document.createElement('span'); l.className = 'im-vivant__l'; l.textContent = c; m.appendChild(l); lettres.push({ el: l, f: 0, x: 0, y: 0 }); }
    if (k === tous.length - 1) { const pt = document.createElement('span'); pt.className = 'im-vivant__point'; m.appendChild(pt); lettres.push({ el: pt, f: 0, x: 0, y: 0 }); }
    vu.appendChild(m);
    if (k < tous.length - 1) vu.appendChild(document.createTextNode(' '));
  });
  h.append(sr, vu);
  return lettres;
}

const titres = [...document.querySelectorAll('[data-im-vivant]')];
const groupes = titres.map((h) => ({ h, lettres: decouper(h) }));
const aimants = [...document.querySelectorAll('.im-piece-hero__demo .ch-btn, .im-variante__demo .ch-btn:not([disabled]), .im-trois .ch-btn')]
  .map((el) => ({ el, x: 0, y: 0, cx: 0, cy: 0, w: 0, h: 0 }));

const ptr = { x: -1e4, y: -1e4, dedans: false };
let raf = 0, actif = false, vy = 0, prevY = scrollY, dernier = 0;

function mesurer() {
  for (const g of groupes) for (const l of g.lettres) {
    const r = l.el.getBoundingClientRect();
    l.x = r.left + r.width / 2 + scrollX; l.y = r.top + r.height / 2 + scrollY;
  }
  for (const a of aimants) {
    const t = a.el.style.transform; a.el.style.transform = '';
    const r = a.el.getBoundingClientRect();
    a.el.style.transform = t;
    a.cx = r.left + r.width / 2 + scrollX; a.cy = r.top + r.height / 2 + scrollY; a.w = r.width; a.h = r.height;
  }
}
const lisse = (v, c, k, dt) => v + (c - v) * (1 - Math.exp(-dt * k));

function frame(t) {
  raf = requestAnimationFrame(frame);
  const dt = Math.min(0.05, (t - (dernier || t)) / 1000) || 1 / 60;
  dernier = t;
  etat.images++;
  vy = lisse(vy, (scrollY - prevY) / dt, 8, dt);
  prevY = scrollY;
  const px = ptr.x + scrollX, py = ptr.y + scrollY;
  const penche = Math.max(-12, Math.min(12, -vy * 0.012));
  for (const g of groupes) {
    g.lettres.forEach((l, i) => {
      const d = Math.hypot(px - l.x, py - l.y);
      const f = ptr.dedans ? Math.exp(-((d / 180) ** 2)) : 0;
      l.f = lisse(l.f, f, 9, dt);
      const vague = Math.sin(t / 700 + i * 0.55) * 3;
      l.el.style.transform = `translateY(${(-l.f * 0.12 + vague / 200).toFixed(3)}em) skewX(${(penche - l.f * 8).toFixed(1)}deg) scaleY(${(1 + l.f * 0.12).toFixed(3)})`;
    });
  }
  for (const a of aimants) {
    const dx = px - a.cx, dy = py - a.cy;
    const zone = Math.max(a.w, a.h) / 2 + 70;
    const dans = ptr.dedans && Math.abs(dx) < a.w / 2 + 70 && Math.abs(dy) < a.h / 2 + 50 && Math.hypot(dx, dy) < zone + 40;
    const tx = dans ? Math.max(-14, Math.min(14, dx * 0.32)) : 0, ty = dans ? Math.max(-10, Math.min(10, dy * 0.32)) : 0;
    a.x = lisse(a.x, tx, dans ? 14 : 8, dt); a.y = lisse(a.y, ty, dans ? 14 : 8, dt);
    if (Math.abs(a.x) < 0.05 && Math.abs(a.y) < 0.05 && !dans) { a.x = 0; a.y = 0; }
    a.el.style.transform = a.x || a.y ? `translate(${a.x.toFixed(2)}px,${a.y.toFixed(2)}px)` : '';
  }
}

function entree() {
  // Apparition des lettres, une fois, avec l'API Web Animations (jamais en mouvement réduit).
  for (const g of groupes) g.lettres.forEach((l, i) => {
    l.el.animate([{ transform: 'translateY(.5em) rotate(4deg)', opacity: 0 }, { transform: 'none', opacity: 1 }],
      { duration: 700, delay: 120 + i * 45, easing: 'cubic-bezier(.2,.7,.1,1)', fill: 'none' });
  });
}

function demarrer() {
  if (actif || reduit.matches) return;
  actif = true;
  etat.vivant = groupes.reduce((n, g) => n + g.lettres.length, 0);
  etat.aimants = souris.matches ? aimants.length : 0;
  if (!souris.matches) aimants.length = 0;
  mesurer();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(mesurer);
  addEventListener('resize', mesurer);
  addEventListener('pointermove', (e) => { if (e.pointerType !== 'touch') { ptr.x = e.clientX; ptr.y = e.clientY; ptr.dedans = true; } }, { passive: true });
  document.documentElement.addEventListener('pointerleave', () => { ptr.dedans = false; });
  raf = requestAnimationFrame(frame);
}
function arreter() {
  actif = false;
  cancelAnimationFrame(raf);
  for (const g of groupes) for (const l of g.lettres) { l.el.style.transform = ''; l.el.getAnimations().forEach((a) => a.cancel()); }
  for (const a of aimants) a.el.style.transform = '';
}
reduit.addEventListener('change', () => { if (reduit.matches) arreter(); else demarrer(); });

if (!reduit.matches) {
  // Les lettres montent aussi pendant une transition de vue : l'image de la nouvelle page y est vivante.
  entree();
  demarrer();
  setTimeout(mesurer, 1200);
}
