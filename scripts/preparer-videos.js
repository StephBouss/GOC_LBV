#!/usr/bin/env node
/**
 * Prépare les vidéos des diapositives de l'accueil (sources/diaporama-accueil.json) depuis les vidéos du client (hors du
 * dépôt : « GOC Vidéos/Hero »). Sans son ; WebM (VP9) proposé d'abord aux navigateurs qui le lisent, MP4 (H.264, index
 * en tête) pour les autres. Pour chaque vidéo <nom> :
 *
 *  video/<nom>-1080p.webm|.mp4   ordinateur et tablette, 1920 × 1080
 *  video/<nom>-mobile.webm|.mp4  téléphone, 608 × 1080 (9:16) : la bande verticale que le hero montre sur un téléphone,
 *                                cadrée sur le sujet (« bande »), sans agrandir l'image d'origine
 *  video/<nom>-affiche.jpg       affiche : première image de la version large, affichée tant que la vidéo n'a pas démarré
 *                                (préchargée pour la première diapositive ; à la place de la vidéo en mode économie de données)
 *
 * « cadres » : image utile au format 16:9, en pixels de la source [x, y, largeur, hauteur], à partir de l'instant « debut »
 * (secondes) ; retire les bandes noires d'un plan au format cinéma. Relevé : ffmpeg -i <vidéo> -vf fps=4,cropdetect -f null -
 * « bande » : centre de la bande verticale (fraction de la largeur de la source) à des instants donnés. Entre deux instants,
 * la bande glisse (fondu enchaîné, sujet qui se déplace) ; deux instants pris entre deux images font une coupe franche.
 * Relevé des plans : ffmpeg -i <vidéo> -vf scdet=threshold=4 -f null -  (les fondus n'y apparaissent pas : regarder les images)
 * Usage : node scripts/preparer-videos.js [champs|personnel|faune…] [large|mobile]   (tout par défaut ; dossier des vidéos
 * modifiable par VIDEOS_SOURCE ; ffmpeg requis)
 */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const RACINE = path.join(__dirname, '..');
const SOURCE = process.env.VIDEOS_SOURCE || path.join(RACINE, '..', 'Img', 'Inspiration images', 'Site web GOC', 'GOC Vidéos', 'Hero');
const DST = path.join(RACINE, 'video');

// Vidéos fournies le 28/10/2026, en 1920 × 1080 à 24 images/s
const VIDEOS = [
  {
    nom: 'hero-champs', source: 'Chantier.mp4',   // champs terrestres et offshore, 16 s
    cadres: [
      { debut: 0, cadre: [62, 34, 1796, 1010] },   // bandes noires de 33 px jusqu'à la coupe
      { debut: 11.75, cadre: [0, 0, 1920, 1080] },
    ],
    bande: [
      [0, 0.48], [2.8, 0.48],         // forêt et base vie, vue aérienne
      [3.2, 0.55], [5.8, 0.55],       // site terrestre dégagé
      [6.2, 0.42], [8.8, 0.42],       // village et piste
      [9.2, 0.47], [11.72, 0.47],     // plateforme de forage en mer
      [11.73, 0.42], [13.65, 0.42],   // pied de la plateforme, en contre-plongée (coupe franche)
      [14.1, 0.32],                   // pont de la plateforme et pied gauche
    ],
  },
  {
    nom: 'hero-personnel', source: 'Personnel technique et administratif.mp4',   // personnel technique et administratif, 8 s
    cadres: [{ debut: 0, cadre: [0, 0, 1920, 1080] }],
    bande: [
      [0, 0.52], [3.1, 0.52],         // laborantine en combinaison : flacon et visage
      [3.11, 0.49],                   // deux cadres et leurs documents (coupe franche)
    ],
  },
  {
    nom: 'hero-faune', source: 'Faune et Flore.mp4',   // faune et flore, 10 s
    cadres: [{ debut: 0, cadre: [0, 0, 1920, 1080] }],
    bande: [
      // Perroquet gris en vol vers la droite : la bande suit sa tête (la queue peut sortir du cadre)
      [0, 0.84], [1, 0.84], [1.5, 0.79], [2, 0.75], [2.5, 0.7], [3, 0.67], [3.5, 0.65], [4, 0.64], [4.5, 0.68], [5.02, 0.76],
      [5.03, 0.62],                   // plage bordée de forêt (coupe franche)
    ],
  },
];
const SORTIES = {
  large: { taille: [1920, 1080], webm: 38, mp4: 27, suffixe: '1080p' },
  mobile: { taille: [608, 1080], webm: 40, mp4: 28, suffixe: 'mobile' },
};

