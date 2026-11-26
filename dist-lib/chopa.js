/*! Chopa Design v0.1.0 · chopa.js (facultatif) */
/* --- chopa/00-core.js --- */
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

/* --- chopa/copy.js --- */
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

/* --- chopa/dialog.js --- */
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

/* --- chopa/dropdown.js --- */
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

/* --- chopa/menu.js --- */
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

/* --- chopa/range.js --- */
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

/* --- chopa/sort.js --- */
/* sort : data-ch-sort ; <button> dans chaque th de thead (sauf data-ch-nosort), aria-sort sur le seul th trié, colonnes ch-table__num en ordre numérique */
(function () {
  var d = document, base = ((d.currentScript || {}).src || "").replace(/[^/]*$/, "chopa-icons.svg");
  function num(s) {
    var m = String(s).replace(/[\s  ]/g, "").replace(",", ".").replace("−", "-").match(/[-+]?\d+(\.\d+)?/);
    return m ? parseFloat(m[0]) : NaN;
  }
  chopa.use("sort", "[data-ch-sort]", function (t) {
    var head = t.tHead.rows[t.tHead.rows.length - 1], icons = t.getAttribute("data-ch-icons") || base;
    function sort(th, b, n) {
      var tb = t.tBodies[0], i = th.cellIndex, dir = th.getAttribute("aria-sort") === "ascending" ? -1 : 1,
        rows = [].map.call(tb.rows, function (r, k) {
          var v = r.cells[i].getAttribute("data-ch-value");
          if (v === null) v = r.cells[i].textContent;
          return { r: r, k: k, v: n ? num(v) : v.trim() };
        });
      rows.sort(function (x, y) {
        var c, a = x.v, z = y.v;
        if (n) c = a !== a || z !== z ? (a !== a ? (z !== z ? 0 : 1) : -1) * dir : (a - z) * dir;
        else c = a.localeCompare(z, d.documentElement.lang || undefined, { numeric: true, sensitivity: "base" }) * dir;
        return c || x.k - y.k;
      });
      rows.forEach(function (o) { tb.appendChild(o.r); });
      [].forEach.call(head.cells, function (h) { h.removeAttribute("aria-sort"); });
      th.setAttribute("aria-sort", dir > 0 ? "ascending" : "descending");
      chopa.live().textContent = "Trié par " + b.textContent.trim() + ", ordre " + (dir > 0 ? "croissant" : "décroissant");
    }
    [].forEach.call(head.cells, function (th) {
      if (th.hasAttribute("data-ch-nosort")) return;
      var b = d.createElement("button"), n = th.classList.contains("ch-table__num");
      b.type = "button"; b.className = "ch-table__sort";
      while (th.firstChild) b.appendChild(th.firstChild);
      b.insertAdjacentHTML("beforeend", '<svg class="ch-icon" aria-hidden="true" focusable="false"><use href="' + icons + '#ch-i-sort"></use></svg>');
      th.appendChild(b);
      b.addEventListener("click", function () { sort(th, b, n); });
    });
  });
})();

/* --- chopa/tabs.js --- */
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

/* --- chopa/toast.js --- */
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

/* --- chopa/toc.js --- */
/* Module toc : data-ch-toc. aria-current="true" sur le lien de la section en vue (IntersectionObserver). */
(function () {
  function toc(el) {
    var map = [], io, wait;
    [].slice.call(el.querySelectorAll('a[href^="#"]')).forEach(function (a) {
      var t = document.getElementById(decodeURIComponent(a.getAttribute("href").slice(1)));
      if (t) map.push([a, t]);
    });
    if (!map.length || !("IntersectionObserver" in window)) return;
    function update() {
      var line = innerHeight * 0.15, cur = map[0];
      wait = 0;
      map.forEach(function (m) { if (m[1].getBoundingClientRect().top <= line) cur = m; });
      map.forEach(function (m) {
        if (m === cur) m[0].setAttribute("aria-current", "true"); else m[0].removeAttribute("aria-current");
      });
    }
    /* Bande des 15 % du haut : un titre qui y entre ou en sort relance le calcul ; le défilement brusque aussi. */
    io = new IntersectionObserver(update, { rootMargin: "0px 0px -85% 0px" });
    map.forEach(function (m) { io.observe(m[1]); });
    addEventListener("scroll", function () { if (!wait) wait = requestAnimationFrame(update); }, { passive: true });
    update();
  }
  chopa.use("toc", "[data-ch-toc]", toc);
})();

/* --- chopa/tooltip.js --- */
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
