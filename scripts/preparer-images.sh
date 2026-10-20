#!/usr/bin/env bash
# Prépare les images de la maquette dans img/ : photos des actualités, affiches des vidéos, portraits de la
# gouvernance, en deux largeurs (1536 px et 768 px) pour les attributs srcset.
# Les visuels générés par IA de la maquette Banani ne sont plus utilisés : les photos réelles des pages
# (ouvertures, accueil) sont produites par scripts/preparer-photos.js dans img/photos/.
# Usage : bash scripts/preparer-images.sh
set -euo pipefail

RACINE="$(cd "$(dirname "$0")/.." && pwd)"
BANANI="$RACINE/references/banani/visuels"
GOC="$(cd "$RACINE/../gaboil/public/images" && pwd)"
DST="$RACINE/img"
rm -f "$DST"/*.jpg

# Actualités : photos réelles des articles du site SNHG (gaboil/public/images/news). Les images du site SNHG
# générées par IA (marque Gemini) sont remplacées par les photos du client, préparées par scripts/preparer-photos.js.
actu() { # source  nom  filtre (pleine taille)
  ffmpeg -v error -y -i "$GOC/news/$1" -vf "$3,format=yuvj420p" -map_metadata -1 -q:v 3 "$DST/$2.jpg"
  ffmpeg -v error -y -i "$GOC/news/$1" -vf "$3,scale=768:-2,format=yuvj420p" -map_metadata -1 -q:v 3 "$DST/$2-768.jpg"
  printf '%-30s <- %s\n' "$2.jpg (+768)" "news/$1"
}

actu "new dg gaboil1.png" actu-nomination-gaboil "crop=1076:580:0:0"
actu "actu2-assala.png"   actu-assala            "crop=1414:788:0:24"   # format carte, casque conservé
# Images à la une des articles (sources/actualites.json)
actu "actu6-pizolub.webp"             actu-pizolub             "scale=758:-2"      # source de petite taille : pas d'agrandissement
actu "../about/activity (9).jpg"      actu-modernisation       "scale=1536:-2"
actu "new dg gaboil2.png"             actu-nomination-gaboil-2 "scale=1057:-2"     # portrait, dans le corps de l'article

# Vidéos du diaporama de l'accueil (fournies par le client, 15 s, sans son) et leurs affiches.
# Réencodées depuis le 1080p en 1280 × 720, légères pour les réseaux mobiles (audit du 20/10/2026 : moins de 1,5 Mo) :
# WebM (VP9), proposé d'abord aux navigateurs qui le lisent, et MP4 (H.264) pour les autres, index en tête (+faststart).
VIDEOS="$(cd "$RACINE/../Img/Inspiration images/Site web GOC/GOC Vidéos/Hero" && pwd)"
mkdir -p "$RACINE/video"
video() { # nom (hero-<nom>-1080p.mp4 et hero-<nom>-poster.jpg)  affiche
  local source="$VIDEOS/hero-$1-1080p.mp4" sortie="$RACINE/video/hero-$1-720p"
  ffmpeg -v error -y -i "$source" -vf "scale=1280:720:flags=lanczos" -c:v libvpx-vp9 -b:v 0 -crf 42 -row-mt 1 -deadline good -cpu-used 2 \
    -pix_fmt yuv420p -an -map_metadata -1 "$sortie.webm"
  ffmpeg -v error -y -i "$source" -vf "scale=1280:720:flags=lanczos" -c:v libx264 -preset veryslow -crf 29 -profile:v high \
    -pix_fmt yuv420p -an -movflags +faststart -map_metadata -1 "$sortie.mp4"
  ffmpeg -v error -y -i "$VIDEOS/hero-$1-poster.jpg" -vf "scale=1536:-2,format=yuvj420p" -map_metadata -1 -q:v 4 "$DST/$2.jpg"
  printf '%-30s <- %s\n' "video/hero-$1-720p.webm/.mp4" "GOC Vidéos/Hero/hero-$1-1080p.mp4"
}
video goc     hero-video-affiche           # diapositive 1 : site en forêt
video sardine hero-video-sardine-affiche   # diapositive 3 : champ offshore Sardine

# Gouvernance : portraits officiels du site SNHG, recadrés sur le visage (avatars ronds, 160 px = 2 × 80 px)
mkdir -p "$DST/gouvernance"
rm -f "$DST/gouvernance"/*.jpg
portrait() { # source  nom  recadrage (carré autour du visage : les photos sources sont cadrées différemment)
  ffmpeg -v error -y -i "$GOC/governance/$1" -vf "crop=$3,scale=160:160:flags=lanczos,format=yuvj420p" -map_metadata -1 -q:v 3 "$DST/gouvernance/$2.jpg"
  printf '%-30s <- %s\n' "gouvernance/$2.jpg" "governance/$1"
}
portrait jean-tsire.png                 jean-tsire                "672:672:64:0"
portrait jacques-lebama.png             jacques-lebama            "800:800:0:0"
portrait franck-yann-koubdje.png        franck-yann-koubdje       "624:624:88:0"
portrait jacob-thaty-tsioba.png         jacob-thaty-tsioba        "800:800:0:0"
portrait luther-abouna.png              luther-abouna-yangui      "720:720:20:0"
portrait fernand-ngoussi.png            fernand-ngoussi-mayangui  "800:800:0:0"
portrait marcellin-simba-ngabi.png      marcellin-simba-ngabi     "720:720:20:0"
portrait herve-nnang-engue.png          herve-nnang-engue         "672:672:64:0"
portrait emery-lepo.png                 emery-lepo                "576:576:72:0"
portrait jean-leon-mbourou.png          jean-leon-mbourou         "624:624:88:0"
portrait christian-joly-yogoulou.png    christian-joly-yogoulou   "800:800:0:0"
portrait jean-flavien-fame.png          jean-flavien-fame         "720:720:0:0"
portrait wilfridoondagui.png            wilfrid-ondagui           "720:720:40:0"
portrait guyllain-owono-simba.png       guyllain-owono            "800:800:0:0"
portrait hermann-oura.png               hermann-oura              "652:652:116:0"

# Ministères de tutelle : emblème de leur logo, centré sur fond blanc (avatar rond)
ministere() { # source  nom  recadrage
  ffmpeg -v error -y -f lavfi -i "color=white:s=160x160" -i "$GOC/about/$1" -filter_complex "[1]$3,scale=116:-2:flags=lanczos[e];[0][e]overlay=(W-w)/2:(H-h)/2,format=yuvj420p" -frames:v 1 -map_metadata -1 -q:v 3 "$DST/gouvernance/$2.jpg"
  printf '%-30s <- %s\n' "gouvernance/$2.jpg" "about/$1"
}
ministere logo-gaz.png      ministere-petrole   "crop=320:220:90:55"
ministere logo-economie.png ministere-economie  "crop=270:186:115:84"

# Filiales : logo GOC (entité mère) fourni à Banani
ffmpeg -v error -y -i "$RACINE/references/banani/visuels/filiales-03-fichier-client.png" -vf "scale=272:-2:flags=lanczos" "$DST/filiales/goc.png"
printf '%-30s <- %s\n' "filiales/goc.png" "banani filiales-03-fichier-client.png"
