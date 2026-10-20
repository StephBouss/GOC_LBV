# Site web Gabon Oil Company (SNHG)

Maquette HTML, CSS et JavaScript du site institutionnel de la Société nationale des hydrocarbures du Gabon (SNHG), Gabon Oil Company. Elle préfigure le futur thème WordPress : les contenus appelés à être gérés dans l'administration (actualités, diaporama d'accueil, galeries de la médiathèque, rapport PDF) sont déjà séparés de la mise en page.

## Structure

| Dossier | Contenu |
|---|---|
| `maquette/` | Le site prêt à servir : 27 pages HTML, `css/`, `js/` (dont PDF.js dans `js/pdfjs/`), `img/`, `video/`, `documents/`, `fonts/` |
| `sources/` | Sources des pages : gabarit commun, contenu de chaque page, données des actualités, du diaporama et de la médiathèque |
| `scripts/` | Génération des pages, serveur local, préparation des médias |
| `INVENTAIRE.md` | État du site : pages créées, pages à créer, photos à remplacer, textes à relire, points WordPress |

## Consulter le site

```bash
node scripts/serve.js
```

Le site est alors visible sur http://127.0.0.1:4321, et la page se recharge à chaque modification. Il ne faut aucune dépendance, seulement Node.js 20 ou plus récent.

La version en ligne est publiée par Vercel à chaque envoi sur GitHub : https://snhg-vert.vercel.app. Le fichier `vercel.json` lui indique de ne publier que le dossier `maquette/`.

Tout serveur statique pointé sur `maquette/` convient aussi, à condition qu'il accepte les requêtes partielles (en-tête `Range`), ce qui est le cas d'Apache et de Nginx. Les vidéos de l'accueil et la liseuse PDF en ont besoin. Ouvrir les fichiers directement depuis le disque ne suffit pas : la liseuse PDF ne fonctionnerait pas.

## Modifier le site

Les pages `maquette/*.html` sont générées : on ne les modifie jamais à la main.

1. Modifier les sources :
   - `sources/gabarit.html` pour l'en-tête, les menus et le pied de page ;
   - `sources/pages/*.html` pour le contenu de chaque page ;
   - `sources/actualites.json` pour les articles (l'accueil affiche les 3 plus récents, la page Actualités les 20 plus récents) ;
   - `sources/diaporama-accueil.json` pour les diapositives de l'accueil ;
   - `sources/mediatheque.json` pour les galeries de la médiathèque (titre, texte, photos et leurs légendes).
2. Régénérer les pages :

   ```bash
   node scripts/assembler-pages.js              # une fois
   node scripts/assembler-pages.js --surveiller # à chaque enregistrement
   ```

La navigation (menu, menu mobile, plan du pied de page) se règle en tête de `scripts/assembler-pages.js`. La mise en page des articles est dans `scripts/actualites.js`, celle du diaporama dans `scripts/diaporama.js`, celle des galeries dans `scripts/mediatheque.js`.

## Médias

Les images, vidéos et documents du site sont déjà préparés dans `maquette/`. Les scripts ci-dessous ont servi à les produire :

- `scripts/creer-vignettes-frise.js` : vignettes SVG de la frise historique. Il est autonome.
- `scripts/telecharger-police.js` : police Archivo, depuis Google Fonts.
- `scripts/preparer-photos.js` : photos réelles des pages (ouvertures, accueil, sections illustrées, actualités dont les photos d'origine étaient générées par IA), dans `img/photos/`. Il lit les reportages du client, hors du dépôt (dossier modifiable par la variable `PHOTOS_SOURCE`). Le choix et le recadrage de chaque photo sont listés en tête du script. Il faut `ffmpeg`.
- `scripts/preparer-images.sh` et `scripts/preparer-logos-filiales.js` : photos des actualités, vidéos, portraits et logos. Ils lisent les fichiers d'origine du client et du site de référence, qui ne sont pas dans ce dépôt pour ne pas l'alourdir. Il faut `ffmpeg`.
- `scripts/preparer-mediatheque.js` : photos de la médiathèque (vignettes de 800 px, grandes images de 1 600 px), d'après `sources/mediatheque.json`. Il lit le reportage « Opérations GOC » du client, hors du dépôt (dossier modifiable par la variable `MEDIATHEQUE_SOURCE`). Il faut `ffmpeg`. Après l'ajout d'une photo dans le fichier de données, on le relance, puis on régénère les pages.

## Licences des composants

- PDF.js 4.10.38 (Mozilla) : licence Apache 2.0, voir `maquette/js/pdfjs/LICENSE.txt`.
- Police Archivo : SIL Open Font License 1.1, voir `maquette/fonts/LISEZMOI.txt`.
