/*! Chopa Design · chopa-effects.js (facultatif) : bandes liées au défilement et apparition des titres.
 * Sans dépendance. À charger avec defer, après chopa.js. Aucun effet si « mouvement réduit » est demandé ;
 * sans ce fichier (ou s'il échoue), tout le texte reste visible. */
(function () {
  'use strict';
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)');
  if (!reduce || reduce.matches) return;
  var doc = document, bands = [], titles = [], io = null, raf = 0, on = true;

  function show(el) { el.removeAttribute('data-ch-reveal'); }

  function measure() {
    bands.forEach(function (b) {
      var first = b.track.firstElementChild;
      if (!first) return;
      b.loop = first.getBoundingClientRect().width;
      // Assez de copies (aria-hidden) pour couvrir la boîte plus une période.
      var n = b.track.children.length;
      while (b.loop > 0 && b.track.scrollWidth < b.box.clientWidth + b.loop * 2 && n++ < 60) {
        var c = first.cloneNode(true);
        c.setAttribute('aria-hidden', 'true');
        b.track.appendChild(c);
      }
    });
  }

  function frame() {
    raf = 0;
    if (!on) return;
    var y = window.pageYOffset || 0;
    bands.forEach(function (b) {
      if (!b.loop) return;
      var x = (y * b.speed) % b.loop;
      b.track.style.transform = 'translate3d(' + (b.rev ? x - b.loop : -x) + 'px,0,0)';
    });
  }
  function ask() { if (!raf) raf = requestAnimationFrame(frame); }

  function stop() {
    on = false;
    bands.forEach(function (b) { b.track.style.transform = ''; });
    titles.forEach(show);
    if (io) io.disconnect();
  }

  try {
    Array.prototype.forEach.call(doc.querySelectorAll('.ch-band'), function (box) {
      var track = box.querySelector('.ch-band__track');
      if (!track) return;
      var s = parseFloat(box.getAttribute('data-ch-speed'));
      bands.push({ box: box, track: track, loop: 0, speed: s > 0 ? s : 0.4, rev: box.getAttribute('data-ch-dir') === 'reverse' });
    });
    if (bands.length) {
      measure();
      frame();
      window.addEventListener('scroll', ask, { passive: true });
      window.addEventListener('resize', function () { measure(); ask(); });
      // Les polices changent la largeur du texte : on remesure quand elles sont prêtes.
      if (doc.fonts && doc.fonts.ready) doc.fonts.ready.then(function () { if (on) { measure(); ask(); } });
    }

    var found = doc.querySelectorAll('.ch-reveal');
    if (found.length && 'IntersectionObserver' in window) {
      io = new IntersectionObserver(function (list) {
        list.forEach(function (e) {
          if (e.isIntersecting) { io.unobserve(e.target); e.target.setAttribute('data-ch-reveal', 'in'); }
        });
      }, { rootMargin: '0px' }); /* marge nulle : un titre en bas de page doit pouvoir apparaître (testeur n° 2) */
      Array.prototype.forEach.call(found, function (el) {
        // Seuls les titres encore sous la fenêtre attendent ; les autres restent tels quels.
        if (el.getBoundingClientRect().top < window.innerHeight) return;
        titles.push(el);
        el.setAttribute('data-ch-reveal', 'wait');
        io.observe(el);
      });
    }
    var change = function () { if (reduce.matches) stop(); };
    if (reduce.addEventListener) reduce.addEventListener('change', change);
  } catch (e) {
    stop();
  }
})();
