// Hachures AET et blocs libres. Les zones blanches (entre traits sombres) sont rattachées à une hachure si elles tombent
// dans une zone dense en traits diagonaux de sa couleur ; sinon, fermées et à l'intérieur du cadastre, ce sont des blocs libres.
const O = require('./outils');
const { fs, L, H, N, R, G, B, zone } = O;
const plein = fs.readFileSync(__dirname + '/plein.bin');
// part minimale du pourtour d'un bloc libre qui longe un contour sombre (les terres hors cadastre sont bordées de rouge et de socle)
const SEUIL_SOMBRE = 0.1;
const HACHURES = { 'aet-exxon': 'rouge', 'aet-bp': 'vert', 'aet-oilserv': 'bleu', 'aet-shell': 'noir' };

// Ne garde que les pixels de trait alignés sur une diagonale (hachures à 45°) : les limites de province sinueuses,
// les bordures droites des blocs et les textes disparaissent
function diagonales(m) {
  const o = new Uint8Array(N);
  for (let y = 10; y < H - 10; y++) for (let x = 10; x < L - 10; x++) {
    const i = y * L + x; if (!m[i]) continue;
    let a = 0, b = 0;
    for (let k = -10; k <= 10; k++) { a += m[i + k * L + k]; b += m[i + k * L - k]; }
    if (a >= 15 || b >= 15) o[i] = 1;
  }
  return o;
}

// Zones grossières de hachure : densité de traits diagonaux (fenêtre 41 px), nettoyée, puis élargie pour retrouver les pointes
const grossier = {};
for (const [cle, couleur] of Object.entries(HACHURES)) {
  const d = O.sommeFenetre(diagonales(fs.readFileSync(`${__dirname}/t-${couleur}.bin`)), 20);
  const m = new Uint8Array(N); for (let i = 0; i < N; i++) m[i] = zone[i] && d[i] / 1681 > 0.03 ? 1 : 0;
  grossier[cle] = O.dilater(O.garder(O.ouvrir(m, 6), (c) => c.n >= 8000), 10);
  console.log(cle, 'zone grossière', O.compter(grossier[cle]));
}

// Zones blanches : blanc ou gris très clair et neutre, ou bleu très pâle des lignes bathymétriques ; composantes 4-connexes.
// La bande hachurée du socle (traits gris pâle) sert de barrière : sans elle, les blocs qui la bordent fuient vers l'intérieur des terres
// (les bords anticrénelés des hachures noires ressemblent au socle : les zones AET en sont retirées)
const socle = O.dilater(fs.readFileSync(__dirname + '/socle.bin').map((v, i) => v && !Object.values(grossier).some((g) => g[i]) ? 1 : 0), 2);
const blanc = new Uint8Array(N);
for (let i = 0; i < N; i++) {
  if (!zone[i] || plein[i] || socle[i]) continue;
  const r = R(i), g = G(i), b = B(i), mn = Math.min(r, g, b), mx = Math.max(r, g, b);
  if ((mn >= 185 && mx - mn <= 25) || (b >= 240 && g >= 215 && r >= 180 && b >= g && g >= r)) blanc[i] = 1;
}
// tout trait non blanc est épaissi d'un pixel : le trait de côte, fin et clair, laisse sinon des jours
const traitEpais = O.dilater(blanc.map((v, i) => zone[i] && !v && !socle[i] ? 1 : 0), 1);
for (let i = 0; i < N; i++) if (traitEpais[i]) blanc[i] = 0;
const { lab, stats } = O.composantes(blanc);
// une composante qui approche à 4 px du cadre (filet du cadre compris) est hors cadastre
const coeur = O.eroder(zone, 4);
const bordure = new Uint8Array(stats.length);
const parComp = stats.map(() => ({ exxon: 0, bp: 0, oilserv: 0, shell: 0 }));
const cles = Object.keys(HACHURES);
// pourtour de chaque composante, et part de ce pourtour qui longe un trait sombre neutre (contour noir d'un bloc, texte)
const sombre = new Uint8Array(N);
for (let i = 0; i < N; i++) { const r = R(i), g = G(i), b = B(i); if (Math.max(r, g, b) - Math.min(r, g, b) <= 40 && O.lum(i) < 170) sombre[i] = 1; }
const presSombre = O.dilater(sombre, 3);
const tour = new Float64Array(stats.length), tourSombre = new Float64Array(stats.length);
for (let i = 0; i < N; i++) {
  const c = lab[i]; if (!c) continue;
  if (!coeur[i]) bordure[c] = 1;
  for (const k of cles) if (grossier[k][i]) parComp[c][k.slice(4)]++;
  if (lab[i - 1] !== c || lab[i + 1] !== c || lab[i - L] !== c || lab[i + L] !== c) { tour[c]++; if (presSombre[i]) tourSombre[c]++; }
}
const sortie = {}; for (const k of [...cles, 'libres']) sortie[k] = new Uint8Array(N);
const decision = stats.map((s, c) => {
  if (!s) return null;
  const p = parComp[c];
  const meilleur = Object.entries(p).sort((a, b) => b[1] - a[1])[0];
  if (meilleur[1] / s.n > 0.5) return 'aet-' + meilleur[0];
  if (!bordure[c] && s.n >= 1500) {
    const part = tourSombre[c] / tour[c];

    return part >= SEUIL_SOMBRE ? 'libres' : null;
  }
  return null;
});
for (let i = 0; i < N; i++) { const d = decision[lab[i]]; if (d) sortie[d][i] = 1; }
for (const k of Object.keys(sortie)) {
  // les traits (hachures, textes) entre les bandes blanches retenues sont absorbés
  const m = O.boucher(O.fermer(sortie[k], k === 'libres' ? 3 : 4), 1500);
  fs.writeFileSync(`${__dirname}/m-${k}.bin`, m);
  console.log(k, 'pixels', O.compter(m));
}
