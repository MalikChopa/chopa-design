// Code navigateur de la page /theme/ (J1c). Aucun calcul de couleur ici : tout vient de maker.mjs, le même module que
// scripts/static/theme-maker.mjs. Ce fichier ne fait que lire les champs, écrire dans le DOM (textContent : jamais de
// innerHTML avec une valeur saisie) et poser la feuille d'aperçu, limitée à .doc-tm-frame.
import { parseInputs, makeTheme, previewCss, MIN_TEXT } from './maker.mjs';
import { addPieces } from './preview.mjs';

const f2 = (n) => n.toFixed(2).replace('.', ',');
const fr = (s) => String(s).replace(/(\d)\.(\d)/g, '$1,$2');
const $ = (sel, root = document) => root.querySelector(sel);

export function init() {
  const baseEl = $('#doc-tm-base');
  if (!baseEl) return;
  addPieces(document); // J2b : 6 composants dans l'aperçu (bouton, bouton icône, groupe, champ, liste, recherche)
  const base = JSON.parse(baseEl.textContent);
  const fields = Object.fromEntries(['acc', 'radius', 'sans', 'display', 'mono'].map((k) => [k, $(`#doc-tm-${k}`)]));
  const verdict = $('#doc-tm-verdict'), verdictText = $('#doc-tm-verdict-text'), verdictList = $('#doc-tm-verdict-list');
  const out = $('#doc-tm-out'), copyBtn = $('#doc-tm-copy'), copyStatus = $('#doc-tm-copy-status');
  const assumed = $('#doc-tm-assumed');
  const settingsBody = $('#doc-tm-settings');
  const sheet = document.createElement('style');
  sheet.id = 'doc-tm-live';
  document.head.appendChild(sheet);
  const EMPTY = 'Aucune sortie : corrige d\'abord les réglages signalés.';
  let lastCss = null, lastVerdict = '';

  const el = (tag, text, cls) => { const e = document.createElement(tag); if (text !== undefined) e.textContent = text; if (cls) e.className = cls; return e; };

  function setVerdict(refus, text, items) {
    const key = refus + '|' + text + '|' + items.join('|');
    verdict.classList.toggle('doc-tm-verdict--refus', refus);
    if (key === lastVerdict) return;
    lastVerdict = key;
    verdictText.textContent = text;
    verdictList.replaceChildren(...items.map((t) => el('li', t)));
    verdictList.hidden = items.length === 0;
  }

  function showOutput(css) {
    lastCss = css;
    out.textContent = css ?? EMPTY;
    out.classList.toggle('doc-tm-pre--vide', css === null);
    copyBtn.disabled = css === null;
    copyStatus.textContent = '';
  }

  function renderSettings(r) {
    settingsBody.replaceChildren(...r.themes.map((t) => {
      const tr = document.createElement('tr');
      const th = el('th', t.theme); th.scope = 'row';
      const accText = el('td'); accText.append(el('code', t.accText.hex), ` : ${f2(t.accText.ratio)} : 1 au pire sur bg, bg2, card${t.accText.refused ? ' (REFUSÉ)' : t.accText.moved ? ' (éclairci ou assombri depuis l\'accent)' : ' (accent gardé tel quel)'}`);
      const on = el('td'); on.append(el('code', r.onAcc.hex), ` : ${f2(r.onAcc.ratio)} : 1 sur l'accent`);
      const dim = el('td'); dim.append(el('code', `${fr(t.dim.pct)} %`), t.dim.pct < t.defaultPct ? ` : corrigé, ${fr(t.defaultPct)} % par défaut ; pire paire ${t.dim.worst.pair} à ${f2(t.dim.worst.ratio)}` : ` : valeur par défaut ; pire paire ${t.dim.worst.pair} à ${f2(t.dim.worst.ratio)}`);
      tr.append(th, accText, on, dim);
      return tr;
    }));
  }

  function renderPairs(r) {
    for (const t of r.themes) {
      const body = $(`[data-tm-pairs="${t.theme}"]`), sum = $(`[data-tm-summary="${t.theme}"]`);
      const texts = t.pairs.filter((p) => p.kind === 'text');
      const worst = texts.reduce((a, b) => (b.ratio < a.ratio ? b : a));
      sum.textContent = `Thème ${t.theme} : ${t.pairs.length} paires, ${t.bad.length} sous le seuil, pire texte ${f2(worst.ratio)} : 1`;
      body.replaceChildren(...t.pairs.map((p) => {
        const tr = document.createElement('tr');
        tr.append(el('td', p.id), el('td', `${f2(p.ratio)} : 1`), el('td', `${String(p.min).replace('.', ',')} : 1`), el('td', p.ratio >= p.min ? 'réussi' : 'échec'));
        return tr;
      }));
    }
  }

  function update() {
    const p = parseInputs(Object.fromEntries(Object.entries(fields).map(([k, e]) => [k, e.value])));
    for (const [k, e] of Object.entries(fields)) {
      const err = $(`#doc-tm-err-${k}`);
      const msg = p.errors[k];
      e.setAttribute('aria-invalid', msg ? 'true' : 'false');
      err.textContent = msg ?? '';
      err.hidden = !msg;
    }
    if (!p.ok) {
      setVerdict(true, 'Réglages incomplets : corrige les champs signalés. L\'aperçu garde les dernières valeurs valides.', []);
      showOutput(null);
      assumed.hidden = true;
      return;
    }
    const r = makeTheme(p.values, base);
    sheet.textContent = previewCss(p.values, r);
    renderSettings(r);
    renderPairs(r);
    assumed.hidden = p.values.radius === '0';
    if (r.ok) {
      const n = r.themes.reduce((s, t) => s + t.pairs.length, 0);
      setVerdict(false, `Accent ${p.values.acc} accepté : les ${n} paires autorisées des 3 thèmes atteignent leur seuil (${String(MIN_TEXT).replace('.', ',')} : 1 pour le texte, 3 : 1 pour le focus).`, []);
    } else {
      setVerdict(true, `Accent ${p.values.acc} refusé : aucune sortie n'est proposée. Paire en cause :`, r.refused.map((x) => `${x.pair} = ${f2(x.ratio)} : 1 (${fr(x.raison)}).`));
    }
    showOutput(r.css);
  }

  for (const e of Object.values(fields)) e.addEventListener('input', update);

  // Raccourcis : accents d'essai et retour aux valeurs de chopa.css.
  document.addEventListener('click', (ev) => {
    const b = ev.target.closest && ev.target.closest('[data-tm-acc]');
    if (b) { fields.acc.value = b.getAttribute('data-tm-acc'); update(); fields.acc.focus(); }
  });
  $('#doc-tm-reset').addEventListener('click', () => {
    for (const [k, e] of Object.entries(fields)) e.value = base.defaults[k];
    update();
  });

  // Copier : presse-papiers, sinon sélection du texte pour Ctrl/Cmd + C.
  copyBtn.addEventListener('click', async () => {
    if (lastCss === null) return;
    try {
      await navigator.clipboard.writeText(lastCss);
      copyStatus.textContent = 'Copié dans le presse-papiers.';
    } catch (e) {
      const range = document.createRange();
      range.selectNodeContents(out);
      const sel = window.getSelection();
      sel.removeAllRanges(); sel.addRange(range);
      let ok = false;
      try { ok = document.execCommand('copy'); } catch (e2) { ok = false; }
      copyStatus.textContent = ok ? 'Copié (méthode de repli).' : 'Le navigateur refuse la copie : le texte est sélectionné, copie-le avec Ctrl + C (Cmd + C sur Mac).';
    }
  });

  update();
}
