#!/usr/bin/env node
/**
 * Prépare la vidéo de la première diapositive de l'accueil (sources/diaporama-accueil.json) depuis le montage du client
 * (hors du dépôt : « GOC Vidéos/Hero »). Sans son ; WebM (VP9) proposé d'abord aux navigateurs qui le lisent, MP4 (H.264,
 * index en tête) pour les autres.
 *
 *  video/hero-snhg-1080p.webm|.mp4   ordinateur et tablette, 1920 × 1080
 *  video/hero-snhg-mobile.webm|.mp4  téléphone, 720 × 1280 : la bande verticale que le hero montre sur un téléphone,
 *                                    cadrée plan par plan sur le sujet (« centre »)
 *  video/hero-snhg-affiche.jpg       affiche : première image de la version large, préchargée, affichée tant que la vidéo
 *                                    n'a pas démarré (et à sa place en mode économie de données)
 *
 * Le montage a des bandes noires (format cinéma) dont la hauteur change d'un plan à l'autre : chaque plan est recadré dans
 * son image utile (« cadre », en pixels du montage), puis remis au format. Pour un nouveau montage, relever le début de
 * chaque plan (coupe franche ou fondu) et la hauteur des bandes : ffmpeg -i <montage> -vf fps=2,cropdetect -f null -
 * Usage : node scripts/preparer-videos.js [large|mobile]   (toutes les versions par défaut ; montage modifiable par
 * VIDEO_SOURCE ; ffmpeg requis)
 */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const RACINE = path.join(__dirname, '..');
const SOURCE = process.env.VIDEO_SOURCE
  || path.join(RACINE, '..', 'Img', 'Inspiration images', 'Site web GOC', 'GOC Vidéos', 'Hero', 'snhg-hero-2560x1440-premier-montage.mp4');
const DST = path.join(RACINE, 'video');
const NOM = 'hero-snhg';

const LARGEUR = 2560;                    // largeur du montage
const CADRE = [89, 50, 2382, 1340];      // image utile sous les bandes de 46 px, au format 16:9 : [x, y, largeur, hauteur]
// Plans : début (s), centre de la version verticale (fraction de la largeur du montage), coupe franche (sinon fondu
// d'une seconde, pendant lequel la version verticale glisse d'un centre à l'autre), cadre propre au plan
const PLANS = [
  { debut: 0, centre: 0.5 },             // forêt et base vie, vue aérienne
  { debut: 2.9, centre: 0.5 },           // base vie
  { debut: 5.9, centre: 0.45 },          // village et piste
  { debut: 8.9, centre: 0.45 },          // plateforme en mer
  { debut: 11.9, centre: 0.53 },         // laboratoire : flacon, main et masque
  { debut: 14.9, centre: 0.53 },         // bureau
  { debut: 17.4, centre: 0.45 },         // opérateurs au bord de la rivière
  { debut: 20, centre: 0.79, coupe: true, cadre: [622, 174, 1938, 1090] },  // perroquet gris (bandes de 170 px) : tête et corps
  { debut: 24, centre: 0.55, coupe: true },   // plage
  { debut: 26.9, centre: 0.5 },          // forêt et base vie
];
const SORTIES = {
  large: { taille: [1920, 1080], webm: 38, mp4: 27, fichier: `${NOM}-1080p` },
  mobile: { taille: [720, 1280], webm: 40, mp4: 28, fichier: `${NOM}-mobile` },
};

const pair = (n) => 2 * Math.round(n / 2);
const nombre = (n) => String(Number(n.toFixed(3)));

// Segments : plans consécutifs qui partagent le même cadre (la taille d'un recadrage ne peut pas changer en cours de route)
const segments = [];
PLANS.forEach((p) => {
  const cadre = p.cadre || CADRE;
  const dernier = segments[segments.length - 1];
  if (dernier && String(dernier.cadre) === String(cadre)) dernier.plans.push(p);
  else segments.push({ cadre, plans: [p] });
});
segments.forEach((s, i) => { s.fin = segments[i + 1]?.plans[0].debut; });

