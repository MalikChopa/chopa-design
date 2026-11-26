// Curseur carré (I0, §16.6 M13), commun aux pages de la doc. Repris de la maquette immersive (maquette/immersif/curseur.js).
// Seulement avec une souris (hover: hover et pointer: fine), hors mouvement réduit et hors version calme ; sinon le curseur natif reste.
// Un carré au contour orange (--ch-focus), vide au centre, 14 px ; 44 px sur un élément interactif ; natif sur les champs de texte.
// Au clavier (Tab, flèches) il se cache et ne couvre jamais l'anneau de focus. pointer-events: none (le CSS).
// Il n'est créé qu'au premier mouvement de souris, dans un calque fixe « inset: 0; overflow: hidden » : sans cela
// check-overflow le verrait hors de la fenêtre à sa position de départ.
const racine = document.documentElement;
const souris = matchMedia('(hover: hover) and (pointer: fine)');
const INTERACTIF = 'a[href], button:not([disabled]), summary, label, select, [role="button"], [role="tab"], [tabindex]:not([tabindex="-1"]), .im-tuile3d, input[type="checkbox"], input[type="radio"], input[type="range"], input[type="file"]';
const TEXTE = 'input:not([type]), input[type="text"], input[type="email"], input[type="search"], input[type="url"], input[type="tel"], input[type="password"], input[type="number"], textarea, [contenteditable="true"]';

let calque = null, carre = null, arme = false;
let x = 0, y = 0, cx = 0, cy = 0, raf = 0;

const permis = () => souris.matches && !racine.classList.contains('im-calme');

function image() {
  raf = 0;
  cx += (x - cx) * 0.38; cy += (y - cy) * 0.38;
  if (Math.abs(x - cx) < 0.2) cx = x;
  if (Math.abs(y - cy) < 0.2) cy = y;
  carre.style.transform = `translate3d(${cx.toFixed(1)}px,${cy.toFixed(1)}px,0)`;
  if (cx !== x || cy !== y) raf = requestAnimationFrame(image);
}
function creer() {
  calque = document.createElement('div');
  calque.className = 'im-curseur-calque';
  calque.setAttribute('aria-hidden', 'true');
  carre = document.createElement('div');
  carre.className = 'im-curseur';
  calque.appendChild(carre);
  document.body.appendChild(calque);
  racine.classList.add('im-curseur-on');
}
function surMouvement(e) {
  if (e.pointerType && e.pointerType !== 'mouse' && e.pointerType !== 'pen') return;
  const premier = !carre;
  if (premier) { creer(); cx = e.clientX; cy = e.clientY; }
  x = e.clientX; y = e.clientY;
  const t = e.target && e.target.closest ? e.target : null;
  const texte = t && t.closest(TEXTE);
  const cible = !texte && t && t.closest(INTERACTIF);
  // L'élément focalisé au clavier garde son anneau dégagé : le carré reste petit sur lui.
  const focus = cible && cible.matches(':focus-visible');
  carre.classList.toggle('is-grand', Boolean(cible) && !focus);
  carre.classList.toggle('is-cache', Boolean(texte));
  carre.classList.add('is-actif');
  if (!raf) raf = requestAnimationFrame(image);
}
const cacher = () => { if (carre) carre.classList.remove('is-actif'); };
const surClavier = (e) => { if (e.key === 'Tab' || e.key.indexOf('Arrow') === 0) cacher(); };

function armer() {
  if (arme || !permis()) return;
  arme = true;
  addEventListener('pointermove', surMouvement, { passive: true });
  addEventListener('pointerdown', surMouvement, { passive: true });
  addEventListener('keydown', surClavier);
  addEventListener('blur', cacher);
  document.documentElement.addEventListener('pointerleave', cacher);
}
function desarmer() {
  if (!arme && !calque) return;
  arme = false;
  removeEventListener('pointermove', surMouvement);
  removeEventListener('pointerdown', surMouvement);
  removeEventListener('keydown', surClavier);
  removeEventListener('blur', cacher);
  document.documentElement.removeEventListener('pointerleave', cacher);
  cancelAnimationFrame(raf); raf = 0;
  racine.classList.remove('im-curseur-on');
  if (calque && calque.parentNode) calque.parentNode.removeChild(calque);
  calque = carre = null;
}
const accorder = () => (permis() ? armer() : desarmer());

addEventListener('im-calme', accorder); // calme.js, ou changement de la préférence de mouvement (tete.js)
if (souris.addEventListener) souris.addEventListener('change', accorder);
accorder();
