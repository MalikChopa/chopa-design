/* Décision du mode de l'accueil avant le premier rendu (I2, §16.5 M10 et §16.6 M13). Script classique, EN LIGNE dans <head>
   de « / » (fente `head`), sans defer : sinon la transition de page capterait d'abord la grille. Repris de la maquette immersive.
   Le mur seulement si le mouvement n'est pas réduit, la version calme non demandée, l'écran assez grand (900 × 560 px), la 3D CSS
   disponible, WebGL présent (il ne dessine rien : son absence signale une composition logicielle, trop lente pour 72 calques 3D)
   et la garde de lenteur non déclenchée dans cette session (sessionStorage « doc-mur-lent »).
   Filet : si mur.js ne s'est jamais lancé (module absent ou en échec), la grille revient 1,5 s après « load ». */
(function () {
  var r = document.documentElement, calme = r.classList.contains('im-calme'), lent = false;
  try { calme = calme || localStorage.getItem('doc-calme') === '1'; } catch (e) { /* stockage refusé */ }
  try { lent = sessionStorage.getItem('doc-mur-lent') === '1'; } catch (e) { /* idem */ }
  var gl = false;
  try {
    var c = document.createElement('canvas'), x = c.getContext('webgl') || c.getContext('experimental-webgl');
    gl = Boolean(x);
    if (x && x.getExtension('WEBGL_lose_context')) x.getExtension('WEBGL_lose_context').loseContext();
  } catch (e) { /* pas de WebGL */ }
  window.__imWebgl = gl;
  var ok = window.matchMedia && !matchMedia('(prefers-reduced-motion: reduce)').matches
    && matchMedia('(min-width: 900px) and (min-height: 560px)').matches
    && window.CSS && CSS.supports('transform-style', 'preserve-3d') && gl && !calme && !lent;
  if (ok) r.classList.add('im-mur');
  addEventListener('load', function () {
    setTimeout(function () {
      if (!window.__imMur) { r.classList.remove('im-mur'); var i = document.querySelector('[data-im-intro]'); if (i) i.inert = false; }
    }, 1500);
  });
})();
