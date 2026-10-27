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

# Vidéo Sardine du diaporama de l'accueil (fournie par le client, 15 s, sans son) et son affiche. La vidéo de la
# première diapositive (montage du client, versions large et verticale) est préparée par scripts/preparer-videos.js.
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
video sardine hero-video-sardine-affiche   # diapositive 3 : champ offshore Sardine

# Gouvernance : portraits officiels remis par le client le 23/10/2026, recadrés sur le visage (avatars ronds,
# 160 px = 2 × 80 px). Dossiers hors du dépôt, modifiables par les variables PHOTOS_CA et PHOTOS_CODIR ; chaque photo
# est retrouvée par le nom de la personne au début du nom de fichier. Le fichier est lu sur l'entrée standard :
# ffmpeg sous Windows n'ouvre pas un chemin accentué (« Président du Conseil… », « Hervé… »).
mkdir -p "$DST/gouvernance"
rm -f "$DST/gouvernance"/*.jpg
PHOTOS_CA="${PHOTOS_CA:-$HOME/Downloads/GrosFichiers - Lemien LENDZEYI/Photo CA}"
PHOTOS_CODIR="${PHOTOS_CODIR:-$HOME/Downloads/GrosFichiers - Lemien LENDZEYI/CoDIR}"
portrait() { # dossier  début du nom de fichier  nom  recadrage (carré autour du visage)
  local sources=("$1/$2"*.png)
  ffmpeg -v error -y -f png_pipe -i - -vf "crop=$4,scale=160:160:flags=lanczos,format=yuvj420p" -map_metadata -1 -q:v 3 "$DST/gouvernance/$3.jpg" < "${sources[0]}"
  printf '%-30s <- %s\n' "gouvernance/$3.jpg" "$(basename "$1")/$(basename "${sources[0]}")"
}
# Conseil d'Administration
portrait "$PHOTOS_CA" "Jean TSIRE"                jean-tsire                "840:840:193:10"
portrait "$PHOTOS_CA" "Marcellin SIMBA NGABI"     marcellin-simba-ngabi     "1045:1045:63:0"
portrait "$PHOTOS_CA" "Jacques LEBAMA"            jacques-lebama            "1060:1060:136:0"
portrait "$PHOTOS_CA" "Franck-Yann KOUBDJE"       franck-yann-koubdje       "1010:1010:101:4"
portrait "$PHOTOS_CA" "Jacob Thaty TSIOBA"        jacob-thaty-tsioba        "1117:1117:69:12"
portrait "$PHOTOS_CA" "Luther ABOUNA"             luther-abouna-yangui      "1031:1031:104:0"
portrait "$PHOTOS_CA" "Fernand NGOUSSI"           fernand-ngoussi-mayangah  "1254:1254:0:0"
# Comité de Direction (l'ADG, Marcellin SIMBA NGABI, a le portrait du Conseil)
portrait "$PHOTOS_CODIR" "Herv"                   herve-nnang-engue         "936:936:159:0"
portrait "$PHOTOS_CODIR" "Jean L"                 jean-leon-mbourou         "1045:1045:105:0"
portrait "$PHOTOS_CODIR" "Christian Joly"         christian-joly-yogoulou   "901:901:168:0"
portrait "$PHOTOS_CODIR" "Jean Flavien FAME"      jean-flavien-fame         "1060:1060:84:0"
portrait "$PHOTOS_CODIR" "Vladimir"               vladimir-meyoua           "1040:1040:99:0"
portrait "$PHOTOS_CODIR" "Wilfrid Davy ONDAGUI"   wilfrid-ondagui-antchouo  "879:879:167:0"
portrait "$PHOTOS_CODIR" "Guyllain"               guyllain-owono-simba      "880:880:187:0"
portrait "$PHOTOS_CODIR" "Hermann OURA"           hermann-oura              "720:720:283:0"

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
