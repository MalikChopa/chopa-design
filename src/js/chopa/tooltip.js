/* tooltip : data-ch-tooltip sur .ch-tooltip ; role="tooltip" + aria-describedby du déclencheur. Affichée au survol et au focus,
   masquée par Échap (le focus ne bouge pas), survolable (la bulle est dans le conteneur) et persistante tant que survol ou focus durent (WCAG 1.4.13). */
(function () {
  var d = document, shown = new Set();
  d.addEventListener("keydown", function (e) { if (e.key === "Escape") shown.forEach(function (f) { f(); }); });
  chopa.use("tooltip", "[data-ch-tooltip]", function (el) {
    var tip = el.querySelector('[role="tooltip"]'), hov, foc, off, t;
    if (!tip) throw new Error("infobulle (role=tooltip) introuvable");
    tip.id = tip.id || chopa.uid("tip");
    t = el.querySelector('[aria-describedby~="' + tip.id + '"]') || el.firstElementChild;
    if (t !== tip && !t.hasAttribute("aria-describedby")) t.setAttribute("aria-describedby", tip.id);
    function esc() { off = 1; sync(); }
    function fit(r) { return r.top >= 8 && r.bottom <= innerHeight - 8; }
    function place() {
      var r, w = d.documentElement.clientWidth, dx;
      tip.style.translate = "";
      el.removeAttribute("data-ch-flip");
      r = tip.getBoundingClientRect();
      if (!fit(r)) {
        el.setAttribute("data-ch-flip", "");
        if (!fit(r = tip.getBoundingClientRect())) { el.removeAttribute("data-ch-flip"); r = tip.getBoundingClientRect(); }
      }
      dx = r.left < 8 ? 8 - r.left : r.right > w - 8 ? w - 8 - r.right : 0;
      if (dx) tip.style.translate = dx + "px 0";
    }
    function sync() {
      var on = !!((hov || foc) && !off);
      el.classList.toggle("is-open", on);
      if (on) { shown.add(esc); place(); } else shown.delete(esc);
    }
    el.addEventListener("mouseenter", function () { hov = 1; off = 0; sync(); });
    el.addEventListener("mouseleave", function () { hov = 0; sync(); });
    el.addEventListener("focusin", function () { foc = 1; off = 0; sync(); });
    el.addEventListener("focusout", function () { foc = 0; sync(); });
    el.setAttribute("data-ch-ready", "");
  });
})();
