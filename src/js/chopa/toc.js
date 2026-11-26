/* Module toc : data-ch-toc. aria-current="true" sur le lien de la section en vue (IntersectionObserver). */
(function () {
  function toc(el) {
    var map = [], io, wait;
    [].slice.call(el.querySelectorAll('a[href^="#"]')).forEach(function (a) {
      var t = document.getElementById(decodeURIComponent(a.getAttribute("href").slice(1)));
      if (t) map.push([a, t]);
    });
    if (!map.length || !("IntersectionObserver" in window)) return;
    function update() {
      var line = innerHeight * 0.15, cur = map[0];
      wait = 0;
      map.forEach(function (m) { if (m[1].getBoundingClientRect().top <= line) cur = m; });
      map.forEach(function (m) {
        if (m === cur) m[0].setAttribute("aria-current", "true"); else m[0].removeAttribute("aria-current");
      });
    }
    /* Bande des 15 % du haut : un titre qui y entre ou en sort relance le calcul ; le défilement brusque aussi. */
    io = new IntersectionObserver(update, { rootMargin: "0px 0px -85% 0px" });
    map.forEach(function (m) { io.observe(m[1]); });
    addEventListener("scroll", function () { if (!wait) wait = requestAnimationFrame(update); }, { passive: true });
    update();
  }
  chopa.use("toc", "[data-ch-toc]", toc);
})();
