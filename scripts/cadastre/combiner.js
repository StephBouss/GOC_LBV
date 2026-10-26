// Carte d'étiquettes (un octet par pixel) : libres < AET < exploration < exploitation, puis aperçu teinté
const O = require('./outils');
const { fs, L, H, N, px } = O;
const CLES = ['expl-anadarko', 'expl-assala', 'expl-bw', 'expl-cnooc', 'expl-koreg', 'expl-mp', 'expl-perenco', 'expl-petronas', 'expl-reg', 'expl-pilgrim',
  'aet-oilserv', 'aet-bp', 'aet-exxon', 'aet-shell', 'x-assala', 'x-bw', 'x-eniva', 'x-snhg', 'x-koreg', 'x-mp', 'x-perenco', 'x-stream', 'x-total', 'x-vaalco', 'libres'];
const KM2 = [4048, 3672, 4917, 7580, 10389, 10557, 9652, 2485, 1213, 5328, 4554, 27086, 53317, 38587, 691.53, 851, 1821, 1188.85, 80.94, 221.40, 3406.31, 132.26, 1052.09, 187.14, 62087];
const ordre = [25, 11, 12, 13, 14, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24];
const lab = new Uint8Array(N);
for (const id of ordre) { const m = fs.readFileSync(`${__dirname}/m-${CLES[id - 1]}.bin`); for (let i = 0; i < N; i++) if (m[i]) lab[i] = id; }
fs.writeFileSync(__dirname + '/etiquettes.bin', lab);
const n = new Array(26).fill(0); for (let i = 0; i < N; i++) n[lab[i]]++;
CLES.forEach((k, j) => console.log(k.padEnd(14), String(n[j + 1]).padStart(7), (n[j + 1] / KM2[j]).toFixed(2), 'px/km²'));
// aperçu : chaque catégorie d'une teinte vive tournante, le reste grisé
const teinte = (id) => { const h = (id * 137.5) % 360, c = 1, x = 1 - Math.abs(((h / 60) % 2) - 1); const [r, g, b] = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x]; return [r * 255, g * 255, b * 255]; };
const out = Buffer.alloc(N * 3);
for (let i = 0; i < N; i++) {
  const v = 0.3 * px[i * 3] + 0.59 * px[i * 3 + 1] + 0.11 * px[i * 3 + 2];
  if (lab[i]) { const t = teinte(lab[i]); for (let k = 0; k < 3; k++) out[i * 3 + k] = 0.35 * v + 0.65 * t[k]; }
  else for (let k = 0; k < 3; k++) out[i * 3 + k] = 255 - (255 - v) * 0.5;
}
fs.writeFileSync(__dirname + '/apercu.rgb', out);
