<?php
/**
 * Menus de la maquette, tirés des menus WordPress (Apparence > Menus, un menu par langue avec Polylang) :
 *
 *  Menu principal   éléments de premier niveau = onglets. Un onglet à sous-menu (« Le Groupe »…) a des
 *                   éléments enfants ; sa classe CSS onglet-<rubrique> le relie aux pages de la rubrique (champ
 *                   « Rubrique du menu » des pages), sa description donne le titre de sa colonne dans le pied de page,
 *                   et la classe pied-directs y ajoute les onglets directs (aucun aujourd'hui). Un onglet sans enfant est un
 *                   lien direct. La classe nav-accent met un lien en rouge (GO’TALK).
 *  Liens légaux     bas du pied de page.
 *
 * Mêmes balises que l'assembleur du site statique (scripts/assembler-pages.js) : en-tête, menu mobile, pied de page,
 * bande de navigation de la rubrique ([snhg_sous_nav]) et sélecteur de langue.
 */
defined('ABSPATH') || exit;

/* Éléments d'un emplacement de menu, en arbre (enfants dans ->snhg_enfants) */
function snhg_menu(string $emplacement): array {
	static $cache = [];
	if (isset($cache[$emplacement])) return $cache[$emplacement];
	$lieux = get_nav_menu_locations();
	$elements = !empty($lieux[$emplacement]) ? (wp_get_nav_menu_items($lieux[$emplacement]) ?: []) : [];
	$racine = [];
	$enfants = [];
	foreach ($elements as $e) {
		if ((int) $e->menu_item_parent) $enfants[(int) $e->menu_item_parent][] = $e;
		else $racine[] = $e;
	}
	foreach ($racine as $e) $e->snhg_enfants = $enfants[$e->ID] ?? [];
	return $cache[$emplacement] = $racine;
}

function snhg_classes($e): array {
	return array_values(array_filter((array) $e->classes));
}

function snhg_rubrique($e): string {
	foreach (snhg_classes($e) as $c) if (strpos($c, 'onglet-') === 0) return substr($c, 7);
	return '';
}

/* Rubrique de la page en cours : champ « Rubrique du menu » des pages ; les articles sont dans « Actualités & Médias » */
function snhg_onglet(): string {
	if (is_singular('post')) return 'information';
	return is_page() ? (string) get_post_meta(get_queried_object_id(), 'snhg_onglet', true) : '';
}

/* Partie de l'adresse avant l'ancre, sans « / » final */
function snhg_sans_ancre(string $url): string {
	return untrailingslashit(strtok($url, '#'));
}

/* Le lien mène-t-il à la page en cours ? (sans ancre : « aria-current="page" » ; avec ancre : une partie de la page) */
function snhg_vers_page_courante($e): bool {
	$id = get_queried_object_id();
	if (!$id) return false;
	if ($e->type === 'post_type' && (int) $e->object_id === $id) return true;
	return snhg_sans_ancre($e->url) === snhg_sans_ancre(snhg_permalien($id));
}

function snhg_courant($e): string {
	return strpos($e->url, '#') === false && snhg_vers_page_courante($e) ? ' aria-current="page"' : '';
}

function snhg_lien($e, bool $accent = true): string {
	$classe = $accent && in_array('nav-accent', snhg_classes($e), true) ? 'class="nav-accent" ' : '';
	return '<li><a ' . $classe . 'href="' . esc_url($e->url) . '"' . snhg_courant($e) . '>' . esc_html($e->title) . '</a></li>';
}

function snhg_groupes(): array {
	return array_values(array_filter(snhg_menu('principal'), fn($e) => snhg_rubrique($e) !== ''));
}

function snhg_directs(): array {
	return array_values(array_filter(snhg_menu('principal'), fn($e) => snhg_rubrique($e) === ''));
}

function snhg_nav_principale(): string {
	$onglet = snhg_onglet();
	$html = '';
	foreach (snhg_groupes() as $g) {
		$id = snhg_rubrique($g);
		$html .= "        <li class=\"nav-item\">\n"
			. '          <button class="nav-onglet" type="button" aria-expanded="false" aria-controls="sous-menu-' . esc_attr($id) . '"' . ($id === $onglet ? ' aria-current="true"' : '') . '>' . esc_html($g->title) . " <svg class=\"chevron\" aria-hidden=\"true\"><use href=\"#i-chevron\"/></svg></button>\n"
			. '          <div class="sous-menu" id="sous-menu-' . esc_attr($id) . "\">\n"
			. "            <ul class=\"sous-menu-liens\">\n"
			. implode('', array_map(fn($e) => '              ' . snhg_lien($e) . "\n", $g->snhg_enfants))
			. "            </ul>\n          </div>\n        </li>\n";
	}
	foreach (snhg_directs() as $d) {
		$accent = in_array('nav-accent', snhg_classes($d), true) ? ' nav-accent' : '';
		$html .= '        <li class="nav-direct"><a class="nav-onglet' . $accent . '" href="' . esc_url($d->url) . '"' . snhg_courant($d) . '>' . esc_html($d->title) . "</a></li>\n";
	}
	return $html;
}

