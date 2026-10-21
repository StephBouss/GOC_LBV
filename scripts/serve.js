#!/usr/bin/env node
/**
 * Serveur statique sans dépendance, pour la phase 2.
 *
 * Usage :  cd /tmp && nohup node /chemin/serve.js > /tmp/serve.log 2>&1 &
 *
 * Le "cd /tmp" n'est pas décoratif : sous macOS, un processus dont le
 * REPERTOIRE COURANT est protégé par TCC échoue sur
 * "EPERM: operation not permitted, uv_cwd".
 *
 * En revanche RACINE peut pointer n'importe où, y compris dans ~/Desktop ou
 * ~/Documents : le serveur lit sans difficulté un dossier que son cwd ne
 * pourrait pas occuper. Il n'y a donc aucune raison de déplacer le projet
 * hors du dossier de travail de l'utilisateur.
 *
 * Adapter RACINE au dossier qui contient index.html (par défaut, la racine du projet).
 */
const http = require('http');
const fs = require('fs');
const path = require('path');

const RACINE = process.env.RACINE || path.join(__dirname, '..');

// Le site est à la racine du projet, à côté des outils de travail : ceux-ci ne sont ni servis ni surveillés
// (comme sur Vercel, voir .vercelignore). Les dossiers cachés (.git, .claude…) sont toujours exclus.
const PRIVES = new Set(['sources', 'scripts', 'references', 'node_modules']);
const prive = (rel) => {
  const tete = rel.split(/[\\/]/).find(Boolean) || '';
  return tete.startsWith('.') || PRIVES.has(tete) || /\.md$/i.test(rel);
};
const PORT = Number(process.env.PORT || 4321);

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.pdf': 'application/pdf',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.ico': 'image/x-icon'
};

const RACINE_ABS = path.resolve(RACINE);

// En-têtes de sécurité : ceux que vercel.json déclare pour tout le site (règle « /(.*) » sans condition), appliqués aussi
// en local pour voir aussitôt ce que la politique de contenu (Content-Security-Policy) bloquerait en ligne.
// Le cache longue durée des adresses ?ver= (règle à condition « has ») reste propre à Vercel : en local, tout est
// servi en « no-store », pour qu'un fichier modifié s'affiche tout de suite.
const ENTETES_SECURITE = (() => {
  try {
    const config = JSON.parse(fs.readFileSync(path.join(RACINE_ABS, 'vercel.json'), 'utf8'));
    return (config.headers || []).filter((r) => r.source === '/(.*)' && !r.has).flatMap((r) => r.headers);
  } catch { return []; }
})();

// Rechargement automatique : chaque page HTML ouvre un flux SSE ; toute
// modification sous RACINE relance l'affichage des navigateurs connectés.
// Script externe (pas en ligne) : la politique de contenu n'autorise que les scripts du site.
const ABONNES = new Set();
const SCRIPT_RECHARGEMENT = '<script src="/__rechargement.js"></script>';
let minuterie = null;
const signaler = () => {
  clearTimeout(minuterie);
  minuterie = setTimeout(() => ABONNES.forEach((r) => r.write('data: recharger\n\n')), 150);
};
// Windows signale aussi les simples lectures (date de dernier accès) : on ne
// recharge que si la date de modification du fichier a réellement avancé.
const DEMARRAGE = Date.now();
const DATES = new Map();
fs.watch(RACINE_ABS, { recursive: true }, (type, nom) => {
  if (!nom || prive(nom)) return;
  const fichier = path.join(RACINE_ABS, nom);
  fs.stat(fichier, (err, st) => {
    if (err) return signaler();                 // fichier supprimé ou renommé
    if (st.isDirectory()) return;
    if (st.mtimeMs > (DATES.get(fichier) ?? DEMARRAGE)) { DATES.set(fichier, st.mtimeMs); signaler(); }
  });
});

