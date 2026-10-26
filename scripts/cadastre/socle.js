// Hachures gris clair du socle : traits gris neutres alignés en diagonale, densité dans une fenêtre de 41 px
const O = require('./outils');
const { fs, L, H, N, R, G, B, lum, zone } = O;
const plein = O.dilater(fs.readFileSync(__dirname + '/plein.bin'), 2);
const gris = new Uint8Array(N);
for (let i = 0; i < N; i++) {
  if (!zone[i] || plein[i]) continue;
  const r = R(i), g = G(i), b = B(i), mn = Math.min(r, g, b), mx = Math.max(r, g, b), l = lum(i);
  if (mx - mn <= 6 && l >= 215 && l <= 250) gris[i] = 1;
}
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
const d = O.sommeFenetre(diagonales(gris), 20);
const P = { ngounie2: [1770, 1500], estF2b: [1560, 690], bpA5: [600, 1150], exxonB12: [815, 2280], A10: [576, 1956],  socleNgounie: [1776, 1500], socleEst: [1620, 1450], socleF2est: [1560, 700], F2: [1430, 719], EF: [1330, 609], E2: [1330, 700], A9: [580, 1800], DEF5: [1308, 1164], shellA8: [580, 1640], perencoGris: [1150, 1650], pg: [960, 1300] };
console.log(Object.entries(P).map(([n, [x, y]]) => `${n} ${(d[y * L + x] / 16.81).toFixed(1)}%`).join(' | '));
const SEUIL = 0.03; fs.writeFileSync(__dirname + '/socle-traits.bin', diagonales(gris));
const m = new Uint8Array(N); for (let i = 0; i < N; i++) m[i] = zone[i] && d[i] / 1681 > SEUIL ? 1 : 0;
const z = O.garder(O.ouvrir(m, 12), (c) => c.n >= 8000);
fs.writeFileSync(__dirname + '/socle.bin', z);
console.log('zone socle', O.compter(z));
