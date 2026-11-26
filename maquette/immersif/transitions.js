/* Transitions de page (maquette immersive, brief 31). Script classique, dans <head>, sans defer : il doit écouter
   « pagereveal » avant le premier rendu. Les transitions elles-mêmes sont déclarées en CSS (immersif.css,
   @view-transition, hors mouvement réduit) ; ici, seulement le filet : une transition abandonnée par le navigateur
   (état invalide, onglet caché…) ne laisse pas d'erreur non traitée, la navigation se fait simplement sans animation. */
(function () {
  'use strict';
  function filet(e) {
    var vt = e && e.viewTransition;
    if (!vt) return;
    ['ready', 'finished', 'updateCallbackDone'].forEach(function (k) { if (vt[k] && vt[k].catch) vt[k].catch(function () {}); });
  }
  addEventListener('pageswap', filet);
  addEventListener('pagereveal', filet);
})();
