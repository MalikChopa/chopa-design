/* copy : data-ch-copy ; bouton « Copier » = texte exact du <code> ; refus : code sélectionné */
(function () {
  var d = document, base = ((d.currentScript || {}).src || "").replace(/[^/]*$/, "chopa-icons.svg"), n = 0;
  chopa.use("copy", "[data-ch-copy]", function (el) {
    var pre = el.querySelector("pre"), code = pre.querySelector("code") || pre,
      bar = d.createElement("div"), b = d.createElement("button"), s = d.createElement("span"), t;
    bar.className = "ch-code__bar"; b.className = "ch-code__copy"; b.type = "button"; s.textContent = "Copier";
    b.innerHTML = '<svg class="ch-icon" aria-hidden="true" focusable="false"><use href="' + (el.getAttribute("data-ch-icons") || base) + '#ch-i-copy"></use></svg>';
    b.appendChild(s); bar.appendChild(b); el.insertBefore(bar, el.firstChild);
    function say(label, state, msg) {
      clearTimeout(t);
      s.textContent = label; b.setAttribute("data-ch-state", state);
      chopa.live().textContent = msg + (++n % 2 ? "" : " ");
      t = setTimeout(function () { s.textContent = "Copier"; b.removeAttribute("data-ch-state"); }, 2500);
    }
    b.addEventListener("click", function () {
      Promise.resolve().then(function () { return navigator.clipboard.writeText(code.textContent); }).then(
        function () { say("Copié", "ok", "Code copié."); },
        function () {
          var r = d.createRange(), g = getSelection();
          r.selectNodeContents(code); g.removeAllRanges(); g.addRange(r);
          say("Ctrl+C ou ⌘C", "manual", "Copie impossible : le code est sélectionné, Ctrl+C (⌘C sur Mac) pour le copier.");
        });
    });
    el.setAttribute("data-ch-ready", "");
  });
})();