const serveur = http.createServer((req, res) => {
  // un pourcentage mal formé dans l'URL ne doit pas tuer le serveur
  let rel;
  try { rel = decodeURIComponent(req.url.split('?')[0]); }
  catch (e) { res.writeHead(400, { 'Content-Type': 'text/plain' }); return res.end('400'); }

  for (const { key, value } of ENTETES_SECURITE) res.setHeader(key, value);

  if (rel === '/__rechargement.js') {
    res.writeHead(200, { 'Content-Type': 'text/javascript; charset=utf-8', 'Cache-Control': 'no-store' });
    return res.end('new EventSource("/__rechargement").onmessage = () => location.reload();\n');
  }
  if (rel === '/__rechargement') {
    res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-store', Connection: 'keep-alive' });
    res.write('\n');
    ABONNES.add(res);
    return req.on('close', () => ABONNES.delete(res));
  }

  // une adresse de dossier (/, /activites/) sert la page index.html du dossier, comme sur Vercel
  const fichier = path.join(RACINE_ABS, rel.endsWith('/') ? rel + 'index.html' : rel);

  // ne jamais servir hors de la racine — le séparateur final évite
  // qu'un dossier frère au nom préfixé (site vs siteX) passe le contrôle
  if (fichier !== RACINE_ABS && !fichier.startsWith(RACINE_ABS + path.sep)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    return res.end('403');
  }
  // les outils de travail ne font pas partie du site
  if (prive(path.relative(RACINE_ABS, fichier))) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    return res.end('404 — ' + rel);
  }

  // Vidéos et PDF : envoi par plages d'octets (en-tête Range), sans quoi le navigateur ne peut pas se
  // repositionner dans la vidéo (retour au début à chaque passage du diaporama de l'accueil),
  // et la liseuse PDF.js doit attendre le fichier entier avant d'afficher la première page
  const type = TYPES[path.extname(fichier)] || '';
  if (type.startsWith('video/') || type === 'application/pdf') {
    return fs.stat(fichier, (err, st) => {
      if (err) { res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }); return res.end('404 — ' + rel); }
      const entetes = { 'Content-Type': type, 'Accept-Ranges': 'bytes', 'Cache-Control': 'no-store' };
      const plage = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range || '');
      if (!plage || (!plage[1] && !plage[2])) {
        res.writeHead(200, { ...entetes, 'Content-Length': st.size });
        return fs.createReadStream(fichier).pipe(res);
      }
      // « bytes=500- », « bytes=500-999 » ou « bytes=-500 » (les 500 derniers octets)
      const debut = plage[1] ? Number(plage[1]) : Math.max(0, st.size - Number(plage[2]));
      const fin = plage[1] && plage[2] ? Math.min(Number(plage[2]), st.size - 1) : st.size - 1;
      if (debut >= st.size || debut > fin) { res.writeHead(416, { 'Content-Range': `bytes */${st.size}` }); return res.end(); }
      res.writeHead(206, { ...entetes, 'Content-Length': fin - debut + 1, 'Content-Range': `bytes ${debut}-${fin}/${st.size}` });
      fs.createReadStream(fichier, { start: debut, end: fin }).pipe(res);
    });
  }

  fs.readFile(fichier, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      return res.end('404 — ' + rel);
    }
    res.writeHead(200, {
      'Content-Type': TYPES[path.extname(fichier)] || 'application/octet-stream',
      'Cache-Control': 'no-store'
    });
    if (path.extname(fichier) === '.html') {
      data = data.toString('utf8').replace('</body>', SCRIPT_RECHARGEMENT + '</body>');
    }
    res.end(data);
  });
});

// Un port occupé (souvent l'ancien projet qui tourne encore) ne doit ni
// planter ni pousser à tuer le processus voisin : on essaie le suivant.
// Le port annoncé est lu sur le serveur lui-même, jamais déduit.
serveur.on('listening', () => {
  console.log('Site servi sur http://127.0.0.1:' + serveur.address().port + '  (racine : ' + RACINE + ')');
});
function ecouter(port, essaisRestants) {
  serveur.once('error', (err) => {
    if (err.code === 'EADDRINUSE' && essaisRestants > 0) {
      console.log('Port ' + port + ' occupé, essai sur ' + (port + 1));
      ecouter(port + 1, essaisRestants - 1);
    } else { throw err; }
  });
  serveur.listen(port, '127.0.0.1');
}
ecouter(PORT, 20);
