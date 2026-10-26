// Calibrage des hachures : densité de traits de chaque couleur dans une fenêtre de 41 px, en quelques points connus
const O = require('./outils');
const { fs, L, N, R, G, B, lum, zone } = O;
const plein = O.dilater(fs.readFileSync(__dirname + '/plein.bin'), 2);
const traits = { rouge: new Uint8Array(N), vert: new Uint8Array(N), bleu: new Uint8Array(N), noir: new Uint8Array(N) };
for (let i = 0; i < N; i++) {
  if (!zone[i] || plein[i]) continue;
  const r = R(i), g = G(i), b = B(i);
  // dominante de teinte, pour garder aussi les bords anticrénelés des traits
  const dr = r - Math.max(g, b), dg = g - Math.max(r, b), db = b - Math.max(r, g);
  if (dr >= 30) traits.rouge[i] = 1;
  else if (dg >= 15) traits.vert[i] = 1;
  else if (db >= 25) traits.bleu[i] = 1;
  else if (lum(i) < 110) traits.noir[i] = 1;
}
const dens = {}; for (const [k, m] of Object.entries(traits)) { dens[k] = O.sommeFenetre(m, 20); fs.writeFileSync(`${__dirname}/t-${k}.bin`, m); }
const points = { 'shell A8': [580, 1640], 'libre A9 (bord)': [420, 1735], 'libre A9 centre': [580, 1800], 'libre A10': [576, 1956], 'libre BC9': [980, 1790], 'exxon B12': [815, 2280], 'bp A5': [600, 1150], 'bp A6': [560, 1310], 'bp A3': [700, 900], 'bp AB5': [800, 1180], 'oilserv D4-5': [1190, 1110], 'shell B8': [830, 1600], 'perenco gris': [1150, 1650] };
for (const [nom, [x, y]] of Object.entries(points)) {
  const i = y * L + x;
  console.log(nom.padEnd(18), Object.entries(dens).map(([k, d]) => `${k} ${(d[i] / 1681 * 100).toFixed(1)}%`).join('  '));
}
