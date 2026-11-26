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
