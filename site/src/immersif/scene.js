// Scène du « Mur en orbite » (I2, docs/ARCHITECTURE.md §16.5 M11). Reprise de la maquette immersive (scene.js).
// Chargée à la demande par mur.js (import dynamique), seulement en mode mur : c'est le seul fichier qui importe three.
// Tuiles : clones décoratifs des tuiles de la grille (le calque entier est aria-hidden, aucun lien ni id ni name), placés en 3D par
// le CSS3DRenderer de three. Fond : un canevas 2D (particules carrées et sol quadrillé), projeté avec la même caméra.
// Couleurs du canevas lues dans les jetons --ch-* du thème courant : aucune autre couleur, aucun mélange.
// Ajouts à la maquette : élagage (tuile hors de la fenêtre élargie = display none, plus de calque, §16.11) et garde de
// lenteur (M14, seuils réglés à I4 : voir plus bas => surLent()).
import { Scene, PerspectiveCamera, Object3D, Vector3 } from 'three';
import { CSS3DRenderer, CSS3DObject } from 'three/examples/jsm/renderers/CSS3DRenderer.js';

const T = 260, E = 26, PAS = T + E, LIGNES = 3, ESP = 220; // tuile, écart, pas, lignes, espace entre familles
const FOV = 40, TAN = Math.tan((FOV / 2) * Math.PI / 180);
const YAW0 = -0.2, PITCH0 = 0.03;                         // inclinaison du mur vue par la caméra (radians)
const MOT_X = -1150;                                       // centre du logotype géant
const VITESSE = 0.7;                                       // pixels de défilement par unité du mur

const lisse = (v, cible, vitesse, dt) => v + (cible - v) * (1 - Math.exp(-dt * vitesse));
const borne = (v, a, b) => Math.min(b, Math.max(a, v));
const ease = (t) => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const sortie = (t) => 1 - Math.pow(1 - t, 3);

