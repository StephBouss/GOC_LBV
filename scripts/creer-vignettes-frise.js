#!/usr/bin/env node
/**
 * Vignettes illustrées de la frise « Les dates clés » (page Historique & Gouvernance).
 * Illustrations vectorielles en aplats, aux couleurs de la charte : rouge GOC, noirs et gris, touches du drapeau gabonais.
 * Format 16:10 (320 × 200), affichées à 17,5rem de large au plus.
 *
 * Sortie : img/frise/<annee>-<sujet>.svg, et img/frise/en/<annee>-<sujet>.svg pour les vignettes qui portent un texte
 *          à traduire (la version anglaise du site nomme la société GOC, la version française SNHG)
 * Usage  : node scripts/creer-vignettes-frise.js
 * Pour remplacer une vignette par une photo, il suffit de changer le src de l'image dans sources/pages/historique-gouvernance.html.
 */
const fs = require('fs');
const path = require('path');

const SORTIE = path.join(__dirname, '..', 'img', 'frise');

/* Couleurs de la charte (voir css/styles.css) */
const R = '#ED1C24', RF = '#CC1219', N = '#14171B', E = '#33373D', ED = '#5E6268', A = '#818286', G = '#C9CACD', L = '#E3E4E6', S = '#F6F6F7', B = '#FFFFFF';
const V = '#009E60', J = '#FCD116', BL = '#3A75C4';
const ROSE = '#FDECEC', CIEL = '#E6EFF9', VERDURE = '#E1F2E8';
const POLICE = 'font-family="Archivo, \'Segoe UI\', Roboto, Arial, sans-serif"';

const svg = (titre, contenu, fond = S) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 200" width="320" height="200">
<title>${titre}</title>
<rect width="320" height="200" fill="${fond}"/>
${contenu.trim()}
</svg>
`;
const halo = (cx, cy, r, c) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${c}"/>`;
const ombre = (cx, cy, rx, ry = 5) => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${N}" opacity=".08"/>`;
const texte = (x, y, t, { taille = 12, couleur = N, ancre = 'middle', graisse = 700, espace = 0 } = {}) =>
  `<text x="${x}" y="${y}" text-anchor="${ancre}" font-size="${taille}" font-weight="${graisse}"${espace ? ` letter-spacing="${espace}"` : ''} fill="${couleur}" ${POLICE}>${t}</text>`;
/* Étiquette arrondie (lieu, chiffre) */
const pastille = (x, y, t, { fond = N, couleur = B, ancre = 'start', taille = 10 } = {}) => {
  const l = Math.round(t.length * (taille * 0.7 + 0.6) + 22);
  const x0 = ancre === 'middle' ? x - l / 2 : x;
  return `<rect x="${x0}" y="${y}" width="${l}" height="21" rx="10.5" fill="${fond}"/>${texte(x0 + l / 2, y + 14.5, t, { taille, couleur, espace: 0.6 })}`;
};
/* Goutte (emblème du logo GOC) : sommet en (cx, haut), hauteur h */
const goutte = (cx, haut, h, c) => {
  const r = h * 0.36;
  return `<path d="M${cx} ${haut} C${cx + r * 0.55} ${haut + h * 0.3} ${cx + r} ${haut + h * 0.44} ${cx + r} ${haut + h - r} A${r} ${r} 0 0 1 ${cx - r} ${haut + h - r} C${cx - r} ${haut + h * 0.44} ${cx - r * 0.55} ${haut + h * 0.3} ${cx} ${haut}Z" fill="${c}"/>`;
};
/* Épingle de carte, pointe en (x, y) */
const epingle = (x, y, c = R) =>
  `${ombre(x, y + 1, 9, 2.5)}<path d="M${x} ${y} C${x - 2} ${y - 9} ${x - 14} ${y - 15} ${x - 14} ${y - 26} A14 14 0 1 1 ${x + 14} ${y - 26} C${x + 14} ${y - 15} ${x + 2} ${y - 9} ${x} ${y}Z" fill="${c}"/><circle cx="${x}" cy="${y - 26}" r="5.5" fill="${B}"/>`;
