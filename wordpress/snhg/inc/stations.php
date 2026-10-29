<?php
/**
 * Réseau Gab'Oil : les « Stations Gab'Oil » de l'administration sur la carte du Gabon, comme scripts/stations.js.
 *
 *  [snhg_stations vue="carte"]     fond de carte (donnees/carte-gabon.json) et un point par station placée, coloré selon
 *                                  son état ; les stations du Grand Libreville sont dessinées dans l'encart. Chaque point
 *                                  porte ses données (nom, lieu, coordonnées, lien Google Maps), lues par app.js
 *  [snhg_stations vue="filtres"]   pastilles par état, avec le nombre de stations
 *  [snhg_stations vue="liste"]     stations groupées par état
 *  [snhg_stations nombre="service"]  nombre de stations d'un état (« total » : toutes)
 *
 * Position d'un point : x = (longitude − 7,2) × 100, y = (2,55 − latitude) × 100, en unités de la carte.
 * Textes de la carte (états, noms des pays voisins…) : donnees/stations.json, dans chaque langue.
 */
defined('ABSPATH') || exit;

function snhg_arrondi(float $v): string {
	$r = round($v, 1);
	return (string) ($r == (int) $r ? (int) $r : $r);
}

function snhg_reseau(): array {
	static $reseau = null;
	if ($reseau !== null) return $reseau;
	$textes = snhg_donnees('stations')[snhg_langue()] ?? snhg_donnees('stations')['fr'];
	$fond = snhg_donnees('carte-gabon');
	$p = $fond['projection'];
	[$zx, $zy, $zl, $zh] = $fond['encart']['zone'];
	$stations = [];
	$fiches = get_posts(['post_type' => 'snhg_station', 'post_status' => 'publish', 'posts_per_page' => -1,
		'orderby' => ['menu_order' => 'ASC', 'title' => 'ASC'], 'no_found_rows' => true]);
	foreach ($fiches as $f) {
		$s = [
			'id' => $f->post_name,
			'nom' => get_the_title($f),
			'ville' => (string) snhg_champ('ville', $f->ID),
			'province' => (string) snhg_champ('province', $f->ID),
			'etat' => snhg_champ('etat', $f->ID) ?: 'service',
			'lat' => snhg_champ('latitude', $f->ID),
			'lon' => snhg_champ('longitude', $f->ID),
			'provisoire' => (bool) snhg_champ('position_provisoire', $f->ID),
			'photo' => (int) snhg_champ('photo', $f->ID),
		];
		if (is_numeric($s['lat']) && is_numeric($s['lon'])) {
			$x = ($s['lon'] - $p['lonMin']) * $p['echelle'];
			$y = ($p['latMax'] - $s['lat']) * $p['echelle'];
			$s['encart'] = $x >= $zx && $x <= $zx + $zl && $y >= $zy && $y <= $zy + $zh;
			$s['x'] = snhg_arrondi($s['encart'] ? $fond['encart']['cadre'][0] + ($x - $zx) * $fond['encart']['echelle'] : $x);
			$s['y'] = snhg_arrondi($s['encart'] ? $fond['encart']['cadre'][1] + ($y - $zy) * $fond['encart']['echelle'] : $y);
		}
		$stations[] = $s;
	}
	return $reseau = ['stations' => $stations, 'fond' => $fond] + $textes;
}

function snhg_nombre_stations(string $etat = ''): int {
	return count(array_filter(snhg_reseau()['stations'], fn($s) => !$etat || $s['etat'] === $etat));
}

function snhg_lieu_station(array $s): string {
	return implode(' · ', array_filter([$s['ville'] !== $s['nom'] ? $s['ville'] : '', $s['province']]));
}

/* Position exacte seulement : une position provisoire mènerait au centre de la localité, pas à la station */
function snhg_lien_maps(array $s): string {
	return isset($s['x']) && !$s['provisoire'] ? 'https://www.google.com/maps/search/?api=1&amp;query=' . $s['lat'] . ',' . $s['lon'] : '';
}

