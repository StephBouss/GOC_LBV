// Carte d'étiquettes livrée : zones élargies de 2 px sur leurs contours, lignes de la légende du poster, réduction à 1200 px.
// Niveau de gris = identifiant × 10 (lecture tolérante dans le navigateur)
const O = require('./outils');
const { fs, L, H, N, zone } = O;
const { LIGNES, X0, X1, DEMI } = require('./legende-lignes');
let lab = Uint8Array.from(fs.readFileSync(__dirname + '/etiquettes.bin'));
for (let passe = 0; passe < 2; passe++) {
  const suivant = Uint8Array.from(lab);
  for (let i = L; i < N - L; i++) {
    if (lab[i] || !zone[i]) continue;
    const v = lab[i - 1] || lab[i + 1] || lab[i - L] || lab[i + L];
    if (v) suivant[i] = v;
  }
  lab = suivant;
}
for (const [id, yc] of LIGNES) for (let y = yc - DEMI; y <= yc + DEMI; y++) for (let x = X0; x <= X1; x++) lab[y * L + x] = id;
const l = 1200, h = Math.ceil(H / 2), out = Buffer.alloc(l * h);
for (let y = 0; y < h; y++) for (let x = 0; x < l; x++) {
  const c = new Map();
  for (const [dx, dy] of [[0, 0], [1, 0], [0, 1], [1, 1]]) { const yy = Math.min(H - 1, 2 * y + dy); const v = lab[yy * L + 2 * x + dx]; c.set(v, (c.get(v) || 0) + 1); }
  let meilleur = 0, n = 0;
  for (const [v, k] of c) if (k > n || (k === n && v && !meilleur)) { meilleur = v; n = k; }
  out[y * l + x] = meilleur * 10;
}
fs.writeFileSync(__dirname + '/etiquettes-1200.gray', out);
console.log(`${l}x${h}`);
