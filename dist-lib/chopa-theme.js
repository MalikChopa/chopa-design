/* Bascule de thème Chopa (facultatif). À charger dans <head>, sans defer, pour éviter l'éclair du mauvais thème.
   Choix mémorisé dans localStorage sous la clé "ch-theme". Boutons : [data-ch-theme-set="sombre|clair|chaud"]. */
(function () {
  var KEY = "ch-theme", THEMES = ["sombre", "clair", "chaud"], root = document.documentElement;
  function get() { try { return localStorage.getItem(KEY); } catch (e) { return null; } }
  function apply(t) {
    if (THEMES.indexOf(t) < 0) return;
    root.setAttribute("data-ch-theme", t);
    document.querySelectorAll("[data-ch-theme-set]").forEach(function (b) {
      b.setAttribute("aria-pressed", b.getAttribute("data-ch-theme-set") === t ? "true" : "false");
    });
  }
  /* Si chopa.js est déjà déclaré dans <head> (avant ce script), on pose ch-js tout de suite : les règles « .ch-js » masquent
     les panneaux inactifs sans saut de mise en page. Le onerror de la balise la retire si le fichier ne charge pas. */
  if (document.querySelector('script[src*="chopa.js"]')) root.classList.add("ch-js");
  window.chTheme = { set: function (t) { apply(t); try { localStorage.setItem(KEY, t); } catch (e) {} } };
  apply(get());
  document.addEventListener("DOMContentLoaded", function () {
    apply(root.getAttribute("data-ch-theme"));
    document.addEventListener("click", function (e) {
      var b = e.target.closest && e.target.closest("[data-ch-theme-set]");
      if (b) window.chTheme.set(b.getAttribute("data-ch-theme-set"));
    });
  });
})();
