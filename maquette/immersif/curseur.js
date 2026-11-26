/* Curseur carré (maquette immersive, brief 31), commun aux pages. Script classique, chargé avec defer.
   Seulement avec une souris (hover: hover et pointer: fine) et sans mouvement réduit ; sinon le curseur natif reste.
   Un carré au contour orange (--ch-focus), vide au centre ; il grandit à 44 px sur un élément interactif.
   Le curseur natif revient sur les champs de texte. Au clavier, le carré se cache : il ne couvre jamais l'anneau de focus. */
(function () {
  'use strict';
  var souris = window.matchMedia && matchMedia('(hover: hover) and (pointer: fine)');
  var reduit = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)');
  if (!souris || !souris.matches || reduit.matches) return;
  var root = document.documentElement;
  var INTERACTIF = 'a[href], button:not([disabled]), summary, label, select, [role="button"], [role="tab"], [tabindex]:not([tabindex="-1"]), .im-tuile3d, input[type="checkbox"], input[type="radio"], input[type="range"], input[type="file"]';
  var TEXTE = 'input:not([type]), input[type="text"], input[type="email"], input[type="search"], input[type="url"], input[type="tel"], input[type="password"], input[type="number"], textarea, [contenteditable="true"]';
  var el = document.createElement('div');
  el.className = 'im-curseur';
  el.setAttribute('aria-hidden', 'true');
  var x = -100, y = -100, cx = -100, cy = -100, raf = 0;

  function frame() {
    raf = 0;
    cx += (x - cx) * 0.38; cy += (y - cy) * 0.38;
    if (Math.abs(x - cx) < 0.2) cx = x;
    if (Math.abs(y - cy) < 0.2) cy = y;
    el.style.transform = 'translate3d(' + cx.toFixed(1) + 'px,' + cy.toFixed(1) + 'px,0)';
    if (cx !== x || cy !== y) raf = requestAnimationFrame(frame);
  }
  function surMove(e) {
    if (e.pointerType && e.pointerType !== 'mouse' && e.pointerType !== 'pen') return;
    x = e.clientX; y = e.clientY;
    var t = e.target && e.target.closest ? e.target : null;
    var texte = t && t.closest(TEXTE);
    var cible = !texte && t && t.closest(INTERACTIF);
    // L'élément focalisé au clavier garde son anneau dégagé : le carré reste petit sur lui.
    var focus = cible && cible.matches(':focus-visible');
    el.classList.toggle('is-grand', Boolean(cible) && !focus);
    el.classList.toggle('is-cache', Boolean(texte));
    el.classList.add('is-actif');
    if (!raf) raf = requestAnimationFrame(frame);
  }
  function demarrer() {
    document.body.appendChild(el);
    root.classList.add('im-curseur-on');
    addEventListener('pointermove', surMove, { passive: true });
    addEventListener('pointerdown', surMove, { passive: true });
    document.addEventListener('pointerleave', function () { el.classList.remove('is-actif'); });
    root.addEventListener('pointerleave', function () { el.classList.remove('is-actif'); });
    addEventListener('keydown', function (e) { if (e.key === 'Tab' || e.key.indexOf('Arrow') === 0) el.classList.remove('is-actif'); });
    addEventListener('blur', function () { el.classList.remove('is-actif'); });
  }
  function arreter() {
    root.classList.remove('im-curseur-on');
    if (el.parentNode) el.parentNode.removeChild(el);
    removeEventListener('pointermove', surMove);
    removeEventListener('pointerdown', surMove);
  }
  if (reduit.addEventListener) reduit.addEventListener('change', function () { if (reduit.matches) arreter(); });
  if (document.body) demarrer(); else document.addEventListener('DOMContentLoaded', demarrer);
})();
