// Page du mur (I2, docs/ARCHITECTURE.md §16.5 M10, §16.6 M13 et M14). Repris de la maquette immersive (mur.js), adapté à la doc.
// Mode « mur » : la scène 3D (scene.js, chargée à la demande avec three) ; mode « grille » : la grille immobile, celle qu'on voit
// aussi sans JavaScript, en mouvement réduit, en version calme, sur un écran étroit, si la 3D CSS ou WebGL manquent, si le module
// ne se charge pas, ou si l'affichage est trop lent. Dans les deux modes, les liens de la grille restent les seuls éléments
// focalisables des tuiles ; en mode mur l'introduction est « inert ».
const root = document.documentElement;
const reduit = matchMedia('(prefers-reduced-motion: reduce)');
const large = matchMedia('(min-width: 900px) and (min-height: 560px)');
// La 3D CSS doit exister, et WebGL aussi (indice d'accélération posé par mode.js, recalculé ici s'il manque).
const webgl = typeof window.__imWebgl === 'boolean' ? window.__imWebgl : (() => {
  try { const c = document.createElement('canvas'); return Boolean(c.getContext('webgl') || c.getContext('experimental-webgl')); } catch (_) { return false; }
})();
const support3d = Boolean(window.CSS && CSS.supports('transform-style', 'preserve-3d')) && webgl;
const CLE_LENT = 'doc-mur-lent';
const lent = () => { try { return sessionStorage.getItem(CLE_LENT) === '1'; } catch (_) { return false; } };
// im-calme (tete.js) = version calme choisie, ou mouvement réduit.
const calme = () => root.classList.contains('im-calme');

const tuiles = [...document.querySelectorAll('.im-pieces .im-tuile')];
const liens = tuiles.map((t) => t.querySelector('.im-tuile__lien'));
const familles = [...document.querySelectorAll('.im-pieces .im-famille')];
const navLiens = [...document.querySelectorAll('.im-ancres__lien')];
const intro = document.querySelector('[data-im-intro]');
const statut = document.querySelector('[data-im-statut]');

const etat = { mode: 'grille', phase: 'libre', images: 0, famille: null, erreur: '' };
window.__imMur = etat; // lu par le filet de mode.js et par le banc
let mur = null;
let chargement = null;

function modeVoulu() { return !reduit.matches && large.matches && support3d && !calme() && !lent() ? 'mur' : 'grille'; }
// L'introduction est « inert » tant que le mur occupe l'écran (elle est hors de la vue) ; le h1 est en dehors.
const synchroniserIntro = () => { if (intro) intro.inert = root.classList.contains('im-mur'); };

async function chargerScene() {
  if (mur) return mur;
  if (!chargement) {
    chargement = import('./scene.js').then(({ creerScene }) => {
      mur = creerScene({
        tuiles, liens, familles, navLiens, etat,
        racine: document.querySelector('.im-scene'),
        conteneur: document.querySelector('.im-scene__3d'),
        canevas: document.querySelector('.im-scene__fond'),
        defile: document.querySelector('.im-defile'),
        jauge: document.querySelector('.im-jauge__barre'),
        surLent: () => {
          // Garde de lenteur (M14) : retour à la grille pour la session, et message dans la région role="status".
          try { sessionStorage.setItem(CLE_LENT, '1'); } catch (_) { /* stockage refusé : la grille revient quand même */ }
          if (statut) statut.textContent = 'Version calme : l\'affichage était trop lent.';
          etat.lent = true;
          appliquer();
        },
      });
      // Accès de mesure du banc : position de la caméra et plongée sans navigation.
      etat.cam = mur.cam;
      etat.plonger = (i, naviguer) => mur.plonger(i, naviguer);
      return mur;
    });
  }
  return chargement;
}