export function creerScene({ tuiles, liens, familles, racine, conteneur, canevas, defile, jauge, navLiens, etat, surLent }) {
  const root = document.documentElement;
  const renderer = new CSS3DRenderer({ element: conteneur });
  const camera = new PerspectiveCamera(FOV, innerWidth / innerHeight, 1, 14000);
  const scene = new Scene();
  const mur = new Object3D();
  mur.rotation.x = -0.03;
  scene.add(mur);
  const rig = new Object3D();
  rig.rotation.order = 'YXZ';
  mur.add(rig);
  rig.add(camera);

  // ---------- Disposition : familles de gauche à droite, 3 lignes, tuiles colonne par colonne ----------
  const pos = [];
  const blocs = [];
  let x = 0;
  const nums = familles.map((f) => f.dataset.famille);
  const noms = familles.map((f) => {
    const h = f.querySelector('.im-famille__titre');
    return [...h.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent).join(' ').replace(/\s+/g, ' ').trim();
  });
  const gOf = tuiles.map((t) => nums.indexOf(t.dataset.famille));
  familles.forEach((f, gi) => {
    const idx = tuiles.map((t, i) => (gOf[i] === gi ? i : -1)).filter((i) => i >= 0);
    const cols = Math.ceil(idx.length / LIGNES);
    blocs[gi] = { x0: x, x1: x + cols * PAS - E };
    idx.forEach((i, k) => {
      const col = Math.floor(k / LIGNES), row = k % LIGNES;
      pos[i] = { x: x + col * PAS + T / 2, y: (1 - row) * PAS - 30, gi };
    });
    x += cols * PAS - E + ESP;
  });
  const xMin = MOT_X + 200, xMax = x - ESP - T * 1.6;
  etat.pos = pos;

  // ---------- Objets ----------
  const objets = tuiles.map((t, i) => {
    const el = document.createElement('div');
    el.className = 'im-tuile3d';
    el.dataset.i = String(i);
    for (const enfant of t.children) el.appendChild(enfant.cloneNode(true));
    const a = el.querySelector('.im-tuile__lien');
    const s = document.createElement('span');
    s.className = 'im-tuile__lien';
    s.textContent = a.textContent;
    a.replaceWith(s);
    // L'aperçu du clone n'a pas la classe de la grille : la coupure des animations de tuiles.css ne s'y applique pas (mur.css).
    const ap = el.querySelector('.im-tuile__apercu');
    if (ap) ap.classList.replace('im-tuile__apercu', 'im-ap3d');
    el.querySelectorAll('[id]').forEach((n) => n.removeAttribute('id'));
    el.querySelectorAll('[name]').forEach((n) => n.removeAttribute('name'));
    const o = new CSS3DObject(el);
    o.position.set(pos[i].x, pos[i].y, 0);
    mur.add(o);
    return { o, el, lift: 0, cible: 0 };
  });

  const etiquettes = familles.map((f, gi) => {
    const el = document.createElement('div');
    el.className = 'im-etiquette';
    const b = document.createElement('b'); b.textContent = nums[gi];
    const s = document.createElement('span'); s.textContent = `${gOf.filter((g) => g === gi).length} pièces`;
    el.append(b, document.createTextNode(noms[gi]), s);
    const o = new CSS3DObject(el);
    o.position.set(blocs[gi].x0, PAS - 30 + T / 2 + 46, 0);
    mur.add(o);
    return { o, el, gi };
  });

  const mot = document.createElement('div');
  mot.className = 'im-mot';
  const lettres = [...'Chopa'].map((c) => { const s = document.createElement('span'); s.className = 'im-mot__l'; s.textContent = c; mot.appendChild(s); return { el: s, f: 0, cx: 0 }; });
  const point = document.createElement('span'); point.className = 'im-mot__point'; mot.appendChild(point);
  lettres.push({ el: point, f: 0, cx: 0 });
  const motO = new CSS3DObject(mot);
  motO.position.set(MOT_X, 90, 0);
  mur.add(motO);

  const legende = document.createElement('div');
  legende.className = 'im-legende';
  legende.textContent = `La bibliothèque de l'identité Chopa : ${tuiles.length} pièces vivantes, en ${familles.length} familles. Chaque tuile est la vraie pièce.`;
  const aide = document.createElement('span'); aide.className = 'ch-label'; aide.textContent = 'Défile pour longer le mur · clique une tuile pour plonger dedans';
  legende.appendChild(aide);
  const legO = new CSS3DObject(legende);
  mur.add(legO);

  // Placement à gauche des étiquettes et du texte : mesuré après insertion (et après le chargement des polices).
  function mesurer() {
    etiquettes.forEach((e) => { e.o.position.x = blocs[e.gi].x0 + e.el.offsetWidth / 2; });
    const lw = mot.offsetWidth;
    legO.position.set(MOT_X - lw / 2 + legende.offsetWidth / 2 + 8, -230, 0);
    lettres.forEach((l) => { l.cx = l.el.offsetLeft + l.el.offsetWidth / 2 - lw / 2; l.cy = l.el.offsetTop + l.el.offsetHeight / 2 - mot.offsetHeight / 2; });
  }

  // ---------- Fond : particules carrées et sol ----------
  const ctx = canevas.getContext('2d');
  let W = 0, H = 0, dpr = 1, focale = 1, couleurs = ['#262626', '#8c8c88', '#ff5a1f'];
  function lireCouleurs() {
    const cs = getComputedStyle(root);
    couleurs = ['--ch-line', '--ch-mute', '--ch-acc'].map((n, k) => cs.getPropertyValue(n).trim() || couleurs[k]);
  }
  lireCouleurs();
  const obs = new MutationObserver(lireCouleurs);
  obs.observe(root, { attributes: true, attributeFilter: ['data-ch-theme'] });

  let graine = 7;
  const alea = () => { graine = (graine * 16807) % 2147483647; return graine / 2147483647; };
  const N = 1100;
  const parts = new Float32Array(N * 5); // x, y, z (monde), taille, sorte
  mur.updateMatrixWorld(true);
  const v = new Vector3();
  for (let i = 0; i < N; i++) {
    const r = alea();
    v.set(xMin - 2800 + alea() * (xMax - xMin + 5600), -1800 + alea() * 3600, -4200 + alea() * 3900).applyMatrix4(mur.matrixWorld);
    parts.set([v.x, v.y, v.z, 3 + alea() * 5, r < .7 ? 0 : r < .96 ? 1 : 2], i * 5);
  }
  const SOL = -640;
  const segments = [];
  for (let z = -3600; z <= 800; z += 400) segments.push([xMin - 2800, SOL, z, xMax + 2800, SOL, z]);
  for (let gx = Math.floor((xMin - 2800) / 520) * 520; gx <= xMax + 2800; gx += 520) segments.push([gx, SOL, -3600, gx, SOL, 800]);
  const segMonde = segments.map((s) => {
    const a = new Vector3(s[0], s[1], s[2]).applyMatrix4(mur.matrixWorld), b = new Vector3(s[3], s[4], s[5]).applyMatrix4(mur.matrixWorld);
    return [a.x, a.y, a.z, b.x, b.y, b.z];
  });

  function versCamera(m, x, y, z, out) {
    out[0] = m[0] * x + m[4] * y + m[8] * z + m[12];
    out[1] = m[1] * x + m[5] * y + m[9] * z + m[13];
    out[2] = m[2] * x + m[6] * y + m[10] * z + m[14];
  }
  const ca = [0, 0, 0], cb = [0, 0, 0];
  function dessinerFond() {
    const m = camera.matrixWorldInverse.elements;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    // Sol : segments coupés au plan proche.
    ctx.strokeStyle = couleurs[0];
    ctx.lineWidth = 1;
    ctx.beginPath();
    const proche = -20;
    for (const s of segMonde) {
      versCamera(m, s[0], s[1], s[2], ca); versCamera(m, s[3], s[4], s[5], cb);
      if (ca[2] > proche && cb[2] > proche) continue;
      if (ca[2] > proche || cb[2] > proche) {
        const [p, q] = ca[2] > proche ? [ca, cb] : [cb, ca];
        const t = (proche - q[2]) / (p[2] - q[2]);
        p[0] = q[0] + (p[0] - q[0]) * t; p[1] = q[1] + (p[1] - q[1]) * t; p[2] = proche;
      }
      ctx.moveTo(W / 2 + ca[0] * focale / -ca[2], H / 2 - ca[1] * focale / -ca[2]);
      ctx.lineTo(W / 2 + cb[0] * focale / -cb[2], H / 2 - cb[1] * focale / -cb[2]);
    }
    ctx.stroke();
    // Particules : trois passes, une par couleur de jeton ; des carrés pleins, sans transparence.
    for (let sorte = 0; sorte < 3; sorte++) {
      ctx.fillStyle = couleurs[sorte];
      for (let i = 0; i < N; i++) {
        const o = i * 5;
        if (parts[o + 4] !== sorte) continue;
        versCamera(m, parts[o], parts[o + 1], parts[o + 2], ca);
        if (ca[2] > -40) continue;
        const k = focale / -ca[2];
        const sx = W / 2 + ca[0] * k, sy = H / 2 - ca[1] * k;
        if (sx < -10 || sy < -10 || sx > W + 10 || sy > H + 10) continue;
        const c = borne(parts[o + 3] * k, 1, 9);
        ctx.fillRect(Math.round(sx - c / 2), Math.round(sy - c / 2), Math.round(c), Math.round(c));
      }
    }
  }

  // ---------- Défilement = trajet le long du mur ----------
  let S = 1;
  const cibleX = () => xMin + borne(scrollY / S, 0, 1) * (xMax - xMin);
  const scrollPour = (px) => borne((px - xMin) / (xMax - xMin), 0, 1) * S;

  function redimensionner() {
    W = innerWidth; H = innerHeight;
    dpr = Math.min(2, devicePixelRatio || 1);
    canevas.width = Math.round(W * dpr); canevas.height = Math.round(H * dpr);
    renderer.setSize(W, H);
    camera.aspect = W / H;
    camera.updateProjectionMatrix();
    focale = (H / 2) / TAN;
    S = (xMax - xMin) * VITESSE;
    defile.style.height = `${Math.round(S + H)}px`;
  }

  // ---------- Caméra ----------
  const D = (T * LIGNES + E * 2 + 160) / 0.9 / (2 * TAN);  // le mur tient dans 90 % de la hauteur
  const cam = { x: xMin, y: 0, yaw: YAW0, pitch: PITCH0, d: D };
  const ptr = { x: 0, y: 0, sx: 0, sy: 0, cx: -1e4, cy: -1e4, dedans: false, dernier: 0 };
  let cibleY = 0, vitesseX = 0, prevX = cam.x, anim = null, lancer = 0, raf = 0, actif = false, dernier = 0, derive = 0;
  const couvre = () => (T / (2 * TAN * Math.max(1, W / H))) * 0.94;

  function poseLibre(t) {
    const idle = t - ptr.dernier > 2200 ? 1 : 0;
    derive = lisse(derive, idle, 1.2, 1 / 60);
    return {
      x: cam.x, y: cam.y,
      yaw: YAW0 + ptr.sx * 0.18 + derive * Math.sin(t / 3600) * 0.07,
      pitch: PITCH0 - ptr.sy * 0.1 + derive * Math.cos(t / 4300) * 0.03,
      d: D,
    };
  }

  function tween(de, vers, duree, courbe, fin) {
    anim = { de, vers, duree, courbe, fin, t0: performance.now() };
  }
  function appliquerTween(t) {
    const a = anim, k = borne((t - a.t0) / a.duree, 0, 1), e = a.courbe(k);
    cam.x = a.de.x + (a.vers.x - a.de.x) * e;
    cam.y = a.de.y + (a.vers.y - a.de.y) * e;
    cam.yaw = a.de.yaw + (a.vers.yaw - a.de.yaw) * e;
    cam.pitch = a.de.pitch + (a.vers.pitch - a.de.pitch) * e;
    cam.d = Math.exp(Math.log(a.de.d) + (Math.log(a.vers.d) - Math.log(a.de.d)) * e);
    if (k >= 1) { anim = null; a.fin && a.fin(); }
  }

  function boucle(t) {
    raf = requestAnimationFrame(boucle);
    const dt = Math.min(0.05, (t - (dernier || t)) / 1000) || 1 / 60;
    dernier = t;
    etat.images++;
    if (lancer) { scrollBy(0, lancer * dt); lancer *= Math.exp(-dt * 3.5); if (Math.abs(lancer) < 15) lancer = 0; }
    ptr.sx = lisse(ptr.sx, ptr.x, 2.6, dt);
    ptr.sy = lisse(ptr.sy, ptr.y, 2.6, dt);
    if (anim) appliquerTween(t);
    else if (etat.phase === 'libre') {
      cam.x = lisse(cam.x, cibleX(), 4.5, dt);
      cam.y = lisse(cam.y, cibleY, 3, dt);
      const p = poseLibre(t);
      cam.yaw = lisse(cam.yaw, p.yaw, 6, dt);
      cam.pitch = lisse(cam.pitch, p.pitch, 6, dt);
      cam.d = lisse(cam.d, D, 3, dt);
    }
    vitesseX = lisse(vitesseX, (cam.x - prevX) / dt, 8, dt);
    prevX = cam.x;
    rig.position.set(cam.x, cam.y, 0);
    rig.rotation.set(cam.pitch, cam.yaw, 0);
    camera.position.set(0, 0, cam.d);

    for (const ob of objets) {
      if (ob.lift === ob.cible) continue;
      ob.lift = lisse(ob.lift, ob.cible, 9, dt);
      if (Math.abs(ob.lift - ob.cible) < 0.002) ob.lift = ob.cible;
      ob.o.position.z = ob.lift * 90;
      ob.o.rotation.x = ob.lift * -0.04;
    }
    scene.updateMatrixWorld();
    elaguer();
    animerMot(t, dt);
    renderer.render(scene, camera);
    dessinerFond();
    surveiller(t);

    const prog = borne((cam.x - xMin) / (xMax - xMin), 0, 1);
    jauge.style.transform = `scaleX(${prog.toFixed(4)})`;
    let courant = 0;
    blocs.forEach((b, gi) => { if (cam.x >= b.x0 - ESP) courant = gi; });
    if (cam.x < blocs[0].x0 - 500) courant = -1;
    if (courant !== etat.famille) {
      etat.famille = courant;
      navLiens.forEach((a, gi) => { if (gi === courant) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current'); });
    }
  }

  // ---------- Élagage : une tuile hors de la fenêtre élargie n'a plus de calque (display: none) ----------
  // La fenêtre est lue après projection (|x| < MARGE en coordonnées d'écran, 1 = bord) : la perspective et le lacet sont compris.
  // Toujours gardées : la tuile survolée, la tuile focalisée, la cible d'une plongée ou d'une sortie.
  const MARGE = 1.3;
  const vp = new Vector3();
  let gardee = -1;
  function elaguer() {
    let n = 0;
    for (let i = 0; i < objets.length; i++) {
      const ob = objets[i];
      vp.copy(ob.o.position).applyMatrix4(mur.matrixWorld).project(camera);
      const garde = i === survol || i === gardee || ob.el.classList.contains('is-focus');
      const vu = garde || (Math.abs(vp.x) < MARGE && vp.z < 1);
      if (ob.o.visible !== vu) ob.o.visible = vu;
      if (vu) n++;
    }
    etat.tuilesVues = n;
  }

  // ---------- Garde de lenteur (M14), seuils réglés à I4 (docs/JOURNAL-I4.md) ----------
  // Une image est « lente » au-delà de 50 ms (moins de 20 images par seconde). Les 5 premières images ne comptent pas (mise en
  // route : polices, premier calque). Ensuite, deux règles : décision précoce dès 15 images comptées si plus des deux tiers sont
  // lentes (machine très lente : la grille revient en 2 s environ à 100 ms par image) ; décision finale à 90 images comptées si
  // plus d'un tiers sont lentes (machine juste lente). Intervalles ignorés si l'onglet est caché.
  const GARDE = { seuilMs: 50, chauffe: 5, precoce: 15, partPrecoce: 2 / 3, total: 90, partTotale: 1 / 3 };
  const garde = { vus: 0, n: 0, lents: 0, dernier: 0, fait: false };
  const surVisibilite = () => { garde.dernier = 0; };
  document.addEventListener('visibilitychange', surVisibilite);
  function surveiller(t) {
    if (garde.fait) return;
    if (garde.dernier && !document.hidden) {
      garde.vus++;
      if (garde.vus > GARDE.chauffe) {
        garde.n++;
        if (t - garde.dernier > GARDE.seuilMs) garde.lents++;
      }
    }
    garde.dernier = t;
    const precoce = garde.n >= GARDE.precoce && garde.lents > garde.n * GARDE.partPrecoce;
    const final = garde.n >= GARDE.total;
    if (!precoce && !final) return;
    garde.fait = true;
    document.removeEventListener('visibilitychange', surVisibilite);
    etat.garde = { images: garde.n, lentes: garde.lents, precoce };
    if (precoce || garde.lents > garde.n * GARDE.partTotale) surLent();
  }

  // Logotype vivant : chaque lettre se soulève vers le pointeur, la vitesse du trajet la penche et l'écarte.
  const vl = new Vector3();
  function animerMot(t, dt) {
    const m = motO.matrixWorld;
    const penche = borne(-vitesseX * 0.006, -16, 16);
    const ecart = borne(Math.abs(vitesseX) * 0.03, 0, 60);
    lettres.forEach((l, i) => {
      let f = 0;
      if (ptr.dedans && etat.phase === 'libre') {
        vl.set(l.cx, -l.cy, 0).applyMatrix4(m).project(camera);
        const sx = (vl.x + 1) / 2 * W, sy = (1 - vl.y) / 2 * H;
        const d = Math.hypot(sx - ptr.cx, sy - ptr.cy);
        f = Math.exp(-((d / 210) ** 2));
      }
      l.f = lisse(l.f, f, 7, dt);
      const souffle = Math.sin(t / 900 + i * 0.7) * 10;
      const z = l.f * 95 + souffle;
      l.el.style.transform = `translate3d(${((i - 2.5) * ecart).toFixed(1)}px,${(-l.f * 26).toFixed(1)}px,${z.toFixed(1)}px) rotateX(${(-l.f * 10).toFixed(1)}deg) skewX(${penche.toFixed(1)}deg)`;
    });
  }

  // ---------- Entrées ----------
  function surPointeur(e) {
    ptr.x = (e.clientX / innerWidth) * 2 - 1;
    ptr.y = (e.clientY / innerHeight) * 2 - 1;
    ptr.cx = e.clientX; ptr.cy = e.clientY;
    ptr.dedans = true;
    ptr.dernier = performance.now();
  }
  const quitter = () => { ptr.dedans = false; ptr.x = 0; ptr.y = 0; };
  let survol = null;
  function poser(i) {
    if (survol === i) return;
    if (survol !== null && !objets[survol].el.classList.contains('is-focus')) objets[survol].cible = 0;
    if (survol !== null) objets[survol].el.classList.remove('is-survol');
    survol = i;
    if (i !== null) { objets[i].cible = 1; objets[i].el.classList.add('is-survol'); }
  }
  let glisse = null, aGlisse = false, dernierMouv = null;
  function surDown(e) {
    if (e.button !== 0 || etat.phase !== 'libre') return;
    aGlisse = false; lancer = 0;
    glisse = { x: e.clientX, y: e.clientY, s: scrollY, id: e.pointerId };
    dernierMouv = { y: scrollY, t: performance.now(), v: 0 };
  }
  function surMove(e) {
    surPointeur(e);
    if (glisse && e.pointerId === glisse.id) {
      const dx = e.clientX - glisse.x, dy = e.clientY - glisse.y;
      if (!aGlisse && Math.hypot(dx, dy) > 6) { aGlisse = true; try { racine.setPointerCapture(e.pointerId); } catch (_) {} poser(null); }
      if (aGlisse) {
        scrollTo(0, glisse.s - dx * 1.3 - (e.pointerType === 'touch' ? 0 : dy * 0.5));
        const now = performance.now(), dtm = Math.max(1, now - dernierMouv.t);
        dernierMouv = { y: scrollY, t: now, v: lisse(dernierMouv.v, ((scrollY - dernierMouv.y) / dtm) * 1000, 12, dtm / 1000) };
      }
      return;
    }
    if (etat.phase !== 'libre') return;
    const tuile = e.target.closest && e.target.closest('.im-tuile3d');
    poser(tuile ? +tuile.dataset.i : null);
  }
  function surUp(e) {
    if (glisse && aGlisse) lancer = borne(dernierMouv.v, -4000, 4000);
    glisse = null;
  }
  function surClic(e) {
    if (aGlisse) { aGlisse = false; return; }
    const tuile = e.target.closest && e.target.closest('.im-tuile3d');
    if (tuile) plonger(+tuile.dataset.i);
  }
  function surRoue(e) { if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) scrollBy(0, e.deltaX); }

  // ---------- Plongée et sortie ----------
  // Si le mur s'arrête pendant une plongée (garde de lenteur, version calme, fenêtre rétrécie), la page demandée s'ouvre quand même.
  let navPendante = null;
  function plonger(i, naviguer = true) {
    if (etat.phase !== 'libre' || !pos[i]) return false;
    etat.phase = 'plongee';
    gardee = i;
    poser(null);
    objets[i].cible = 1;
    objets[i].el.classList.add('is-survol');
    const p = pos[i];
    try { sessionStorage.setItem('im-plongee', tuiles[i].dataset.slug); } catch (_) {}
    navPendante = naviguer ? liens[i].href : null;
    tween({ ...cam }, { x: p.x, y: p.y, yaw: 0, pitch: 0, d: couvre() + 90 }, 1150, ease, () => {
      etat.plongees = (etat.plongees || 0) + 1;
      navPendante = null;
      if (naviguer) location.href = liens[i].href;
      else setTimeout(() => sortir(i, 0), 30);
    });
    return true;
  }
  function sortir(i, delai = 120) {
    const p = pos[i];
    if (!p) return;
    etat.phase = 'sortie';
    gardee = i;
    objets.forEach((o) => { o.el.classList.remove('is-survol'); o.cible = 0; });
    objets[i].cible = 1;
    scrollTo(0, scrollPour(p.x));
    const de = { x: p.x, y: p.y, yaw: 0, pitch: 0, d: couvre() + 90 };
    Object.assign(cam, de);
    cibleY = p.y * 0.35;
    setTimeout(() => {
      tween({ ...de }, { x: p.x, y: cibleY, yaw: YAW0, pitch: PITCH0, d: D }, 1400, sortie, () => {
        etat.phase = 'libre';
        gardee = -1;
        objets[i].cible = 0;
      });
    }, delai);
  }

  // ---------- Clavier : la caméra suit la tuile focalisée ----------
  function suivre(i) {
    const p = pos[i];
    if (!p) return;
    scrollTo(0, scrollPour(p.x));
    cibleY = p.y * 0.35;
    objets.forEach((o, k) => { if (k !== i && o.el.classList.contains('is-focus')) { o.el.classList.remove('is-focus'); if (k !== survol) o.cible = 0; } });
    const clavier = liens[i].matches(':focus-visible');
    objets[i].el.classList.toggle('is-focus', clavier);
    if (clavier) objets[i].cible = 1;
  }
  function lacher(i) {
    objets[i].el.classList.remove('is-focus');
    if (i !== survol) objets[i].cible = 0;
  }
  const allerFamille = (gi) => scrollTo(0, scrollPour(blocs[gi].x0 + T * 1.2));

  function demarrer() {
    if (actif) return;
    actif = true;
    redimensionner();
    dernier = 0;
    raf = requestAnimationFrame(boucle);
    addEventListener('pointermove', surMove, { passive: true });
    document.documentElement.addEventListener('pointerleave', quitter);
    racine.addEventListener('pointerdown', surDown);
    addEventListener('pointerup', surUp);
    addEventListener('pointercancel', surUp);
    racine.addEventListener('click', surClic);
    addEventListener('wheel', surRoue, { passive: true });
    addEventListener('resize', redimensionner);
  }
  function arreter() {
    if (!actif) return;
    actif = false;
    if (etat.phase === 'plongee' && navPendante) {
      const u = navPendante;
      navPendante = null; anim = null; etat.phase = 'libre'; gardee = -1;
      location.href = u;
    }
    cancelAnimationFrame(raf);
    removeEventListener('pointermove', surMove);
    document.documentElement.removeEventListener('pointerleave', quitter);
    racine.removeEventListener('pointerdown', surDown);
    removeEventListener('pointerup', surUp);
    removeEventListener('pointercancel', surUp);
    racine.removeEventListener('click', surClic);
    removeEventListener('wheel', surRoue);
    removeEventListener('resize', redimensionner);
  }

  redimensionner();
  scene.updateMatrixWorld();
  renderer.render(scene, camera);
  mesurer();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(mesurer);

  // Rendu immédiat de la pose de départ (pas d'image vide avant la première frame).
  return { demarrer, arreter, plonger, sortir, suivre, lacher, allerFamille, couvre, pos, blocs, cam, scrollPour };
}