/* Drapeau gabonais (vert, jaune, bleu) sur son mât, pied du mât en (x, sol) */
const drapeau = (x, sol, hMat, l = 40) => {
  const h = l * 0.7, y = sol - hMat;
  return `<line x1="${x}" y1="${y - 4}" x2="${x}" y2="${sol}" stroke="${E}" stroke-width="3" stroke-linecap="round"/>`
    + `<rect x="${x + 1.5}" y="${y}" width="${l}" height="${h / 3}" fill="${V}"/><rect x="${x + 1.5}" y="${y + h / 3}" width="${l}" height="${h / 3}" fill="${J}"/><rect x="${x + 1.5}" y="${y + 2 * h / 3}" width="${l}" height="${h / 3}" fill="${BL}"/>`;
};
/* Silhouette de personne (organigramme), centrée en (cx, cy) */
const personne = (cx, cy, c) => `<circle cx="${cx}" cy="${cy - 6}" r="5.5" fill="${c}"/><path d="M${cx - 10} ${cy + 10} C${cx - 10} ${cy + 1} ${cx - 5} ${cy} ${cx} ${cy} C${cx + 5} ${cy} ${cx + 10} ${cy + 1} ${cx + 10} ${cy + 10}Z" fill="${c}"/>`;
const fleche = (id, c) => `<marker id="${id}" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10Z" fill="${c}"/></marker>`;

/* Textes propres à chaque langue (sous-dossier de sortie, nom de la société, mots et titres des vignettes concernées) */
const LANGUES = {
  fr: {
    dossier: '', societe: 'SNHG', creation: ['CRÉATION', 'DE LA SNHG', 'Décret n°1017/PR/MMPH'], jv: 'JOINT-VENTURE', actifs: 'ACTIFS',
    titres: {
      creation: 'Création de la SNHG : décret signé',
      jv: 'Première joint-venture : deux partenaires qui s\'assemblent',
      consolidations: 'Consolidations : Addax, SMP et Tullow Oil Gabon rejoignent la SNHG',
      gouvernance: 'Structure et gouvernance renouvelées : organigramme et synergies du groupe',
    },
  },
  en: {
    dossier: 'en', societe: 'GOC', creation: ['FOUNDING', 'OF GOC', 'Decree No. 1017/PR/MMPH'], jv: 'JOINT VENTURE', actifs: 'ASSETS',
    titres: {
      creation: 'Founding of GOC: decree signed',
      jv: 'First joint venture: two partners coming together',
      consolidations: 'Consolidations: Addax, SMP and Tullow Oil Gabon join GOC',
      gouvernance: 'Renewed structure and governance: organisation chart and group synergies',
    },
  },
};

