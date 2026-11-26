// Page du mur (maquette immersive, brief 31) : choix du mode, version calme, clavier, liens des tuiles.
// Mode « mur » : la scène 3D (scene.js, chargée à la demande avec three) ; mode « grille » : la grille immobile,
// celle qu'on voit aussi sans JavaScript, en mouvement réduit, sur un écran étroit ou si la 3D CSS manque.
// Dans les deux modes, les liens de la grille restent les seuls éléments focalisables des tuiles.
const root = document.documentElement;
const reduit = matchMedia('(prefers-reduced-motion: reduce)');
const large = matchMedia('(min-width: 900px) and (min-height: 560px)');
// La 3D CSS doit exister, et WebGL aussi : il ne dessine rien, mais son absence signale une composition logicielle,
// trop lente pour 72 calques 3D (indice posé par le script de <head>, recalculé ici s'il manque).
const webgl = typeof window.__imWebgl === 'boolean' ? window.__imWebgl : (() => {
  try { const c = document.createElement('canvas'); return Boolean(c.getContext('webgl') || c.getContext('experimental-webgl')); } catch (_) { return false; }
})();
const support3d = Boolean(window.CSS && CSS.supports('transform-style', 'preserve-3d')) && webgl;
const CLE = 'im-calme';
const lireCalme = () => { try { return localStorage.getItem(CLE) === '1'; } catch (_) { return false; } };
const ecrireCalme = (v) => { try { localStorage.setItem(CLE, v ? '1' : '0'); } catch (_) {} };

const tuiles = [...document.querySelectorAll('.im-pieces .im-tuile')];
const liens = tuiles.map((t) => t.querySelector('.im-tuile__lien'));
const familles = [...document.querySelectorAll('.im-pieces .im-famille')];
const navLiens = [...document.querySelectorAll('.im-familles__lien')];
const calmeBtn = document.querySelector('[data-im-calme]');
const calmeBoite = document.querySelector('[data-im-calme-boite]');

const etat = { mode: 'grille', phase: 'libre', images: 0, famille: null, erreur: '' };
window.__imMur = etat; // lu par outils/mesurer.mjs
let mur = null;
let chargement = null;

function modeVoulu() { return !reduit.matches && large.matches && support3d && !lireCalme() ? 'mur' : 'grille'; }

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
      });
      // Accès de mesure (outils/mesurer.mjs) : position de la caméra et plongée sans navigation.
      etat.cam = mur.cam;
      etat.plonger = (i, naviguer) => mur.plonger(i, naviguer);
      return mur;
    });
  }
  return chargement;
}

async function appliquer() {
  const m = modeVoulu();
  calmeBoite.hidden = reduit.matches || !large.matches || !support3d;
  calmeBtn.setAttribute('aria-pressed', lireCalme() ? 'true' : 'false');
  if (m === 'mur') {
    root.classList.add('im-mur');
    try {
      await chargerScene();
    } catch (e) {
      etat.erreur = String(e && e.message || e);
      root.classList.remove('im-mur');
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

calmeBtn.addEventListener('click', () => { ecrireCalme(!lireCalme()); appliquer(); });
reduit.addEventListener('change', appliquer);
large.addEventListener('change', appliquer);
addEventListener('pageshow', (e) => {
  // Retour arrière depuis le cache : la caméra était plongée dans une tuile, elle en ressort.
  if (e.persisted && mur && etat.mode === 'mur' && etat.phase !== 'libre') {
    const slug = (() => { try { return sessionStorage.getItem('im-plongee'); } catch (_) { return null; } })();
    const i = tuiles.findIndex((t) => t.dataset.slug === slug);
    if (i >= 0) mur.sortir(i); else etat.phase = 'libre';
  }
});

appliquer();
