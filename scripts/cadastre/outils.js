// Outils d'analyse de l'image du cadastre (2400 × 3393, RGB brut) : morphologie, composantes, densités.
//
// Carte d'étiquettes du cadastre pétrolier (img/cadastre/cadastre-etiquettes.png, lue par app.js) : un gris par entrée de la
// légende du poster de la DGAPG, pour détourer chaque entrée sur la page Exploration et production. Le PDF ne contient que
// des images : la découpe se fait sur les pixels. Pour une nouvelle édition du poster :
//  1. rendre la page du PDF à 2400 px de large (PDF.js dans un navigateur), puis, dans un dossier de travail hors du projet
//     où l'on copie ces scripts (ils y écrivent des masques de 8 Mo) :
//     ffmpeg -i cadastre-2400.png -f rawvideo -pix_fmt rgb24 c2400.rgb
//  2. vérifier les repères propres à la mise en page : cadre et cartouches ci-dessous (zone), couleurs et tolérances des
//     aplats (segmenter.js), ordonnées des lignes de la légende (legende-lignes.js, qui dessine un contrôle s'il est lancé seul)
//  3. lancer dans l'ordre : segmenter.js (aplats), hachures-test.js (traits de hachure par couleur), socle.js (hachures
//     grises du socle), hachures.js (zones AET et blocs libres), combiner.js (carte complète et aperçu teinté apercu.rgb),
//     finaliser.js (contours, lignes de la légende, réduction à 1200 px : etiquettes-1200.gray)
//  4. ffmpeg -f rawvideo -pix_fmt gray -s 1200x1697 -i etiquettes-1200.gray -pix_fmt gray cadastre-etiquettes.png
//  Les surfaces obtenues (combiner.js) doivent rester proches de 10 pixels par km² de la légende pour chaque entrée.
const fs = require('fs');
const L = 2400, H = 3393, N = L * H;
const px = fs.readFileSync(__dirname + '/c2400.rgb');
const R = (i) => px[i * 3], G = (i) => px[i * 3 + 1], B = (i) => px[i * 3 + 2];
const lum = (i) => 0.299 * R(i) + 0.587 * G(i) + 0.114 * B(i);

// Zone cartographiée : cadre intérieur, sans le cartouche de légende ni celui des paramètres
const zone = new Uint8Array(N);
for (let y = 529; y <= 3307; y++) for (let x = 109; x <= 2297; x++) {
  if (x >= 1886 && y <= 1521) continue;
  if (x >= 1756 && y >= 2845) continue;
  zone[y * L + x] = 1;
}

// Somme sur une fenêtre carrée de rayon r (image intégrale), pour la morphologie et les densités
function sommeFenetre(m, r) {
  const ii = new Float64Array((L + 1) * (H + 1));
  for (let y = 0; y < H; y++) {
    let s = 0;
    for (let x = 0; x < L; x++) { s += m[y * L + x]; ii[(y + 1) * (L + 1) + x + 1] = ii[y * (L + 1) + x + 1] + s; }
  }
  const out = new Float64Array(N);
  for (let y = 0; y < H; y++) {
    const y0 = Math.max(0, y - r), y1 = Math.min(H, y + r + 1);
    for (let x = 0; x < L; x++) {
      const x0 = Math.max(0, x - r), x1 = Math.min(L, x + r + 1);
      out[y * L + x] = ii[y1 * (L + 1) + x1] - ii[y0 * (L + 1) + x1] - ii[y1 * (L + 1) + x0] + ii[y0 * (L + 1) + x0];
    }
  }
  return out;
}
const dilater = (m, r) => { const s = sommeFenetre(m, r), o = new Uint8Array(N); for (let i = 0; i < N; i++) o[i] = s[i] > 0 ? 1 : 0; return o; };
const eroder = (m, r) => {
  const s = sommeFenetre(m, r), o = new Uint8Array(N);
  for (let y = 0; y < H; y++) for (let x = 0; x < L; x++) {
    const w = (Math.min(L, x + r + 1) - Math.max(0, x - r)) * (Math.min(H, y + r + 1) - Math.max(0, y - r));
    o[y * L + x] = s[y * L + x] >= w ? 1 : 0;
  }
  return o;
};
const fermer = (m, r) => eroder(dilater(m, r), r);
const ouvrir = (m, r) => dilater(eroder(m, r), r);

// Composantes connexes (4-connexité) : étiquettes et statistiques
function composantes(m) {
  const lab = new Int32Array(N); const stats = [null];
  const pile = new Int32Array(N);
  for (let i = 0; i < N; i++) {
    if (!m[i] || lab[i]) continue;
    const id = stats.length; let n = 0, bord = false, sp = 0, x0 = L, y0 = H, x1 = 0, y1 = 0;
    pile[sp++] = i; lab[i] = id;
    while (sp) {
      const j = pile[--sp]; n++;
      const x = j % L, y = (j - x) / L;
      if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
      if (!zone[j - 1] || !zone[j + 1] || !zone[j - L] || !zone[j + L]) bord = true;
      for (const k of [j - 1, j + 1, j - L, j + L]) if (k >= 0 && k < N && m[k] && !lab[k] && Math.abs((k % L) - x) <= 1) { lab[k] = id; pile[sp++] = k; }
    }
    stats.push({ n, bord, x0, y0, x1, y1 });
  }
  return { lab, stats };
}
const garder = (m, filtre) => {
  const { lab, stats } = composantes(m); const o = new Uint8Array(N);
  for (let i = 0; i < N; i++) if (lab[i] && filtre(stats[lab[i]])) o[i] = 1;
  return o;
};
// Bouche les trous (composantes du complément qui ne touchent pas le bord de la zone) plus petits que maxTrou
function boucher(m, maxTrou) {
  const inv = new Uint8Array(N); for (let i = 0; i < N; i++) inv[i] = zone[i] && !m[i] ? 1 : 0;
  const { lab, stats } = composantes(inv); const o = Uint8Array.from(m);
  for (let i = 0; i < N; i++) if (lab[i] && !stats[lab[i]].bord && stats[lab[i]].n <= maxTrou) o[i] = 1;
  return o;
}
const compter = (m) => { let n = 0; for (let i = 0; i < N; i++) n += m[i]; return n; };

module.exports = { fs, L, H, N, px, R, G, B, lum, zone, sommeFenetre, dilater, eroder, fermer, ouvrir, composantes, garder, boucher, compter };
