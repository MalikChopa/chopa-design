/* Module tabs : data-ch-tabs. Onglets à activation automatique (motif Tabs de l'APG). */
(function () {
  var FOCUS = 'a[href],button:not([disabled]),input:not([disabled]),select,textarea,summary,[tabindex]:not([tabindex="-1"])';
  function tabs(el) {
    var list = el.querySelector(".ch-tabs__list"),
      ts = [].slice.call(el.querySelectorAll(".ch-tabs__tab")),
      ps = [].slice.call(el.querySelectorAll(".ch-tabs__panel"));
    if (!list || !ts.length || ts.length !== ps.length) throw new Error("onglets et panneaux : liste ou nombres différents");
    function on(t) { return t.getAttribute("aria-disabled") !== "true"; }
    function show(t, focus) {
      ts.forEach(function (x, i) {
        var s = x === t;
        x.setAttribute("aria-selected", s);
        x.tabIndex = s ? 0 : -1;
        ps[i].hidden = !s;
      });
      if (focus) t.focus();
    }
    list.setAttribute("role", "tablist");
    ts.forEach(function (t, i) {
      t.id = t.id || chopa.uid("tab");
      ps[i].id = ps[i].id || chopa.uid("panel");
      t.setAttribute("role", "tab");
      t.setAttribute("aria-controls", ps[i].id);
      ps[i].setAttribute("role", "tabpanel");
      ps[i].setAttribute("aria-labelledby", t.id);
      if (!ps[i].querySelector(FOCUS)) ps[i].tabIndex = 0;
    });
    show(ts.filter(function (t) { return on(t) && t.getAttribute("aria-selected") === "true"; })[0] || ts.filter(on)[0]);
    el.setAttribute("data-ch-ready", "");
    list.addEventListener("click", function (e) {
      var t = e.target.closest(".ch-tabs__tab");
      if (t && on(t)) show(t);
    });
    list.addEventListener("keydown", function (e) {
      var live = ts.filter(on), i = live.indexOf(e.target), k = e.key, c = live.length, t;
      if (i < 0) return;
      if (k === "ArrowRight") t = live[(i + 1) % c];
      else if (k === "ArrowLeft") t = live[(i + c - 1) % c];
      else if (k === "Home") t = live[0];
      else if (k === "End") t = live[c - 1];
      else return;
      e.preventDefault();
      show(t, true);
    });
  }
  chopa.use("tabs", "[data-ch-tabs]", tabs);
})();
