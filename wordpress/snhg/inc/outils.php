<?php
/**
 * Outils communs : langue de la page, données du thème (donnees/*.json, écrites par scripts/wordpress/construire.js),
 * textes de l'interface, adresses des fichiers du thème, pages repérées par leur adresse dans le site statique,
 * sprite d'icônes et contenus servis tels quels.
 */
defined('ABSPATH') || exit;

/* Langue de la page : celle de Polylang, le français sinon (langue par défaut, à la racine du site) */
function snhg_langue(): string {
	$langue = function_exists('pll_current_language') ? pll_current_language() : '';
	return $langue ?: 'fr';
}

function snhg_donnees(string $nom): array {
	static $cache = [];
	if (!isset($cache[$nom])) {
		$fichier = get_template_directory() . "/donnees/$nom.json";
		$cache[$nom] = is_readable($fichier) ? (json_decode(file_get_contents($fichier), true) ?: []) : [];
	}
	return $cache[$nom];
}

/* Texte de l'interface (libelles.json) dans la langue de la page, ses repères {n}, {total}… remplacés */
function snhg_t(string $cle, array $valeurs = []) {
	$libelles = snhg_donnees('libelles');
	$texte = $libelles[snhg_langue()][$cle] ?? $libelles['fr'][$cle] ?? $cle;
	if (!is_string($texte) || !$valeurs) return $texte;
	return preg_replace_callback('/\{(\w+)\}/', fn($m) => (string) ($valeurs[$m[1]] ?? $m[0]), $texte);
}

/* Version d'un fichier du thème (?ver=), qui change avec lui, comme versionner() de l'assembleur */
function snhg_version(string $chemin): string {
	$fichier = get_template_directory() . '/' . $chemin;
	return is_file($fichier) ? substr(md5(filemtime($fichier) . '-' . filesize($fichier)), 0, 10) : '';
}

function snhg_fichier(string $chemin): string {
	$version = snhg_version($chemin);
	return get_template_directory_uri() . '/' . $chemin . ($version ? "?ver=$version" : '');
}

/* Chemin écrit comme dans les sources du site (« img/photos/accueil.jpg ») → adresse dans le thème ; adresses complètes inchangées */
function snhg_adresse(string $u): string {
	return preg_match('#^(?:[a-z][a-z0-9+.-]*:|/|\#)#i', $u) ? $u : snhg_fichier($u);
}

/* Page repérée par son adresse française dans le site statique (« groupe/presentation.html »), dans une langue */
function snhg_page(string $identite, ?string $langue = null): int {
	static $cache = [];
	$cle = ($langue ?? snhg_langue()) . ':' . $identite;
	if (!isset($cache[$cle])) {
		$ids = get_posts(['post_type' => 'page', 'post_status' => 'publish', 'meta_key' => '_snhg_cle', 'meta_value' => $cle,
			'posts_per_page' => 1, 'fields' => 'ids', 'lang' => '', 'no_found_rows' => true]);
		$cache[$cle] = $ids ? (int) $ids[0] : 0;
	}
	return $cache[$cle];
}

function snhg_lien_page(string $identite, ?string $langue = null): string {
	$id = snhg_page($identite, $langue);
	return $id ? snhg_permalien($id) : snhg_accueil();
}

/* Adresse d'un contenu, avec le dossier de sa langue (/en/…) même hors d'une page vue par un visiteur (import) */
function snhg_permalien(int $id): string {
	$url = get_permalink($id);
	if (!function_exists('pll_get_post_language') || !function_exists('PLL')) return $url;
	$langue = pll_get_post_language($id);
	if (!$langue || $langue === pll_default_language() || strpos($url, "/$langue/") !== false) return $url;
	return PLL()->links_model->add_language_to_link($url, PLL()->model->get_language($langue));
}

function snhg_accueil(?string $langue = null): string {
	return function_exists('pll_home_url') ? pll_home_url($langue ?? snhg_langue()) : home_url('/');
}

/* Champ d'un contenu (Secure Custom Fields), lu directement dans les métadonnées si l'extension est désactivée */
function snhg_champ(string $nom, int $id) {
	return function_exists('get_field') ? get_field($nom, $id) : get_post_meta($id, $nom, true);
}

function snhg_attribut($texte): string {
	return esc_attr(html_entity_decode((string) $texte, ENT_QUOTES, 'UTF-8'));
}

/* Sprite d'icônes : header.php pose les icônes communes et le repère <!--snhg:icones-->, remplacé à la fin de la page
   par les icônes et pictogrammes qu'elle utilise réellement, comme dans l'assembleur */
add_action('template_redirect', function () {
	if (is_feed() || is_embed()) return;
	ob_start(function ($html) {
		if (strpos($html, "<!--snhg:icones-->\n") === false) return $html;
		$d = snhg_donnees('icones');
		$symboles = '';
		foreach (['icones' => '0 0 24 24', 'pictogrammes' => '0 0 64 64'] as $groupe => $vue) {
			foreach ($d[$groupe] ?? [] as $id => $dessin) {
				if (strpos($html, "#$id\"") !== false) $symboles .= "  <symbol id=\"$id\" viewBox=\"$vue\">$dessin</symbol>\n";
			}
		}
		return str_replace("<!--snhg:icones-->\n", $symboles, $html);
	});
}, 0);

/* Le balisage des pages vient de la maquette : WordPress n'y change ni les guillemets ni les émoticônes, et n'ajoute
   pas d'attributs aux images des pages (chargement, tailles), déjà réglés au cas par cas. Les articles, écrits dans
   l'éditeur, gardent ce traitement des images (variantes de taille, chargement différé). */
foreach (['the_content', 'the_title', 'the_excerpt', 'single_post_title', 'wp_title'] as $filtre) {
	remove_filter($filtre, 'wptexturize');
	remove_filter($filtre, 'convert_smilies', 20);
	remove_filter($filtre, 'capital_P_dangit', 11);
}
add_filter('the_content', function ($contenu) {
	if (get_post_type() === 'page') remove_filter('the_content', 'wp_filter_content_tags', 12);
	elseif (!has_filter('the_content', 'wp_filter_content_tags')) add_filter('the_content', 'wp_filter_content_tags', 12);
	return $contenu;
}, 1);

/* Contenu de la page en cours, mis en forme ; ce qui suit le repère <!-- snhg:apres --> (fenêtres modales) est gardé
   pour footer.php, qui le place après le pied de page */
function snhg_contenu(): string {
	$html = apply_filters('the_content', get_the_content());
	$parties = explode('<!-- snhg:apres -->', $html, 2);
	$GLOBALS['snhg_apres'] = $parties[1] ?? '';
	return $parties[0];
}
