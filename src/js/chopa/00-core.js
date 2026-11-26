/* chopa.js : noyau. IIFE ES2020, sans dépendance. Les modules suivants s'enregistrent par chopa.use(nom, sélecteur, fn). */
(function () {
  "use strict";
  var d = document, mods = [], n = 0, live;
  d.documentElement.classList.add("ch-js"); /* au cas où chopa-theme.js n'est pas chargé */
  function region() {
    if (live || (live = d.querySelector("[data-ch-live]"))) return live;
    live = d.createElement("div");
    live.setAttribute("data-ch-live", "");
    live.setAttribute("role", "status");
    live.setAttribute("aria-live", "polite");
    live.setAttribute("aria-atomic", "true");
    live.style.cssText = "position:absolute;left:0;top:0;width:1px;height:1px;margin:0;padding:0;overflow:hidden;clip:rect(0,0,0,0);clip-path:inset(50%);white-space:nowrap;border:0";
    d.body.appendChild(live);
    return live;
  }
  function init(root) {
    root = root && root.nodeType === 1 ? root : d;
    region();
    mods.forEach(function (m) {
      var list = [].slice.call(root.querySelectorAll(m.sel));
      if (root !== d && root.matches(m.sel)) list.unshift(root);
      list.forEach(function (el) {
        if (m.seen.has(el)) return;
        m.seen.add(el);
        try { m.fn(el); } catch (e) {
          el.setAttribute("data-ch-failed", m.name);
          console.warn("chopa : module « " + m.name + " » en échec", e);
        }
      });
    });
  }
  window.chopa = {
    version: "0.1.0",
    init: init,
    use: function (name, sel, fn) { mods.push({ name: name, sel: sel, fn: fn, seen: new WeakSet() }); },
    uid: function (p) { var id; do { id = "ch-" + p + "-" + (++n); } while (d.getElementById(id)); return id; },
    live: region
  };
  function go() { init(); }
  if (d.readyState === "loading") d.addEventListener("DOMContentLoaded", go);
  else Promise.resolve().then(go);
})();
