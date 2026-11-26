// Boutons aimantés (I3, §16.3 M3). Les .ch-btn actifs des aperçus et de l'en-tête de pièce se déplacent vers le pointeur
// (14 px au plus), puis reviennent à « transform: none ». Seulement avec une souris (hover + pointeur précis), hors mouvement
// réduit et hors version calme. Aucune boucle permanente : une image n'est demandée que tant qu'un bouton bouge ou que le
// pointeur bouge. Le centre d'un bouton est lu sans son décalage : un pointeur posé au centre ne le déplace pas.
const racine = document.documentElement;
const souris = matchMedia('(hover: hover) and (pointer: fine)');
const permis = () => souris.matches && !racine.classList.contains('im-calme');
let liste = [], px = 0, py = 0, dedans = false, raf = 0, actif = false, dernier = 0, remue = false;

const cibles = () => [...document.querySelectorAll('.doc-example__preview .ch-btn, .im-piece-hero .ch-btn')]
  .map((el) => ({ el, x: 0, y: 0 }));
const lisse = (v, c, k, dt) => v + (c - v) * (1 - Math.exp(-dt * k));

function image(t) {
  const dt = Math.min(0.05, (t - (dernier || t)) / 1000) || 1 / 60;
  dernier = t;
  let bouge = false;
  const avant = remue; remue = false;
  const lus = liste.map((a) => { const r = a.el.getBoundingClientRect(); return [r.left + r.width / 2 - a.x, r.top + r.height / 2 - a.y, r.width, r.height]; });
  liste.forEach((a, i) => {
    const [cx, cy, w, h] = lus[i];
    const dx = px - cx, dy = py - cy;
    const dans = dedans && !a.el.disabled && a.el.getAttribute('aria-disabled') !== 'true'
      && Math.abs(dx) < w / 2 + 70 && Math.abs(dy) < h / 2 + 50 && Math.hypot(dx, dy) < Math.max(w, h) / 2 + 110;
    const tx = dans ? Math.max(-14, Math.min(14, dx * 0.32)) : 0, ty = dans ? Math.max(-10, Math.min(10, dy * 0.32)) : 0;
    const ox = a.x, oy = a.y;
    a.x = lisse(a.x, tx, dans ? 14 : 8, dt); a.y = lisse(a.y, ty, dans ? 14 : 8, dt);
    if (!dans && Math.abs(a.x) < 0.05 && Math.abs(a.y) < 0.05) { a.x = 0; a.y = 0; }
    a.el.style.transform = a.x || a.y ? `translate(${a.x.toFixed(2)}px,${a.y.toFixed(2)}px)` : '';
    if (Math.abs(a.x - ox) > 0.01 || Math.abs(a.y - oy) > 0.01 || (!dans && (a.x || a.y))) bouge = true;
  });
  raf = bouge || avant || remue ? requestAnimationFrame(image) : 0;
}
const relance = () => { if (actif && !raf) { dernier = 0; raf = requestAnimationFrame(image); } };
const surPointeur = (e) => { if (e.pointerType === 'touch') return; px = e.clientX; py = e.clientY; dedans = true; remue = true; relance(); };
const surSortie = () => { dedans = false; remue = true; relance(); };

function demarrer() {
  if (actif || !permis()) return;
  liste = cibles();
  if (!liste.length) return;
  actif = true;
  addEventListener('pointermove', surPointeur, { passive: true });
  racine.addEventListener('pointerleave', surSortie);
}
function arreter() {
  actif = false;
  cancelAnimationFrame(raf); raf = 0; dedans = false;
  removeEventListener('pointermove', surPointeur);
  racine.removeEventListener('pointerleave', surSortie);
  for (const a of liste) a.el.style.transform = '';
}
const maj = () => (permis() ? demarrer() : arreter());
addEventListener('im-calme', maj);
souris.addEventListener('change', maj);
maj();
