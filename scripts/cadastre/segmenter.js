// Découpe de la carte du cadastre en catégories de la légende : une étiquette par pixel (0 = rien)
// Couleurs pleines (couleur exacte de la carte), puis hachures AET (densité de traits), puis blocs libres (zones blanches)
const O = require('./outils');
const { fs, L, H, N, R, G, B, lum, zone } = O;

const CATEGORIES = [
  // id, clé, couleur sur la carte, tolérance, surface de la légende (km²)
  [1, 'expl-anadarko', 'ffa8eb', 10, 4048], [2, 'expl-assala', 'd6f5ff', 6, 3672], [3, 'expl-bw', 'b09ae6', 10, 4917],
  [4, 'expl-cnooc', 'e6c200', 10, 7580], [5, 'expl-koreg', '65c8a7', 10, 10389], [6, 'expl-mp', 'ffa678', 10, 10557],
  [7, 'expl-perenco', 'efefef', 2, 9652], [8, 'expl-petronas', 'cf623f', 10, 2485], [9, 'expl-reg', '37f9ff', 10, 1213],
  [10, 'expl-pilgrim', 'b09877', 10, 5328],
  [11, 'aet-oilserv', null, 0, 4554], [12, 'aet-bp', null, 0, 27086], [13, 'aet-exxon', null, 0, 53317], [14, 'aet-shell', null, 0, 38587],
  [15, 'x-assala', 'a3d4ff', 10, 691.53], [16, 'x-bw', '4286d4', 10, 851], [17, 'x-eniva', 'ce65f2', 10, 1821],
  [18, 'x-snhg', 'ff0000', 12, 1188.85], [19, 'x-koreg', '458b74', 10, 80.94], [20, 'x-mp', 'fe8000', 12, 221.40],
  [21, 'x-perenco', 'd8d8d8', 3, 3406.31], [22, 'x-stream', '416cef', 12, 132.26], [23, 'x-total', '73ff00', 12, 1052.09],
  [24, 'x-vaalco', 'ffff00', 12, 187.14], [25, 'libres', null, 0, 62087],
];
const hexa = (h) => [0, 2, 4].map((k) => parseInt(h.slice(k, k + 1 + 1), 16));

// 1 · Couleurs pleines : pixels de la couleur, intérieur des aplats (5 × 5 majoritaire), sans les traits fins
const masques = {};
const plein = new Uint8Array(N);
for (const [id, cle, hex, tol] of CATEGORIES) {
  if (!hex) continue;
  const [cr, cg, cb] = hexa(hex);
  const m = new Uint8Array(N);
  for (let i = 0; i < N; i++) if (zone[i] && Math.abs(R(i) - cr) <= tol && Math.abs(G(i) - cg) <= tol && Math.abs(B(i) - cb) <= tol) m[i] = 1;
  const s = O.sommeFenetre(m, 2);
  const interieur = new Uint8Array(N); for (let i = 0; i < N; i++) interieur[i] = m[i] && s[i] >= 18 ? 1 : 0;
  // le rouge pleins (SNHG) côtoie les limites de provinces en rouge : ouverture plus forte
  let net = cle === 'x-snhg' ? O.ouvrir(interieur, 3) : interieur;
  net = O.garder(net, (c) => c.n >= 25);
  net = O.boucher(O.fermer(net, 3), 900);
  masques[cle] = net;
  for (let i = 0; i < N; i++) if (net[i]) plein[i] = 1;
}
fs.writeFileSync(__dirname + '/plein.bin', plein);
for (const [k, m] of Object.entries(masques)) fs.writeFileSync(`${__dirname}/m-${k}.bin`, m);
console.log('couleurs pleines faites');
