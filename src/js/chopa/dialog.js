/* dialog : data-ch-dialog-open="#id" ouvre la fenêtre modale (showModal), data-ch-dialog-close la ferme. Focus rendu à l'ouvreur,
   clic sur le fond, défilement du fond verrouillé (classe ch-scroll-lock), Tab bouclé dans la fenêtre. */
(function () {
  var d = document, wired = new WeakSet(), from = new WeakMap(),
    FOCUS = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),summary,[tabindex]:not([tabindex="-1"])';
  function items(dlg) {
    return [].slice.call(dlg.querySelectorAll(FOCUS)).filter(function (e) { return e.getClientRects().length && getComputedStyle(e).visibility !== "hidden"; });
  }
  function lock() { d.documentElement.classList.toggle("ch-scroll-lock", !!d.querySelector("dialog:modal")); }
  function wire(dlg) {
    var down;
    if (wired.has(dlg)) return;
    wired.add(dlg);
    function out(e) {
      var r = dlg.getBoundingClientRect();
      return e.target === dlg && (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom);
    }
    dlg.addEventListener("mousedown", function (e) { down = out(e); });
    dlg.addEventListener("click", function (e) {
      if ((down && out(e)) || e.target.closest("[data-ch-dialog-close]")) dlg.close();
    });
    dlg.addEventListener("keydown", function (e) {
      var l = items(dlg), i = l.indexOf(d.activeElement), s = e.shiftKey;
      if (e.key === "Tab" && l.length && (s ? i <= 0 : i === l.length - 1)) { e.preventDefault(); l[s ? l.length - 1 : 0].focus(); }
    });
    dlg.addEventListener("close", function () {
      var o = from.get(dlg);
      lock();
      if (o && o.isConnected) o.focus();
    });
  }
  chopa.use("dialog", "[data-ch-dialog-open]", function (b) {
    var dlg = d.querySelector(b.getAttribute("data-ch-dialog-open"));
    try {
      if (!dlg || !dlg.showModal) throw new Error("fenêtre introuvable, ou <dialog> non pris en charge");
      wire(dlg);
    } catch (e) { if (dlg) dlg.setAttribute("data-ch-failed", "dialog"); throw e; }
    b.setAttribute("aria-haspopup", "dialog");
    b.addEventListener("click", function () {
      var l, t;
      if (dlg.open) return;
      from.set(dlg, b);
      dlg.showModal();
      lock();
      l = items(dlg);
      t = dlg.querySelector("[autofocus]") || l.filter(function (e) { return e.className.indexOf("__close") < 0; })[0] || l[0];
      if (t) t.focus();
    });
  });
})();
