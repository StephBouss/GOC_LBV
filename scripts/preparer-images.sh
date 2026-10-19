#!/usr/bin/env bash
# Prépare les visuels de la maquette d'accueil.
#  1. img/        : visuels de la maquette Banani « Accueil — GOC » (fidélité à la référence validée par le client),
#                   en deux largeurs (1536 px et 768 px) pour les attributs srcset.
#  2. img/reelles/: photos réelles du fonds GOC (gaboil/public/images), prêtes à remplacer les visuels
#                   générés par Banani avant la mise en ligne.
# Usage : bash scripts/preparer-images.sh
set -euo pipefail

RACINE="$(cd "$(dirname "$0")/.." && pwd)"
BANANI="$RACINE/references/banani/visuels"
GOC="$(cd "$RACINE/../gaboil/public/images" && pwd)"
DST="$RACINE/maquette/img"
mkdir -p "$DST/reelles"
rm -f "$DST"/*.jpg "$DST/reelles"/*.jpg

banani() { # source  nom
  ffmpeg -v error -y -i "$BANANI/$1" -vf "format=yuvj420p" -map_metadata -1 -q:v 4 "$DST/$2.jpg"
  ffmpeg -v error -y -i "$BANANI/$1" -vf "scale=768:-2,format=yuvj420p" -map_metadata -1 -q:v 4 "$DST/$2-768.jpg"
  printf '%-30s <- %s\n' "$2.jpg (+768)" "$1"
}

banani accueil-02-photo.jpg hero-plateforme
banani accueil-03-photo.jpg chiffres-photo
banani accueil-04-photo.jpg presentation-equipes
banani accueil-05-photo.jpg activite-exploration
banani accueil-06-photo.jpg activite-production
banani accueil-07-photo.jpg activite-projets
banani accueil-08-photo.jpg engagement-inspection
banani accueil-12-photo.jpg cap-2030

# Pages intérieures (écrans Banani « Présentation », « Historique », « Filiales », « Activités », « Contact »)
banani presentation-groupe-01-photo.jpg      presentation-hero
banani presentation-groupe-02-photo.jpg      presentation-equipe
banani historique-gouvernance-01-photo.jpg   historique-hero
banani filiales-01-photo.jpg                 filiales-hero
banani activites-engagements-01-photo.jpg    activites-hero
banani activites-detaillees-01-photo.jpg     exploration-hero
banani activites-detaillees-02-photo.jpg     exploration-equipe
banani contact-information-01-photo.jpg      contact-hero

# Actualités : photos réelles des articles du site SNHG (gaboil/public/images/news)
actu() { # source  nom  filtre (pleine taille)
  ffmpeg -v error -y -i "$GOC/news/$1" -vf "$3,format=yuvj420p" -map_metadata -1 -q:v 3 "$DST/$2.jpg"
  ffmpeg -v error -y -i "$GOC/news/$1" -vf "$3,scale=768:-2,format=yuvj420p" -map_metadata -1 -q:v 3 "$DST/$2-768.jpg"
  printf '%-30s <- %s\n' "$2.jpg (+768)" "news/$1"
}

actu "new dg gaboil1.png" actu-nomination-gaboil "crop=1076:580:0:0"
actu "actu1-addax1.png"   actu-addax             "scale=1536:-2"
actu "actu2-assala.png"   actu-assala            "crop=1414:788:0:24"   # format carte, casque conservé
actu "actu3-smp.png"      vision-forage          "crop=1620:1072:300:0,scale=1200:-2"   # Présentation, sous la Vision : forage en forêt
# Images à la une des articles (sources/actualites.json) et ouverture de la page Actualités
actu "actu3-smp.png"                  actu-smp                 "crop=1620:1072:300:0,scale=1536:-2"
actu "actu4-gop.png"                  actu-gop                 "scale=1536:-2"
actu "actu5-gaboil.png"               actu-gaboil-reseau       "scale=1536:-2"
actu "actu6-pizolub.webp"             actu-pizolub             "scale=758:-2"      # source de petite taille : pas d'agrandissement
actu "../about/activity (9).jpg"      actu-modernisation       "scale=1536:-2"
actu "new dg gaboil2.png"             actu-nomination-gaboil-2 "scale=1057:-2"     # portrait, dans le corps de l'article
actu "actu1-addax2.png"               actu-addax-2             "scale=1536:-2"
actu "../hero/snhgbackgroundactualité.png" actualites-hero     "scale=1536:-2"

# Vidéos du diaporama de l'accueil (fournies par le client, 720p, 15 s, sans son) et leurs affiches
# Remise en forme sans réencodage : l'index de la vidéo est placé en tête (+faststart) pour une lecture immédiate
VIDEOS="$(cd "$RACINE/../Img/Inspiration images/Site web GOC/GOC Vidéos/Hero" && pwd)"
mkdir -p "$RACINE/maquette/video"
video() { # nom (hero-<nom>-720p.mp4 et hero-<nom>-poster.jpg)  affiche
  ffmpeg -v error -y -i "$VIDEOS/hero-$1-720p.mp4" -c copy -an -movflags +faststart -map_metadata -1 "$RACINE/maquette/video/hero-$1-720p.mp4"
  ffmpeg -v error -y -i "$VIDEOS/hero-$1-poster.jpg" -vf "scale=1536:-2,format=yuvj420p" -map_metadata -1 -q:v 4 "$DST/$2.jpg"
  printf '%-30s <- %s\n' "video/hero-$1-720p.mp4" "GOC Vidéos/Hero/hero-$1-720p.mp4"
}
video goc     hero-video-affiche           # diapositive 1 : site en forêt
video sardine hero-video-sardine-affiche   # diapositive 3 : champ offshore Sardine

reelle() { # source  sortie  filtre
  ffmpeg -v error -y -i "$GOC/$1" -vf "$3,format=yuvj420p" -map_metadata -1 -q:v 3 "$DST/reelles/$2"
  printf '%-30s <- %s\n' "reelles/$2" "$1"
}

reelle "news/actu3-smp.png"                hero-forage.jpg           "crop=1620:1072:300:0"
reelle "hero/adg.jpg"                      chiffres-adg.jpg          "crop=1920:1493:0:60,scale=800:622"
reelle "about/activity (10).JPG"           presentation-equipes.jpg  "crop=1024:1280:256:0,scale=960:1200"
reelle "about/cap_2030_axe1.jpg"           activite-exploration.jpg  "crop=1024:663:0:180"
reelle "news/actu1-addax2.png"             activite-production.jpg   "crop=1906:1072:7:0,scale=1200:675"
reelle "news/actu1-addax1.png"             activite-projets.jpg      "crop=1906:1072:7:0,scale=1200:675"
reelle "news/intro-actu.png"               engagement-inspection.jpg "crop=1410:1058:0:300,scale=1200:900"
reelle "activities/activity_upstream1.jpg" actu-exploration.jpg      "crop=1024:576:0:224"
reelle "about/activity (4).jpg"            actu-production.jpg       "crop=1920:1080:0:120,scale=1200:675"
reelle "activities/activity_upstream2.jpg" cap-2030.jpg              "crop=1024:560:0:260"

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