function snhg_carte_stations(): string {
	$d = snhg_reseau();
	$f = $d['fond'];
	[$zx, $zy, $zl, $zh] = $f['encart']['zone'];
	[$cx, $cy, $cl, $ch] = $f['encart']['cadre'];
	$e = 'esc_html';
	$points = [];
	foreach ($d['stations'] as $s) {
		if (!isset($s['x'])) continue;
		$lieu = snhg_lieu_station($s);
		$donnees = implode(' ', array_filter([
			'data-nom="' . esc_attr($s['nom']) . '"',
			$lieu ? 'data-lieu="' . esc_attr($lieu) . '"' : '',
			'data-lat="' . esc_attr($s['lat']) . '" data-lon="' . esc_attr($s['lon']) . '"',
			snhg_lien_maps($s) ? 'data-maps="' . snhg_lien_maps($s) . '"' : 'data-provisoire',
		]));
		$points[] = '          <g class="point" data-station="' . esc_attr($s['id']) . '" data-etat="' . esc_attr($s['etat']) . '"' . ($s['encart'] ? ' data-encart' : '') . " $donnees transform=\"translate({$s['x']} {$s['y']})\"><g class=\"point-forme\"><circle class=\"point-halo\" r=\"7\"/><circle class=\"point-coeur\" r=\"5.5\"/></g></g>";
	}
	$photos = [];
	foreach ($d['stations'] as $s) {
		if (!$s['photo'] || !isset($s['x'])) continue;
		$image = wp_get_attachment_image_src($s['photo'], 'medium_large') ?: wp_get_attachment_image_src($s['photo'], 'full');
		if ($image) $photos[] = '              <img src="' . esc_url($image[0]) . '" alt="" data-station="' . esc_attr($s['id']) . '" width="768" height="432" loading="lazy" hidden>';
	}
	$projection = "{$f['projection']['lonMin']} {$f['projection']['latMax']} {$f['projection']['echelle']}";
	$encart = implode(' ', $f['encart']['zone']) . " $cx $cy $cl $ch {$f['encart']['echelle']}";
	$provinces = implode('', array_map(fn($p) => '<path d="' . $p['d'] . '"/>', $f['provinces']));
	$voisins = implode('', array_map(fn($v) => '<path d="' . $v['d'] . '"/>', $f['voisins']));
	$noms_provinces = implode('', array_map(fn($p) => '<text class="carte-province-nom" x="' . $p['nom_x'] . '" y="' . $p['nom_y'] . '">' . $e($p['nom']) . '</text>', $f['provinces']));
	$noms_voisins = implode('', array_map(fn($v) => '<text class="carte-voisin-nom" x="' . $v['nom_x'] . '" y="' . $v['nom_y'] . '">' . $e($d['carte'][$v['id']] ?? '') . '</text>', $f['voisins']));
	$legende = implode("\n", array_map(fn($etat) => '            <li><span class="pastille-etat" data-etat="' . $etat . '" aria-hidden="true"></span>' . $e($d['etats'][$etat]) . '</li>', array_keys(SNHG_ETATS)));
	return '<figure class="stations-carte" data-apparition>
        <div class="carte-cadre">
          <svg class="carte-gabon" viewBox="0 0 ' . $f['largeur'] . ' ' . $f['hauteur'] . '" role="img" aria-labelledby="carte-titre" data-projection="' . $projection . '" data-encart="' . $encart . '">
          <title id="carte-titre">' . $e($d['carte']['titre']) . '</title>
          <defs>
            <g id="carte-provinces">' . $provinces . '</g>
            <clipPath id="carte-encart-decoupe"><rect x="' . $cx . '" y="' . $cy . '" width="' . $cl . '" height="' . $ch . '" rx="6"/></clipPath>
          </defs>
          <rect class="carte-ocean" width="' . $f['largeur'] . '" height="' . $f['hauteur'] . '"/>
          <g class="carte-voisins">' . $voisins . '</g>
          <use class="carte-frontiere" href="#carte-provinces"/>
          <use class="carte-provinces" href="#carte-provinces"/>
          <g class="carte-noms" aria-hidden="true">
            ' . $noms_provinces . '
            ' . $noms_voisins . '
            <text class="carte-ocean-nom" x="' . $f['ocean'][0] . '" y="' . $f['ocean'][1] . '">' . $e($d['carte']['ocean']) . '</text>
          </g>
          <g class="carte-encart" aria-hidden="true">
            <path class="carte-renvoi" d="M' . $zx . ' ' . ($zy + $zh) . 'L' . $cx . ' ' . ($cy + $ch) . 'M' . ($zx + $zl) . ' ' . $zy . 'L' . ($cx + $cl) . ' ' . $cy . '"/>
            <rect class="carte-zone" x="' . $zx . '" y="' . $zy . '" width="' . $zl . '" height="' . $zh . '"/>
            <rect class="carte-encart-fond" x="' . $cx . '" y="' . $cy . '" width="' . $cl . '" height="' . $ch . '" rx="6"/>
            <path class="carte-encart-terre" clip-path="url(#carte-encart-decoupe)" d="' . $f['encart']['terre'] . '"/>
            <rect class="carte-encart-cadre" x="' . $cx . '" y="' . $cy . '" width="' . $cl . '" height="' . $ch . '" rx="6"/>
            <text class="carte-encart-nom" x="' . ($cx + 10) . '" y="' . ($cy + $ch - 10) . '">' . $e($d['carte']['encart']) . '</text>
          </g>
          <g class="carte-points" aria-hidden="true">
' . implode("\n", $points) . '
          </g>
          </svg>
          <div class="carte-bulle" aria-hidden="true" hidden>
            <span class="carte-bulle-photo">
' . implode('', array_map(fn($p) => "$p\n", $photos)) . '              <img class="carte-bulle-logo" src="' . esc_url(snhg_fichier('img/filiales/gab-oil.svg')) . '" alt="" data-station="" loading="lazy" hidden>
            </span>
            <span class="carte-bulle-texte"></span>
            <a class="carte-bulle-lien" target="_blank" rel="noopener noreferrer" tabindex="-1" hidden>' . $e($d['textes']['maps']) . '<svg class="icone" aria-hidden="true"><use href="#i-lien-externe"/></svg></a>
          </div>
        </div>
        <figcaption class="carte-legende">
          <ul>
' . $legende . '
          </ul>
        </figcaption>
      </figure>';
}

