// Titre vivant (I0, §16.6 M13). Repris de la maquette immersive (page.js), sans les aimants (jalon I3).
// Cible : les éléments [data-im-vivant], sinon le premier h1 de #contenu. Les lettres suivent le pointeur (vague, soulèvement)
// et penchent avec la vitesse de défilement. Le texte entier reste dans une copie lisible (.im-sr) ; les lettres découpées
// sont aria-hidden : le nom accessible du titre ne change pas. Rien en mouvement réduit ni en version calme (titre laissé en texte).
const racine = document.documentElement;
const ptr = { x: -1e4, y: -1e4, dedans: false };
let groupes = [], actif = false, raf = 0, dernier = 0, vy = 0, precY = scrollY, visible = true, observateur = null;

const permis = () => !racine.classList.contains('im-calme');
const lisse = (v, c, k, dt) => v + (c - v) * (1 - Math.exp(-dt * k));

function cibles() {
  const marques = [...document.querySelectorAll('[data-im-vivant]')];
  if (marques.length) return marques;
  const h = document.querySelector('#contenu h1');
  return h ? [h] : [];
}
function decouper(h) {
  if (h.dataset.imDecoupe) return h._lettres || null;
  if (h.children.length) return null; // du balisage dans le titre : on le laisse tel quel
  const texte = h.textContent.replace(/\s+/g, ' ').trim();
  if (!texte) return null;
  h.textContent = '';
  const sr = document.createElement('span'); sr.className = 'im-sr'; sr.textContent = texte;
  const vu = document.createElement('span'); vu.setAttribute('aria-hidden', 'true');
  const lettres = [];
  const point = h.hasAttribute('data-im-vivant'); // point carré orange de la marque, seulement sur les titres choisis
  const mots = texte.split(' ');
  mots.forEach((mot, k) => {
    const m = document.createElement('span'); m.className = 'im-vivant__mot';
    for (const c of mot) {
      const l = document.createElement('span'); l.className = 'im-vivant__l'; l.textContent = c;
      m.appendChild(l); lettres.push({ el: l, f: 0, x: 0, y: 0 });
    }
    if (point && k === mots.length - 1) {
      const p = document.createElement('span'); p.className = 'im-vivant__point';
      m.appendChild(p); lettres.push({ el: p, f: 0, x: 0, y: 0 });
    }
    vu.appendChild(m);
    if (k < mots.length - 1) vu.appendChild(document.createTextNode(' '));
  });
  h.append(sr, vu);
  h.dataset.imDecoupe = '1';
  h._lettres = lettres;
  return lettres;
}
function mesurer() {
  for (const g of groupes) for (const l of g.lettres) {
    const r = l.el.getBoundingClientRect();
    l.x = r.left + r.width / 2 + scrollX; l.y = r.top + r.height / 2 + scrollY;
  }
}
function image(t) {
  raf = requestAnimationFrame(image);
  const dt = Math.min(0.05, (t - (dernier || t)) / 1000) || 1 / 60;
  dernier = t;
  vy = lisse(vy, (scrollY - precY) / dt, 8, dt);
  precY = scrollY;
  if (!visible) return;
  const px = ptr.x + scrollX, py = ptr.y + scrollY;
  const penche = Math.max(-12, Math.min(12, -vy * 0.012));
  for (const g of groupes) g.lettres.forEach((l, i) => {
    const f = ptr.dedans ? Math.exp(-(((Math.hypot(px - l.x, py - l.y)) / 180) ** 2)) : 0;
    l.f = lisse(l.f, f, 9, dt);
    const vague = Math.sin(t / 700 + i * 0.55) * 3;
    l.el.style.transform = `translateY(${(-l.f * 0.12 + vague / 200).toFixed(3)}em) skewX(${(penche - l.f * 8).toFixed(1)}deg) scaleY(${(1 + l.f * 0.12).toFixed(3)})`;
  });
}
const surPointeur = (e) => { if (e.pointerType !== 'touch') { ptr.x = e.clientX; ptr.y = e.clientY; ptr.dedans = true; } };
const surSortie = () => { ptr.dedans = false; };

function entree() {
  // Apparition des lettres, une fois (API Web Animations ; jamais en mouvement réduit ni en calme : demarrer() n'est pas appelé).
  // fill « backwards » : une lettre reste cachée jusqu'à son tour, sans éclair au départ.
  for (const g of groupes) g.lettres.forEach((l, i) => {
    l.el.animate([{ transform: 'translateY(.5em) rotate(4deg)', opacity: 0 }, { transform: 'none', opacity: 1 }],
      { duration: 600, delay: 80 + Math.min(i, 24) * 35, easing: 'cubic-bezier(.2,.7,.1,1)', fill: 'backwards' });
  });
}
function demarrer() {
  if (actif || !permis()) return;
  const premiere = !groupes.length;
  if (premiere) groupes = cibles().map((h) => ({ h, lettres: decouper(h) })).filter((g) => g.lettres);
  if (!groupes.length) return;
  actif = true;
  mesurer();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(mesurer);
  addEventListener('resize', mesurer);
  addEventListener('pointermove', surPointeur, { passive: true });
  racine.addEventListener('pointerleave', surSortie);
  if (window.IntersectionObserver && !observateur) {
    observateur = new IntersectionObserver((es) => { visible = es.some((e) => e.isIntersecting); });
    groupes.forEach((g) => observateur.observe(g.h));
  }
  if (premiere) { entree(); setTimeout(mesurer, 1500); }
  dernier = 0; precY = scrollY;
  raf = requestAnimationFrame(image);
}
function arreter() {
  actif = false;
  cancelAnimationFrame(raf);
  removeEventListener('resize', mesurer);
  removeEventListener('pointermove', surPointeur);
  racine.removeEventListener('pointerleave', surSortie);
  for (const g of groupes) for (const l of g.lettres) { l.el.style.transform = ''; l.el.getAnimations().forEach((a) => a.cancel()); }
}
addEventListener('im-calme', () => (permis() ? demarrer() : arreter()));
if (permis()) demarrer();
