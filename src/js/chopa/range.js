/* range : data-ch-range ; <output for> = valeur courante, modèle facultatif « {v} sur 5 » (aussi aria-valuetext) */
(function () {
  chopa.use("range", "[data-ch-range]", function (el) {
    var f = el.getAttribute("data-ch-range") || "{v}",
      o = [].filter.call(document.getElementsByTagName("output"), function (x) { return x.htmlFor.contains(el.id); })[0];
    if (!o) throw 0;
    function show() {
      o.textContent = f.replace("{v}", el.value);
      if (f !== "{v}") el.setAttribute("aria-valuetext", o.textContent);
    }
    o.setAttribute("aria-live", "off");
    el.addEventListener("input", show);
    show();
  });
})();
