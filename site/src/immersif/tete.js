/* Tête commune de la doc (I0, §16.5 M10 et §16.7 M15). Script classique, EN LIGNE dans <head> juste après l'inscription
   @view-transition, sans defer : les écouteurs sont posés avant tout autre script.
   1. Drapeaux sur <html> : « im-reduit » (mouvement réduit) et « im-calme » (version calme choisie, ou mouvement réduit).
      Décidés avant le premier rendu ; recalculés quand la préférence change ou quand calme.js annonce « im-calme ».
   2. Garde des transitions entre documents : « catch » posé tout de suite sur les promesses de la transition (jamais de rejet
      non traité), puis saut de la transition si le document n'est pas visible, si le mouvement est réduit ou après un rechargement.
      La raison est notée dans data-im-vt sur <html> (lue par le banc). */
(function () {
  'use strict';
  var d = document, root = d.documentElement;
  var mq = window.matchMedia ? matchMedia('(prefers-reduced-motion: reduce)') : null;
  var calme = false;
  try { calme = localStorage.getItem('doc-calme') === '1'; } catch (e) { /* stockage refusé */ }
  function reduit() { return !!(mq && mq.matches); }
  function pose() {
    root.classList.toggle('im-reduit', reduit());
    root.classList.toggle('im-calme', calme || reduit());
  }
  pose();
  if (mq && mq.addEventListener) mq.addEventListener('change', function () { pose(); dispatchEvent(new Event('im-calme')); });
  addEventListener('im-calme', function (e) {
    if (e.detail && typeof e.detail.calme === 'boolean') { calme = e.detail.calme; pose(); }
  });

  function garde(e) {
    var vt = e && e.viewTransition;
    if (!vt) return;
    ['ready', 'finished', 'updateCallbackDone'].forEach(function (k) {
      try { if (vt[k] && vt[k].catch) vt[k].catch(function () {}); } catch (x) { /* ignoré */ }
    });
    var type = '';
    try { type = (e.activation || (window.navigation && navigation.activation) || {}).navigationType || ''; } catch (x) { /* API absente */ }
    var raison = '';
    if (d.visibilityState !== 'visible') raison = 'cache';
    else if (reduit()) raison = 'reduit';
    else if (type === 'reload') raison = 'rechargement';
    if (e.type === 'pagereveal') root.setAttribute('data-im-vt', raison ? 'saute-' + raison : 'ok');
    if (raison) { try { vt.skipTransition(); } catch (x) { /* déjà finie */ } }
  }
  addEventListener('pageswap', garde);
  addEventListener('pagereveal', garde);
})();