async function appliquer() {
  const m = modeVoulu();
  if (m === 'mur') {
    root.classList.add('im-mur');
    synchroniserIntro();
    try {
      await chargerScene();
    } catch (e) {
      etat.erreur = String(e && e.message || e);
      root.classList.remove('im-mur');
      synchroniserIntro();
      etat.mode = 'grille';
      return;
    }
    if (modeVoulu() !== 'mur') return appliquer();
    const avant = etat.mode;
    etat.mode = 'mur';
    mur.demarrer();
    if (avant !== 'mur') entree();
  } else {
    const avant = etat.mode;
    if (mur) mur.arreter();
    root.classList.remove('im-mur');
    synchroniserIntro();
    navLiens.forEach((a) => a.removeAttribute('aria-current'));
    etat.mode = 'grille';
    etat.famille = null;
    if (avant === 'mur') scrollTo(0, 0);
  }
}

// Arrivée sur le mur : depuis une page de pièce (#p-<slug>), la caméra sort de la même tuile.
let premiereEntree = true;
function entree() {
  const i = premiereEntree ? tuiles.findIndex((t) => `#${t.id}` === location.hash) : -1;
  premiereEntree = false;
  if (i >= 0) mur.sortir(i);
  else scrollTo(0, 0);
}

// ---------- Liens des tuiles : en mode mur, Entrée ou clic font plonger la caméra avant d'ouvrir la page ----------
liens.forEach((a, i) => {
  a.addEventListener('click', (e) => {
    if (etat.mode !== 'mur' || !mur || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    mur.plonger(i);
  });
  a.addEventListener('focus', () => { if (etat.mode === 'mur' && mur) mur.suivre(i); });
  a.addEventListener('blur', () => { if (etat.mode === 'mur' && mur) mur.lacher(i); });
});

navLiens.forEach((a, gi) => {
  a.addEventListener('click', (e) => {
    if (etat.mode !== 'mur' || !mur) return;
    e.preventDefault();
    mur.allerFamille(gi);
  });
});

// ---------- Flèches : tuile voisine (dans le mur : positions 3D ; dans la grille : positions à l'écran) ----------
function centre(i) {
  if (etat.mode === 'mur' && mur) { const p = mur.pos[i]; return { x: p.x, y: -p.y }; }
  const r = tuiles[i].getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
}
function voisin(i, dir) {
  const c = centre(i);
  let best = -1, score = Infinity;
  for (let j = 0; j < tuiles.length; j++) {
    if (j === i) continue;
    const p = centre(j);
    const dx = p.x - c.x, dy = p.y - c.y;
    const along = dir === 'ArrowRight' ? dx : dir === 'ArrowLeft' ? -dx : dir === 'ArrowDown' ? dy : -dy;
    const ortho = dir === 'ArrowRight' || dir === 'ArrowLeft' ? Math.abs(dy) : Math.abs(dx);
    if (along < 4) continue;
    const s = along + ortho * 2.5;
    if (s < score) { score = s; best = j; }
  }
  return best;
}
document.querySelector('.im-pieces').addEventListener('keydown', (e) => {
  if (!['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp'].includes(e.key) || e.altKey || e.metaKey || e.ctrlKey) return;
  const i = liens.indexOf(document.activeElement);
  if (i < 0) return;
  const j = voisin(i, e.key);
  e.preventDefault();
  if (j >= 0) liens[j].focus({ preventScroll: etat.mode === 'mur' });
});

// La version calme (calme.js) et le mouvement réduit (tete.js) préviennent par « im-calme » ; tete.js a déjà posé la classe.
addEventListener('im-calme', appliquer);
large.addEventListener('change', appliquer);
addEventListener('pageshow', (e) => {
  // Retour arrière depuis le cache : la caméra était plongée dans une tuile, elle en ressort.
  if (e.persisted && mur && etat.mode === 'mur' && etat.phase !== 'libre') {
    const slug = (() => { try { return sessionStorage.getItem('im-plongee'); } catch (_) { return null; } })();
    const i = tuiles.findIndex((t) => t.dataset.slug === slug);
    if (i >= 0) mur.sortir(i); else etat.phase = 'libre';
  }
});

synchroniserIntro();
appliquer();