const vignettes = (T) => ({
  /* 2011 · Création de la société : décret signé, sceau et stylo-plume */
  '2011-creation-goc': [T.titres.creation, `
${halo(160, 100, 84, ROSE)}
${ombre(166, 186, 70, 5)}
<g transform="rotate(-4 166 104)">
  <rect x="108" y="22" width="124" height="158" rx="6" fill="${N}" opacity=".07" transform="translate(4 5)"/>
  <rect x="108" y="22" width="124" height="158" rx="6" fill="${B}" stroke="${L}"/>
  <rect x="152" y="32" width="12" height="3" fill="${V}"/><rect x="164" y="32" width="12" height="3" fill="${J}"/><rect x="176" y="32" width="12" height="3" fill="${BL}"/>
  ${texte(170, 55, T.creation[0], { taille: 13 })}
  ${texte(170, 70, T.creation[1], { taille: 13, couleur: R })}
  ${texte(170, 82, T.creation[2], { taille: 7, couleur: A, graisse: 600 })}
  <rect x="122" y="92" width="96" height="3" rx="1.5" fill="${L}"/><rect x="122" y="100" width="88" height="3" rx="1.5" fill="${L}"/>
  <rect x="122" y="108" width="96" height="3" rx="1.5" fill="${L}"/><rect x="122" y="116" width="70" height="3" rx="1.5" fill="${L}"/>
  <rect x="122" y="124" width="84" height="3" rx="1.5" fill="${L}"/>
  <line x1="156" y1="160" x2="220" y2="160" stroke="${G}" stroke-width="1"/>
  <path d="M158 155 C161 145 167 141 168 148 S165 157 169 154 S175 142 178 146 S177 156 181 153 S189 144 192 148 S195 153 201 149" fill="none" stroke="#1E3A8A" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="133" cy="154" r="14" fill="${R}"/>
  <circle cx="133" cy="154" r="10.5" fill="none" stroke="${B}" stroke-width="1" stroke-dasharray="2 1.6"/>
  ${goutte(133, 146.5, 14, B)}
</g>
<g transform="translate(222 136) rotate(-40)">
  <polygon points="-12,-3.4 -27,0 -12,3.4" fill="${G}"/>
  <line x1="-25" y1="0" x2="-15" y2="0" stroke="${A}" stroke-width=".9"/>
  <polygon points="0,-5.2 -12,-3.4 -12,3.4 0,5.2" fill="${E}"/>
  <rect x="0" y="-5.6" width="68" height="11.2" rx="5.6" fill="${N}"/>
  <rect x="20" y="-5.6" width="5" height="11.2" fill="${R}"/>
  <rect x="36" y="-8.4" width="28" height="3.2" rx="1.6" fill="${G}"/>
</g>`],

  /* 2012 · Premiers pas d'un opérateur national : premier CEPP, champ de Remboué */
  '2012-premier-cepp-remboue': ['Premier CEPP : chevalet de pompage sur le champ de Remboué', `
${halo(128, 108, 82, VERDURE)}
<g fill="#D3EADB"><circle cx="18" cy="160" r="16"/><circle cx="44" cy="156" r="18"/><circle cx="196" cy="158" r="15"/><circle cx="226" cy="154" r="19"/><circle cx="300" cy="158" r="17"/></g>
<rect y="160" width="320" height="40" fill="#E3F1E8"/>
<line x1="0" y1="160" x2="320" y2="160" stroke="#CBE3D3" stroke-width="2"/>
${ombre(132, 164, 74, 4)}
<rect x="64" y="152" width="122" height="9" rx="2" fill="${E}"/>
<path d="M118 152 L130 92 L142 152" fill="none" stroke="${E}" stroke-width="5" stroke-linejoin="round"/>
<line x1="123" y1="128" x2="137" y2="128" stroke="${E}" stroke-width="3"/>
<rect x="150" y="128" width="30" height="24" rx="3" fill="${E}"/>
<line x1="170" y1="92" x2="166" y2="134" stroke="${E}" stroke-width="4" stroke-linecap="round"/>
<path d="M166 134 m-16 0 a16 16 0 0 0 32 0Z" fill="${N}"/>
<line x1="70" y1="104" x2="70" y2="152" stroke="${A}" stroke-width="2"/>
<rect x="63" y="144" width="14" height="9" rx="1.5" fill="${E}"/>
<g transform="rotate(-9 130 90)">
  <rect x="76" y="84" width="104" height="10" rx="3" fill="${R}"/>
  <path d="M80 80 C66 82 60 92 61 104 C62 112 66 118 70 122 L76 119 C72 113 70 106 71 99 C72 91 76 87 82 86Z" fill="${RF}"/>
  <circle cx="130" cy="89" r="5" fill="${N}"/>
</g>
${drapeau(266, 160, 92, 40)}
${pastille(20, 20, 'REMBOUÉ')}`],

  /* 2013–2014 · Arrivée sur le champ d'Obangue : derrick et casque de chantier */
  '2013-champ-obangue': ['Premières opérations directes sur le champ d\'Obangue', `
${halo(206, 92, 78, CIEL)}
<circle cx="262" cy="46" r="15" fill="${J}"/>
<rect y="164" width="320" height="36" fill="#E9EAEC"/>
<g stroke="${E}" stroke-linecap="round">
  <line x1="182" y1="164" x2="202" y2="34" stroke-width="4"/><line x1="230" y1="164" x2="210" y2="34" stroke-width="4"/>
  <g stroke-width="1.8"><line x1="186" y1="138" x2="226" y2="138"/><line x1="190" y1="112" x2="222" y2="112"/><line x1="194" y1="86" x2="218" y2="86"/><line x1="198" y1="60" x2="214" y2="60"/>
  <line x1="186" y1="138" x2="222" y2="112"/><line x1="226" y1="138" x2="190" y2="112"/><line x1="190" y1="112" x2="218" y2="86"/><line x1="222" y1="112" x2="194" y2="86"/><line x1="194" y1="86" x2="214" y2="60"/><line x1="218" y1="86" x2="198" y2="60"/></g>
</g>
<rect x="198" y="26" width="16" height="9" rx="1.5" fill="${R}"/>
<rect x="168" y="150" width="76" height="8" fill="${N}"/>
<rect x="244" y="134" width="34" height="30" rx="2" fill="${R}"/><rect x="252" y="141" width="18" height="9" rx="1" fill="${B}" opacity=".9"/>
${ombre(98, 170, 58, 6)}
<path d="M44 160 C78 152 118 152 152 160 C151 166 148 169 144 169 C114 164 82 164 52 169 C48 169 45 166 44 160Z" fill="${RF}"/>
<path d="M52 158 C52 122 70 98 98 97 C126 98 144 122 144 158Z" fill="${R}"/>
<path d="M92 98 C92 96 94 95 98 95 C102 95 104 96 104 98 L105 157 L91 157Z" fill="${RF}" opacity=".55"/>
<path d="M64 146 C64 128 72 114 84 107" fill="none" stroke="${B}" stroke-width="4" stroke-linecap="round" opacity=".35"/>
${goutte(124, 120, 22, B)}
${pastille(20, 20, 'OBANGUE')}`],

  /* Octobre 2014 · Première joint-venture : deux pièces qui s'assemblent, partenaire maritime */
  '2014-joint-venture': [T.titres.jv, `
${halo(162, 92, 78, ROSE)}
<path d="M0 172 Q20 164 40 172 T80 172 T120 172 T160 172 T200 172 T240 172 T280 172 T320 172 V200 H0Z" fill="${CIEL}"/>
<path d="M0 182 Q20 175 40 182 T80 182 T120 182 T160 182 T200 182 T240 182 T280 182 T320 182" fill="none" stroke="${BL}" stroke-width="1.5" opacity=".35"/>
<path d="M238 168 H292 L284 178 H246Z" fill="${E}"/><rect x="250" y="154" width="20" height="14" rx="1.5" fill="${B}" stroke="${E}" stroke-width="1.5"/><rect x="274" y="160" width="10" height="8" fill="${E}"/>
${ombre(162, 142, 72, 5)}
<rect x="166" y="58" width="82" height="72" rx="9" fill="${BL}"/>
<circle cx="168" cy="94" r="15" fill="${ROSE}"/>
<rect x="84" y="58" width="78" height="72" rx="9" fill="${R}"/>
<circle cx="168" cy="94" r="12" fill="${R}"/>
${texte(123, 99, T.societe, { taille: 15, couleur: B })}
${texte(215, 98, 'BOURBON', { taille: 9, couleur: B, espace: 0.3 })}
${pastille(20, 20, T.jv)}`],

  /* Septembre 2016 · Expansion sur le CEPP Mboga II : bloc de permis mis en avant sur la carte */
  '2016-cepp-mboga': ['Expansion sur le CEPP Mboga II : nouveau bloc sur la carte des permis', `
<path d="M0 0 H74 C58 40 82 74 60 112 C44 140 58 172 48 200 H0Z" fill="${CIEL}"/>
<g fill="${B}" stroke="${G}" stroke-width="1.5" stroke-linejoin="round">
  <polygon points="96,26 170,20 176,82 102,88"/><polygon points="170,20 248,26 246,84 176,82"/><polygon points="248,26 304,36 300,88 246,84"/>
  <polygon points="102,88 176,82 180,148 94,154"/><polygon points="246,84 300,88 304,150 254,148"/>
  <polygon points="94,154 180,148 178,196 88,198"/><polygon points="180,148 254,148 258,196 178,196"/><polygon points="254,148 304,150 306,196 258,196"/>
</g>
<polygon points="168,74 256,76 266,158 170,158" fill="none" stroke="${R}" stroke-width="1.5" stroke-dasharray="5 4" opacity=".7"/>
<polygon points="176,82 246,84 254,148 180,148" fill="${R}"/>
${texte(214, 112, 'MBOGA II', { taille: 12, couleur: B })}
${texte(214, 128, 'CEPP', { taille: 9, couleur: B, graisse: 600, espace: 1 })}
<g stroke="${R}" stroke-width="2.2" stroke-linecap="round" fill="none">
  <path d="M262 70 L276 58 M276 58 H268 M276 58 V66"/><path d="M272 164 L284 176 M284 176 H276 M284 176 V168"/><path d="M162 164 L150 176 M150 176 H158 M150 176 V168"/>
</g>`],

  /* Décembre 2018 · Reprise des participations de l'État : porte-documents et 32 participations */
  '2018-participations-etat': ['32 participations de l\'État reprises en gestion', `
${halo(136, 104, 80, ROSE)}
<g transform="translate(-16 0)">
${ombre(150, 176, 66, 5)}
<g transform="rotate(-14 150 130)"><rect x="104" y="44" width="58" height="76" rx="4" fill="${B}" stroke="${L}"/><rect x="114" y="56" width="38" height="3" rx="1.5" fill="${L}"/><rect x="114" y="64" width="30" height="3" rx="1.5" fill="${L}"/></g>
<g transform="rotate(12 150 130)"><rect x="138" y="44" width="58" height="76" rx="4" fill="${B}" stroke="${L}"/><circle cx="167" cy="70" r="12" fill="${L}"/><path d="M167 70 V58 A12 12 0 0 1 178.4 73.7Z" fill="${R}"/></g>
<g><rect x="121" y="36" width="58" height="76" rx="4" fill="${B}" stroke="${L}"/><rect x="131" y="48" width="38" height="3" rx="1.5" fill="${G}"/><rect x="131" y="56" width="28" height="3" rx="1.5" fill="${L}"/><rect x="131" y="64" width="34" height="3" rx="1.5" fill="${L}"/></g>
<path d="M136 96 V88 C136 84 138 82 142 82 H158 C162 82 164 84 164 88 V96" fill="none" stroke="${N}" stroke-width="5"/>
<rect x="94" y="94" width="112" height="76" rx="9" fill="${N}"/>
<rect x="94" y="116" width="112" height="9" fill="${R}"/>
<rect x="143" y="111" width="14" height="19" rx="3" fill="${J}"/>
</g>
<circle cx="250" cy="62" r="32" fill="${R}"/>
<circle cx="250" cy="62" r="27" fill="none" stroke="${B}" stroke-width="1" stroke-dasharray="2 2" opacity=".7"/>
${texte(250, 71, '32', { taille: 26, couleur: B })}
${pastille(250, 104, 'PARTICIPATIONS', { ancre: 'middle', taille: 9 })}`],

  /* Juin 2019 · Montée en puissance : histogramme ascendant */
  '2019-montee-en-puissance': ['Montée en puissance : des actifs en hausse', `
${halo(166, 104, 84, CIEL)}
<line x1="74" y1="34" x2="74" y2="164" stroke="${G}" stroke-width="2" stroke-linecap="round"/>
<line x1="74" y1="164" x2="270" y2="164" stroke="${G}" stroke-width="2" stroke-linecap="round"/>
<rect x="90" y="128" width="30" height="36" rx="4" fill="${G}"/>
<rect x="132" y="106" width="30" height="58" rx="4" fill="${A}"/>
<rect x="174" y="80" width="30" height="84" rx="4" fill="${E}"/>
<rect x="216" y="50" width="30" height="114" rx="4" fill="${R}"/>
<defs>${fleche('f2019', R)}</defs>
<polyline points="96,112 140,90 182,66 228,34" fill="none" stroke="${N}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" marker-end="url(#f2019)"/>
${pastille(20, 20, 'DUSSAFU · EZANGA')}`],

  /* 2023 · Récupération de 40 % du CEPP Atora : anneau de 40 % */
  '2023-cepp-atora': ['40 % du CEPP Atora récupérés', `
${halo(160, 92, 80, ROSE)}
<circle cx="160" cy="88" r="50" fill="none" stroke="${L}" stroke-width="20"/>
<circle cx="160" cy="88" r="50" fill="none" stroke="${R}" stroke-width="20" stroke-dasharray="125.66 314.16" transform="rotate(-90 160 88)"/>
<circle cx="160" cy="88" r="38" fill="${B}"/>
${texte(160, 96, '40&#160;%', { taille: 22 })}
${pastille(160, 160, 'CEPP ATORA', { ancre: 'middle' })}`],

  /* Mars 2024 · Opérateur des permis Dinonga et Irondou : carte topographique et deux épingles */
  '2024-dinonga-irondu': ['Opérateur des permis Dinonga et Irondou', `
<g fill="none" stroke="#DADBDE" stroke-width="1.3">
  <path d="M40 120 C40 84 80 70 112 76 C150 84 160 116 140 140 C120 162 64 160 48 146 C42 140 40 130 40 120Z"/>
  <path d="M62 120 C62 98 86 90 108 94 C132 98 138 118 126 132 C112 146 76 146 66 136 C63 132 62 126 62 120Z"/>
  <path d="M84 120 C84 108 96 104 106 106 C118 108 120 118 114 124 C106 132 90 132 86 126Z"/>
  <path d="M180 76 C186 44 230 30 262 42 C294 54 300 88 280 108 C258 128 206 126 190 110 C182 102 178 90 180 76Z"/>
  <path d="M200 80 C204 60 232 52 252 60 C274 68 276 90 262 100 C246 112 214 110 204 100 C200 94 199 88 200 80Z"/>
  <path d="M220 82 C222 72 238 68 248 72 C258 76 258 88 250 92 C240 98 224 96 221 90Z"/>
</g>
<path d="M0 176 C50 160 80 182 130 170 C180 158 210 178 260 166 C290 159 306 162 320 158" fill="none" stroke="#C3D9F0" stroke-width="6" stroke-linecap="round"/>
<path d="M104 92 Q164 34 228 66" fill="none" stroke="${N}" stroke-width="1.6" stroke-dasharray="4 4" opacity=".45"/>
${epingle(104, 122)}
${epingle(232, 96)}
${pastille(104, 132, 'DINONGA', { ancre: 'middle' })}
${pastille(232, 106, 'IRONDOU', { ancre: 'middle' })}`],

  /* Juin 2024 · Acquisition historique d'Assala Energy : installations et 100 % */
  '2024-acquisition-assala': ['Acquisition de 100 % d\'Assala Energy', `
${halo(160, 100, 84, CIEL)}
<rect y="164" width="320" height="36" fill="#E9EAEC"/>
<line x1="132" y1="152" x2="232" y2="152" stroke="${A}" stroke-width="4"/>
<path d="M88 106 Q123 92 158 106 V164 H88Z" fill="${B}" stroke="${E}" stroke-width="2" stroke-linejoin="round"/>
<rect x="88" y="126" width="70" height="7" fill="${R}"/>
<line x1="88" y1="146" x2="158" y2="146" stroke="${L}" stroke-width="1.5"/>
<path d="M166 124 Q189 115 212 124 V164 H166Z" fill="${B}" stroke="${E}" stroke-width="2" stroke-linejoin="round"/>
<rect x="166" y="140" width="46" height="5" fill="${R}"/>
<line x1="246" y1="52" x2="246" y2="164" stroke="${E}" stroke-width="4"/>
<line x1="238" y1="164" x2="246" y2="120" stroke="${E}" stroke-width="2"/><line x1="254" y1="164" x2="246" y2="120" stroke="${E}" stroke-width="2"/>
<path d="M246 22 C256 32 258 42 246 52 C234 42 236 32 246 22Z" fill="#FF9800"/>
<path d="M246 33 C251 38 251 44 246 50 C241 44 241 38 246 33Z" fill="${J}"/>
${drapeau(282, 164, 70, 30)}
<g transform="rotate(-12 64 62)">
  <circle cx="64" cy="62" r="34" fill="${R}"/>
  <circle cx="64" cy="62" r="28" fill="none" stroke="${B}" stroke-width="1.2" stroke-dasharray="2.4 2" opacity=".8"/>
  ${texte(64, 68, '100&#160;%', { taille: 17, couleur: B })}
</g>
${pastille(160, 172, 'ASSALA ENERGY', { ancre: 'middle' })}`],

  /* 2024–2025 · L'ère des consolidations : trois actifs convergent vers la SNHG */
  '2024-consolidations': [T.titres.consolidations, `
${halo(160, 100, 62, ROSE)}
<defs>${fleche('f2025', E)}</defs>
<g stroke="${E}" stroke-width="2" stroke-linecap="round" fill="none" marker-end="url(#f2025)">
  <line x1="92" y1="58" x2="128" y2="80"/><line x1="92" y1="146" x2="128" y2="124"/><line x1="232" y1="102" x2="196" y2="102"/>
</g>
${ombre(160, 150, 30, 4)}
${goutte(160, 52, 92, R)}
${texte(160, 124, T.societe, { taille: 11, couleur: B, espace: 0.6 })}
<g fill="${B}" stroke="${E}" stroke-width="2"><circle cx="66" cy="44" r="27"/><circle cx="66" cy="158" r="27"/><circle cx="260" cy="102" r="27"/></g>
${texte(66, 48, 'ADDAX', { taille: 10 })}
${texte(66, 162, 'SMP', { taille: 11 })}
${texte(260, 106, 'GOP', { taille: 11 })}`],

  /* 2025 · Structure, gouvernance et vision renouvelée : organigramme et synergies */
  '2025-gouvernance': [T.titres.gouvernance, `
${halo(160, 100, 84, ROSE)}
<g stroke="${R}" stroke-width="2" fill="none"><path d="M160 72 V88 M82 88 H238 M82 88 V102 M160 88 V102 M238 88 V102"/></g>
<rect x="124" y="24" width="72" height="48" rx="8" fill="${R}"/>
${personne(160, 42, B)}
${texte(160, 66, T.societe, { taille: 10, couleur: B, espace: 0.6 })}
<g fill="${B}" stroke="${L}" stroke-width="1.5"><rect x="46" y="102" width="72" height="48" rx="8"/><rect x="124" y="102" width="72" height="48" rx="8"/><rect x="202" y="102" width="72" height="48" rx="8"/></g>
${personne(82, 120, E)}${personne(160, 120, E)}${personne(238, 120, E)}
${texte(82, 144, 'GAB\'OIL', { taille: 9.5 })}${texte(160, 144, 'SMP', { taille: 9.5 })}${texte(238, 144, T.actifs, { taille: 9.5 })}
<defs>${fleche('fsyn', A)}</defs>
<line x1="70" y1="170" x2="250" y2="170" stroke="${A}" stroke-width="1.8" stroke-dasharray="5 4" marker-start="url(#fsyn)" marker-end="url(#fsyn)"/>
${texte(160, 188, 'SYNERGIES', { taille: 8.5, couleur: ED, espace: 1.2 })}`],

  /* Cap vers 2030 · Avenir énergétique souverain et durable : soleil levant, éolienne, solaire */
  '2030-avenir-durable': ['Cap vers 2030 : énergies d\'avenir', `
<circle cx="214" cy="150" r="38" fill="${J}"/>
<g stroke="${J}" stroke-width="3" stroke-linecap="round"><line x1="214" y1="98" x2="214" y2="86"/><line x1="176" y1="114" x2="168" y2="106"/><line x1="252" y1="114" x2="260" y2="106"/><line x1="160" y1="142" x2="148" y2="140"/><line x1="268" y1="142" x2="280" y2="140"/></g>
<path d="M0 150 Q60 126 120 144 T240 142 T320 136 V200 H0Z" fill="#BFE3CC"/>
<path d="M0 172 Q86 150 170 168 T320 162 V200 H0Z" fill="${V}"/>
<g>
  <polygon points="74,166 78,166 77,70 75,70" fill="${B}" stroke="${G}" stroke-width="1"/>
  <g fill="${B}" stroke="${G}" stroke-width="1">
    <path d="M76 68 C73 56 74 44 76 34 C78 44 79 56 76 68Z"/>
    <path d="M76 68 C73 56 74 44 76 34 C78 44 79 56 76 68Z" transform="rotate(120 76 68)"/>
    <path d="M76 68 C73 56 74 44 76 34 C78 44 79 56 76 68Z" transform="rotate(240 76 68)"/>
  </g>
  <circle cx="76" cy="68" r="4" fill="${E}"/>
</g>
<g transform="translate(118 96) scale(.66)">
  <polygon points="-2,96 2,96 1,2 -1,2" fill="${B}" stroke="${G}" stroke-width="1.4"/>
  <g fill="${B}" stroke="${G}" stroke-width="1.4">
    <path d="M0 0 C-3 -12 -2 -24 0 -34 C2 -24 3 -12 0 0Z" transform="rotate(30)"/>
    <path d="M0 0 C-3 -12 -2 -24 0 -34 C2 -24 3 -12 0 0Z" transform="rotate(150)"/>
    <path d="M0 0 C-3 -12 -2 -24 0 -34 C2 -24 3 -12 0 0Z" transform="rotate(270)"/>
  </g>
  <circle r="5" fill="${E}"/>
</g>
<line x1="276" y1="178" x2="276" y2="160" stroke="${E}" stroke-width="3"/>
<polygon points="246,162 300,162 310,136 256,136" fill="${BL}"/>
<g stroke="${B}" stroke-width="1.2" opacity=".75"><line x1="251" y1="149" x2="305" y2="149"/><line x1="264" y1="136" x2="259" y2="162"/><line x1="282" y1="136" x2="277" y2="162"/><line x1="300" y1="136" x2="295" y2="162"/></g>
${texte(22, 46, '2030', { taille: 30, ancre: 'start' })}
<rect x="24" y="54" width="22" height="4" fill="${V}"/><rect x="46" y="54" width="22" height="4" fill="${J}"/><rect x="68" y="54" width="22" height="4" fill="${BL}"/>`, '#F3F8F4'],
});

/* Le français écrit toutes les vignettes ; une autre langue n'écrit que celles dont le dessin change (texte traduit) */
const reference = vignettes(LANGUES.fr);
for (const [langue, T] of Object.entries(LANGUES)) {
  const dossier = path.join(SORTIE, T.dossier);
  fs.mkdirSync(dossier, { recursive: true });
  let n = 0;
  for (const [nom, [titre, contenu, fond]] of Object.entries(vignettes(T))) {
    if (langue !== 'fr' && contenu === reference[nom][1]) continue;
    fs.writeFileSync(path.join(dossier, `${nom}.svg`), svg(titre, contenu, fond));
    n++;
  }
  console.log(`${n} vignettes écrites dans ${path.relative(process.cwd(), dossier)}`);
}