// Position de la bande verticale dans un segment : constante pendant un plan, glissée pendant un fondu
function positionVerticale(s, l) {
  const x = (p) => Math.min(Math.max(pair(p.centre * LARGEUR - l / 2), 0), LARGEUR - l);
  const points = [{ t: s.plans[0].debut, x: x(s.plans[0]) }];
  s.plans.slice(1).forEach((p, i) => {
    const marge = p.coupe ? 0.001 : 0.5;
    points.push({ t: p.debut - marge, x: x(s.plans[i]) }, { t: p.debut + (p.coupe ? 0 : marge), x: x(p) });
  });
  return points.slice(1).reduceRight((suite, b, i) => {
    const a = points[i];
    const valeur = a.x === b.x ? `${a.x}` : `${a.x}${b.x > a.x ? '+' : '-'}${Math.abs(b.x - a.x)}*(t-${nombre(a.t)})/${nombre(b.t - a.t)}`;
    return `if(lt(t,${nombre(b.t)}),${valeur},${suite})`;
  }, `${points[points.length - 1].x}`);
}

// Versions à préparer : toutes, ou celles nommées sur la ligne de commande (l'encodage complet prend une demi-heure)
const voulues = process.argv.length > 2 ? process.argv.slice(2) : Object.keys(SORTIES);
voulues.forEach((v) => { if (!SORTIES[v]) throw new Error(`version inconnue : ${v} (${Object.keys(SORTIES).join(', ')})`); });
const recadrages = {
  large: ([x, y, l, h]) => `crop=${l}:${h}:${x}:${y}`,
  mobile: ([, y, , h], s) => { const l = pair((h * 9) / 16); return `crop=w=${l}:h=${h}:x='${positionVerticale(s, l)}':y=${y}`; },
};
const decoupe = (s) => `trim=start=${s.plans[0].debut}${s.fin === undefined ? '' : `:end=${s.fin}`}`;

const morceaux = [`[0]split=${segments.length * voulues.length}${segments.flatMap((s, i) => voulues.map((v) => `[${v}${i}]`)).join('')}`];
for (const v of voulues) {
  const [L, H] = SORTIES[v].taille;
  segments.forEach((s, i) => morceaux.push(
    `[${v}${i}]${decoupe(s)},${recadrages[v](s.cadre, s)},setpts=PTS-STARTPTS,scale=${L}:${H}:flags=lanczos,setsar=1[${v}-${i}]`));
  morceaux.push(`${segments.map((s, i) => `[${v}-${i}]`).join('')}concat=n=${segments.length}:v=1:a=0,format=yuv420p,split=2[${v}-webm][${v}-mp4]`);
}

const sorties = voulues.map((v) => [v, SORTIES[v]]).flatMap(([cle, o]) => [
  '-map', `[${cle}-webm]`, '-c:v', 'libvpx-vp9', '-b:v', '0', '-crf', String(o.webm), '-row-mt', '1', '-deadline', 'good', '-cpu-used', '2',
  '-an', '-map_metadata', '-1', path.join(DST, `${o.fichier}.webm`),
  '-map', `[${cle}-mp4]`, '-c:v', 'libx264', '-preset', 'veryslow', '-crf', String(o.mp4), '-profile:v', 'high',
  '-an', '-movflags', '+faststart', '-map_metadata', '-1', path.join(DST, `${o.fichier}.mp4`),
]);

fs.mkdirSync(DST, { recursive: true });
execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', SOURCE, '-filter_complex', morceaux.join(';'), ...sorties], { stdio: 'inherit' });

// Affiche : première image de la version large
const [x, y, l, h] = segments[0].cadre;
execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', SOURCE, '-frames:v', '1',
  '-vf', `crop=${l}:${h}:${x}:${y},scale=${SORTIES.large.taille.join(':')}:flags=lanczos,format=yuvj420p`,
  '-q:v', '5', '-map_metadata', '-1', path.join(DST, `${NOM}-affiche.jpg`)]);

for (const f of fs.readdirSync(DST).filter((n) => n.startsWith(NOM))) {
  console.log(`${f.padEnd(28)} ${(fs.statSync(path.join(DST, f)).size / 1e6).toFixed(2)} Mo`);
}