function snhg_filtres_stations(): string {
	$d = snhg_reseau();
	$e = 'esc_html';
	return '<div class="filtres stations-filtres" role="group" aria-label="' . esc_attr($d['textes']['filtrer']) . '">
          <ul>
            <li><button type="button" data-filtre="" aria-pressed="true">' . $e($d['textes']['toutes']) . ' <span class="filtre-nombre">' . snhg_nombre_stations() . '</span></button></li>
' . implode("\n", array_map(fn($etat) => '            <li><button type="button" data-filtre="' . $etat . '" aria-pressed="false">' . $e($d['etats'][$etat]) . ' <span class="filtre-nombre">' . snhg_nombre_stations($etat) . '</span></button></li>', array_keys(SNHG_ETATS))) . '
          </ul>
        </div>';
}

function snhg_ligne_station(array $s): string {
	$d = snhg_reseau();
	$lieu = snhg_lieu_station($s);
	$texte = '<span class="pastille-etat" data-etat="' . esc_attr($s['etat']) . '" aria-hidden="true"></span><span class="station-texte"><span class="station-nom">' . esc_html($s['nom']) . '</span>' . ($lieu ? '<span class="station-lieu">' . esc_html($lieu) . '</span>' : '') . '</span>';
	// Sans coordonnées, rien à montrer sur la carte : simple ligne de liste
	if (!isset($s['x'])) return '<li><span class="station sans-point" data-station="' . esc_attr($s['id']) . '">' . $texte . '</span></li>';
	$maps = snhg_lien_maps($s)
		? '<a class="station-maps" href="' . snhg_lien_maps($s) . '" target="_blank" rel="noopener noreferrer"><svg class="icone" aria-hidden="true"><use href="#i-lien-externe"/></svg><span class="station-maps-texte">Google Maps</span><span class="visuellement-masque"> (' . esc_html($s['nom']) . ', ' . esc_html($d['textes']['onglet']) . ')</span></a>'
		: '';
	return '<li><button class="station" type="button" data-station="' . esc_attr($s['id']) . '" aria-pressed="false">' . $texte . '<svg class="icone station-repere" aria-hidden="true"><use href="#i-repere"/></svg></button>' . $maps . '</li>';
}

function snhg_liste_stations(): string {
	$d = snhg_reseau();
	$groupes = [];
	foreach (array_keys(SNHG_ETATS) as $etat) {
		$lignes = array_map(fn($s) => '            ' . snhg_ligne_station($s), array_filter($d['stations'], fn($s) => $s['etat'] === $etat));
		$groupes[] = '<section class="stations-groupe" data-etat="' . $etat . '" data-libelle="' . esc_attr($d['etats'][$etat]) . '" aria-labelledby="etat-' . $etat . '">
          <h3 class="stations-etat" id="etat-' . $etat . '"><span class="pastille-etat" data-etat="' . $etat . '" aria-hidden="true"></span>' . esc_html($d['etats'][$etat]) . ' <span class="stations-nombre">' . snhg_nombre_stations($etat) . '</span></h3>
          <ul>
' . implode("\n", $lignes) . '
          </ul>
        </section>';
	}
	return implode("\n        ", $groupes);
}

add_shortcode('snhg_stations', function ($attributs) {
	$a = shortcode_atts(['vue' => '', 'nombre' => ''], $attributs);
	if ($a['nombre'] !== '') return (string) snhg_nombre_stations($a['nombre'] === 'total' ? '' : $a['nombre']);
	switch ($a['vue']) {
		case 'carte': return snhg_carte_stations();
		case 'filtres': return snhg_filtres_stations();
		case 'liste': return snhg_liste_stations();
	}
	return '';
});