const pair = (n) => 2 * Math.round(n / 2);
const nombre = (n) => String(Number(n.toFixed(3)));

// Position de la bande verticale (largeur l) dans une source de largeur L : interpolée entre les instants de « bande »
function positionVerticale(bande, l, L) {
  const points = bande.map(([t, centre]) => ({ t, x: Math.min(Math.max(pair(centre * L - l / 2), 0), L - l) }));
  return points.slice(1).reduceRight((suite, b, i) => {
    const a = points[i];
    const valeur = a.x === b.x ? `${a.x}` : `${a.x}${b.x > a.x ? '+' : '-'}${Math.abs(b.x - a.x)}*(t-${nombre(a.t)})/${nombre(b.t - a.t)}`;
    return `if(lt(t,${nombre(b.t)}),${valeur},${suite})`;
  }, `${points[points.length - 1].x}`);
}

// Vidéos et versions à préparer : toutes, ou celles nommées sur la ligne de commande (l'encodage complet est long)
const args = process.argv.slice(2);
const choisies = VIDEOS.filter((v) => !args.some((a) => !SORTIES[a]) || args.includes(v.nom.replace('hero-', '')));
const voulues = args.some((a) => SORTIES[a]) ? args.filter((a) => SORTIES[a]) : Object.keys(SORTIES);
args.forEach((a) => { if (!SORTIES[a] && !VIDEOS.some((v) => v.nom === `hero-${a}`)) throw new Error(`inconnu : ${a}`); });

fs.mkdirSync(DST, { recursive: true });
for (const video of choisies) {
  const source = path.join(SOURCE, video.source);
  const [largeurSource] = execFileSync('ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width', '-of', 'csv=p=0', source]).toString().trim().split(',').map(Number);
  const segments = video.cadres.map((c, i) => ({ ...c, fin: video.cadres[i + 1]?.debut }));
  const recadrages = {
    large: ([x, y, l, h]) => `crop=${l}:${h}:${x}:${y}`,
    mobile: ([, y, , h]) => { const l = pair((h * 9) / 16); return `crop=w=${l}:h=${h}:x='${positionVerticale(video.bande, l, largeurSource)}':y=${y}`; },
  };
  // Chaque partie est découpée puis recadrée (le temps t du recadrage reste celui de la source), puis toutes sont recollées
  const decoupe = (s) => `trim=start=${s.debut}${s.fin === undefined ? '' : `:end=${s.fin}`}`;
  const morceaux = [`[0]split=${segments.length * voulues.length}${segments.flatMap((s, i) => voulues.map((v) => `[${v}${i}]`)).join('')}`];
  for (const v of voulues) {
    const [L, H] = SORTIES[v].taille;
    segments.forEach((s, i) => morceaux.push(
      `[${v}${i}]${decoupe(s)},${recadrages[v](s.cadre)},setpts=PTS-STARTPTS,scale=${L}:${H}:flags=lanczos,setsar=1[${v}-${i}]`));
    morceaux.push(`${segments.map((s, i) => `[${v}-${i}]`).join('')}concat=n=${segments.length}:v=1:a=0,format=yuv420p,split=2[${v}-webm][${v}-mp4]`);
  }
  const sorties = voulues.flatMap((v) => {
    const o = SORTIES[v];
    const fichier = path.join(DST, `${video.nom}-${o.suffixe}`);
    return [
      '-map', `[${v}-webm]`, '-c:v', 'libvpx-vp9', '-b:v', '0', '-crf', String(o.webm), '-row-mt', '1', '-deadline', 'good', '-cpu-used', '2',
      '-an', '-map_metadata', '-1', `${fichier}.webm`,
      '-map', `[${v}-mp4]`, '-c:v', 'libx264', '-preset', 'veryslow', '-crf', String(o.mp4), '-profile:v', 'high',
      '-an', '-movflags', '+faststart', '-map_metadata', '-1', `${fichier}.mp4`,
    ];
  });
  execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', source, '-filter_complex', morceaux.join(';'), ...sorties], { stdio: 'inherit' });

  // Affiche : première image de la version large
  const [x, y, l, h] = segments[0].cadre;
  execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', source, '-frames:v', '1',
    '-vf', `crop=${l}:${h}:${x}:${y},scale=${SORTIES.large.taille.join(':')}:flags=lanczos,format=yuvj420p`,
    '-q:v', '5', '-map_metadata', '-1', path.join(DST, `${video.nom}-affiche.jpg`)]);

  for (const f of fs.readdirSync(DST).filter((n) => n.startsWith(`${video.nom}-`))) {
    console.log(`${f.padEnd(30)} ${(fs.statSync(path.join(DST, f)).size / 1e6).toFixed(2)} Mo`);
  }
}
