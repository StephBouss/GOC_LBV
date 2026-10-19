#!/usr/bin/env node
/**
 * Télécharge Archivo depuis Google Fonts (graisses 400 à 700, largeur normale)
 * et l'enregistre dans maquette/fonts pour un hébergement local.
 * Les visiteurs reçoivent la police avec le site : aucune dépendance aux polices
 * installées sur leur appareil, aucun appel aux serveurs de Google à la visite.
 *
 * Usage : node scripts/telecharger-police.js
 */
const fs = require('fs');
const path = require('path');

const DOSSIER = path.join(__dirname, '..', 'maquette', 'fonts');
const API = 'https://fonts.googleapis.com/css2?family=Archivo:wght@400..700&display=swap';
// Un navigateur récent obtient des fichiers WOFF2 variables.
const NAVIGATEUR = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36';

(async () => {
  const css = await (await fetch(API, { headers: { 'User-Agent': NAVIGATEUR } })).text();
  const blocs = [...css.matchAll(/\/\* ([\w-]+) \*\/\s*@font-face \{([^}]*)\}/g)];
  const retenus = blocs.filter(([, sousEnsemble]) => sousEnsemble === 'latin' || sousEnsemble === 'latin-ext');
  if (!retenus.length) throw new Error('Réponse inattendue de Google Fonts');
  fs.mkdirSync(DOSSIER, { recursive: true });
  for (const [, sousEnsemble, corps] of retenus) {
    const url = corps.match(/url\((https:[^)]+\.woff2)\)/)[1];
    const plage = corps.match(/unicode-range: ([^;]+);/)[1];
    const fichier = `archivo-${sousEnsemble}.woff2`;
    const donnees = Buffer.from(await (await fetch(url)).arrayBuffer());
    fs.writeFileSync(path.join(DOSSIER, fichier), donnees);
    console.log(`${fichier}  ${Math.round(donnees.length / 1024)} Ko  ${corps.match(/font-weight: ([^;]+);/)[1]}`);
    console.log(`  unicode-range: ${plage}`);
  }
})().catch((e) => { console.error(e.message); process.exit(1); });
