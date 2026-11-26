/* toast : chopa.toast(texte, {type, delai, action:{texte,fn}}) ; data-ch-toast[-type|-delai|-action] sur un déclencheur. Info et attention : écrites dans chopa.live() ; erreur : role=alert. */
(function () {
  var d = document, S = d.currentScript, stack, lt, K = { info: ["Info", "info"], warn: ["Attention", "alert"], error: ["Erreur", "alert"] };
  function ico(n) { return '<svg class="ch-icon" aria-hidden="true"><use href="' + (chopa.icons || (S ? S.src.replace(/[^\/]*$/, "") : "") + "chopa-icons.svg") + "#ch-i-" + n + '"></use></svg>'; }
  function toast(texte, o, from) {
    if (!texte) return;
    o = o || {};
    var k = K[o.type] ? o.type : "info", a = o.action, ax = a && a.texte, delay = o.delai != null ? +o.delai : k == "error" ? 0 : 6000,
      t = d.createElement("div"), th = from && from.closest("[data-ch-theme]"), hov, foc, back, timer, live, x, ab;
    t.className = "ch-toast ch-toast--" + k;
    t.innerHTML = ico(K[k][1]) + '<div class="ch-toast__body"><b class="ch-toast__kind">' + K[k][0] + '</b><span class="ch-toast__text"></span></div>'
      + (ax ? '<button class="ch-btn ch-btn--secondary ch-toast__action" type="button"></button>' : "")
      + '<button class="ch-btn ch-btn--icon ch-btn--ghost ch-toast__close" type="button" aria-label="Fermer la notification">' + ico("close") + "</button>";
    t.querySelector(".ch-toast__text").textContent = texte;
    if (k == "error") t.setAttribute("role", "alert");
    if (th) t.setAttribute("data-ch-theme", th.getAttribute("data-ch-theme"));
    x = t.querySelector(".ch-toast__close"); x.onclick = close;
    if (ax) {
      ab = t.querySelector(".ch-toast__action"); ab.textContent = ax;
      ab.onclick = function (e) {
        if (a.fn) a.fn(e);
        if (from) from.dispatchEvent(new CustomEvent("ch-toast-action", { bubbles: true }));
        close();
      };
    }
    function arm() { clearTimeout(timer); if (delay > 0 && !ax && !hov && !foc) timer = setTimeout(close, delay); }
    function close() {
      var r = back && back.isConnected ? back : from && from.isConnected ? from : 0, had = t.contains(d.activeElement);
      clearTimeout(timer); t.remove();
      if (had && r) r.focus();
    }
    t.onmouseenter = function () { hov = 1; arm(); };
    t.onmouseleave = function () { hov = 0; arm(); };
    t.addEventListener("focusin", function (e) { foc = 1; if (e.relatedTarget && !t.contains(e.relatedTarget)) back = e.relatedTarget; arm(); });
    t.addEventListener("focusout", function (e) { if (!t.contains(e.relatedTarget)) { foc = 0; arm(); } });
    t.onkeydown = function (e) { if (e.key == "Escape") { e.preventDefault(); close(); } };
    if (!stack || !stack.isConnected) { d.body.appendChild(stack = d.createElement("div")); stack.className = "ch-toast-stack"; stack.setAttribute("role", "region"); stack.setAttribute("aria-label", "Notifications"); }
    stack.appendChild(t);
    if (k != "error") {
      live = chopa.live(); clearTimeout(lt); live.textContent = "";
      lt = setTimeout(function () { live.textContent = texte + (ax ? " (action : " + ax + ")" : ""); }, 60);
    }
    arm();
    return t;
  }
  chopa.toast = toast;
  chopa.use("toast", "[data-ch-toast]", function (e) {
    var A = function (n) { return e.getAttribute("data-ch-toast-" + n); }, ac = A("action");
    e.addEventListener("click", function () { toast(e.getAttribute("data-ch-toast"), { type: A("type"), delai: A("delai"), action: ac && { texte: ac } }, e); });
  });
})();
