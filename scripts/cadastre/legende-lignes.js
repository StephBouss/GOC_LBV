// Lignes de la légende du poster (échelle 2400) : catégorie, ordonnée du centre ; dessin de contrôle des rectangles
const O = require('./outils');
const { fs, L, px } = O;
const LIGNES = [[1, 664], [2, 690], [3, 716], [4, 741], [5, 767], [6, 793], [7, 819], [8, 845], [9, 870], [10, 897], [11, 922], [12, 948], [13, 974], [14, 1000],
  [15, 1075], [16, 1102], [17, 1127], [18, 1153], [19, 1179], [20, 1203], [21, 1230], [22, 1255], [23, 1281], [24, 1309], [25, 1347]];
module.exports = { LIGNES, X0: 1898, X1: 2296, DEMI: 12 };
if (require.main === module) {
  const x0 = 1880, y0 = 640, w = 420, h = 730, out = Buffer.alloc(w * h * 3);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const i = ((y0 + y) * L + x0 + x) * 3; for (let k = 0; k < 3; k++) out[(y * w + x) * 3 + k] = px[i + k]; }
  for (const [id, yc] of LIGNES) for (const yy of [yc - 12, yc + 12]) for (let x = 1898; x <= 2296; x++) { const o = ((yy - y0) * w + x - x0) * 3; out[o] = 255; out[o + 1] = 0; out[o + 2] = 255; }
  fs.writeFileSync(__dirname + '/legende.rgb', out); console.log(`${w}x${h}`);
}
