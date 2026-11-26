// Bouton « Version calme » (I0, §16.3 M6) : bascule aria-pressed, mémorisée dans localStorage « doc-calme » ('1').
// Caché sans JavaScript (attribut hidden dans le HTML) et en mouvement réduit (qui impose déjà le calme).
// La classe « im-calme » de <html> est posée par tete.js (avant le premier rendu) ; ici on l'informe par l'évènement « im-calme ».
const bouton = document.querySelector('[data-im-calme]');
if (bouton) {
  const reduit = matchMedia('(prefers-reduced-motion: reduce)');
  let etat = false;
  try { etat = localStorage.getItem('doc-calme') === '1'; } catch (_) { /* stockage refusé : l'état reste en mémoire */ }
  const maj = () => {
    bouton.hidden = reduit.matches;
    bouton.setAttribute('aria-pressed', String(etat));
  };
  bouton.addEventListener('click', () => {
    etat = !etat;
    try { if (etat) localStorage.setItem('doc-calme', '1'); else localStorage.removeItem('doc-calme'); } catch (_) { /* idem */ }
    dispatchEvent(new CustomEvent('im-calme', { detail: { calme: etat } }));
    maj();
  });
  reduit.addEventListener('change', maj);
  maj();
}
