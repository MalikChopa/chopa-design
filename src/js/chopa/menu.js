/* Module menu : data-ch-menu, menu téléphone de ch-header (Disclosure Navigation, sans role=menu). */
(function () {
  function menu(el) {
    var b = el.querySelector("button[aria-expanded]"),
      nav = (b && document.getElementById(b.getAttribute("aria-controls"))) || el.querySelector(".ch-nav");
    if (!b || !nav) throw new Error("bouton ou navigation introuvable");
    nav.id = nav.id || chopa.uid("nav");
    b.setAttribute("aria-controls", nav.id);
    function set(o) { b.setAttribute("aria-expanded", o); }
    set(b.getAttribute("aria-expanded") === "true");
    if (!nav.querySelector("[aria-current]")) {
      [].slice.call(nav.querySelectorAll("a[href]")).some(function (a) {
        if (a.getAttribute("href").charAt(0) === "#" || a.href.split("#")[0] !== location.href.split("#")[0]) return false;
        a.setAttribute("aria-current", "page");
        return true;
      });
    }
    b.addEventListener("click", function () { set(b.getAttribute("aria-expanded") !== "true"); });
    /* Échap : depuis l'en-tête, ou depuis la page si le clic n'a pas donné le focus au bouton (Safari). */
    document.addEventListener("keydown", function (e) {
      var a = document.activeElement;
      if (e.key !== "Escape" || b.getAttribute("aria-expanded") !== "true" || !(el.contains(a) || !a || a === document.body)) return;
      set(false); b.focus();
    });
  }
  chopa.use("menu", "[data-ch-menu]", menu);
})();