function snhg_nav_mobile(): string {
	$html = '';
	foreach (snhg_groupes() as $g) {
		$html .= "    <details class=\"accordeon\" name=\"menu-mobile\">\n"
			. '      <summary>' . esc_html($g->title) . " <svg class=\"chevron\" aria-hidden=\"true\"><use href=\"#i-chevron\"/></svg></summary>\n"
			. "      <ul>\n"
			. implode('', array_map(fn($e) => '        ' . snhg_lien($e) . "\n", $g->snhg_enfants))
			. "      </ul>\n    </details>\n";
	}
	foreach (snhg_directs() as $d) {
		$accent = in_array('nav-accent', snhg_classes($d), true) ? ' nav-accent' : '';
		$html .= '    <a class="menu-mobile-direct' . $accent . '" href="' . esc_url($d->url) . '"' . snhg_courant($d) . '>' . esc_html($d->title) . "</a>\n";
	}
	return $html;
}

/* Plan du pied de page : une colonne par onglet, titrée par sa description ; les liens n'y sont pas en rouge */
function snhg_pied_colonnes(): string {
	$html = '';
	foreach (snhg_groupes() as $g) {
		$liens = $g->snhg_enfants;
		if (in_array('pied-directs', snhg_classes($g), true)) $liens = array_merge($liens, snhg_directs());
		$html .= "        <details class=\"pied-colonne\" open>\n"
			. '          <summary>' . esc_html($g->description ?: $g->title) . " <svg class=\"chevron\" aria-hidden=\"true\"><use href=\"#i-chevron\"/></svg></summary>\n"
			. "          <ul>\n"
			. implode('', array_map(fn($e) => '            ' . snhg_lien($e, false) . "\n", $liens))
			. "          </ul>\n        </details>\n";
	}
	return $html;
}

function snhg_pied_legal(): string {
	return implode('', array_map(fn($e) => '        ' . snhg_lien($e, false) . "\n", snhg_menu('legal')));
}

/* Bande de navigation de la rubrique : les liens du sous-menu de l'onglet de la page. Un lien vers une partie de la
   page elle-même devient une simple ancre, et la première de ces parties est signalée comme l'endroit où l'on est.
   Une sous-page sans entrée de menu (Stations Gab'Oil) signale le lien de sa page parente (_snhg_parent : sa clé d'import). */
function snhg_sous_nav(): string {
	$onglet = snhg_onglet();
	$groupe = current(array_filter(snhg_groupes(), fn($g) => snhg_rubrique($g) === $onglet));
	if (!$groupe) return '';
	$parent = is_page() ? (string) get_post_meta(get_queried_object_id(), '_snhg_parent', true) : '';
	$signalee = false;
	$liens = array_map(function ($e) use (&$signalee, $parent) {
		$texte = esc_html($e->title);
		if ($parent !== '' && $e->type === 'post_type' && get_post_meta((int) $e->object_id, '_snhg_cle', true) === $parent) {
			return '<li><a href="' . esc_url($e->url) . '" aria-current="true">' . $texte . '</a></li>';
		}
		if (!snhg_vers_page_courante($e)) return '<li><a href="' . esc_url($e->url) . '">' . $texte . '</a></li>';
		$ancre = strpos($e->url, '#') === false ? '' : substr($e->url, strpos($e->url, '#') + 1);
		if ($ancre === '') return '<li><a href="' . esc_url($e->url) . '" aria-current="page">' . $texte . '</a></li>';
		$courant = $signalee ? '' : ' aria-current="location"';
		$signalee = true;
		return '<li><a href="#' . esc_attr($ancre) . '"' . $courant . '>' . $texte . '</a></li>';
	}, $groupe->snhg_enfants);
	return '  <nav class="sous-nav" aria-label="' . esc_attr($groupe->title) . "\">\n    <ul>\n"
		. implode('', array_map(fn($l) => "      $l\n", $liens)) . "    </ul>\n  </nav>";
}
add_shortcode('snhg_sous_nav', 'snhg_sous_nav');

/* Sélecteur de langue : chaque langue mène à la traduction de la page (à l'accueil de la langue sinon) ; app.js y
   reporte la partie visée (#…) et le filtre (?categorie=…) */
function snhg_langues(string $retrait): string {
	$noms = ['fr' => 'français', 'en' => 'English'];
	$langues = function_exists('pll_the_languages')
		? pll_the_languages(['raw' => 1, 'hide_if_empty' => 0, 'hide_if_no_translation' => 0, 'echo' => 0])
		: ['fr' => ['url' => home_url('/'), 'current_lang' => true]];
	$liens = [];
	foreach ((array) $langues as $slug => $l) {
		$liens[] = '<a href="' . esc_url($l['url']) . '" hreflang="' . esc_attr($slug) . '" lang="' . esc_attr($slug) . '"' . (!empty($l['current_lang']) ? ' aria-current="true"' : '') . '>'
			. esc_html(strtoupper($slug)) . '<span class="visuellement-masque"> (' . esc_html($noms[$slug] ?? $slug) . ')</span></a>';
	}
	return $retrait . '<p class="langues">' . implode(' <span aria-hidden="true">|</span> ', $liens) . "</p>\n";
}
