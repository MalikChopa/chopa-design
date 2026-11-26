/* dropdown : data-ch-dropdown (actions) ou ="navigation" (Disclosure) ; sans popover natif : repli par hidden */
(function () {
  var native = "popover" in HTMLElement.prototype;
  function dropdown(el) {
    var b = el.querySelector("[popovertarget]"),
      p = b && document.getElementById(b.getAttribute("popovertarget")),
      nav = el.getAttribute("data-ch-dropdown") === "navigation";
    if (!p) throw new Error("bouton ou panneau introuvable");
    function items() { return [].slice.call(p.querySelectorAll("a[href],button:not([disabled])")); }
    function opened() { return native ? p.matches(":popover-open") : !p.hidden; }
    function sync(o) {
      b.setAttribute("aria-expanded", o);
      if (!o) return;
      place();
      if (!nav && items()[0]) items()[0].focus();
    }
    function close() { b.setAttribute("aria-expanded", "false"); if (native) p.hidePopover(); else p.hidden = true; }
    function place(force) {
      if (!native || !(force === true || opened())) return;
      var r = b.getBoundingClientRect(), w = p.offsetWidth, h = p.offsetHeight, t = r.bottom + 4;
      if (t + h > innerHeight - 8 && r.top - h - 4 >= 8) t = r.top - h - 4;
      p.setAttribute("data-ch-placed", "");
      p.style.top = Math.max(8, t) + "px";
      p.style.left = Math.max(8, Math.min(r.left, innerWidth - w - 8)) + "px";
    }
    b.id = b.id || chopa.uid("dd");
    b.setAttribute("aria-expanded", "false");
    if (!nav) {
      b.setAttribute("aria-haspopup", "menu");
      p.setAttribute("role", "menu");
      p.setAttribute("aria-labelledby", b.id);
      items().forEach(function (i) { i.setAttribute("role", "menuitem"); i.tabIndex = -1; });
    }
    if (native) {
      p.addEventListener("beforetoggle", function (e) { if (e.newState === "open") place(true); });
      p.addEventListener("toggle", function (e) { sync(e.newState === "open"); });
      addEventListener("resize", function () { place(); });
      addEventListener("scroll", function () { place(); }, true);
    } else {
      p.hidden = true;
      p.setAttribute("data-ch-fallback", "");
      b.addEventListener("click", function () { p.hidden = !p.hidden; sync(!p.hidden); });
      document.addEventListener("click", function (e) { if (!p.hidden && !el.contains(e.target)) close(); });
    }
    el.addEventListener("keydown", function (e) { if (e.key === "Escape" && opened()) { close(); b.focus(); } });
    p.addEventListener("click", function (e) { if (!nav && e.target.closest("button,a")) { close(); b.focus(); } });
    p.addEventListener("keydown", function (e) {
      var k = e.key, l = items(), c = l.length, i = l.indexOf(document.activeElement), j;
      if (nav) return;
      if (k === "Tab") { close(); b.focus(); return; }
      j = k === "ArrowDown" ? (i + 1) % c : k === "ArrowUp" ? (i + c - 1) % c : k === "Home" ? 0 : k === "End" ? c - 1 : -1;
      if (j < 0) return;
      e.preventDefault();
      l[j].focus();
    });
  }
  chopa.use("dropdown", "[data-ch-dropdown]", dropdown);
})();
