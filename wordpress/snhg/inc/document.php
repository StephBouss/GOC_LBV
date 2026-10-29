<?php
/**
 * <head> de la maquette : titre de l'onglet, description, aperçus de partage (Open Graph, comme scripts/partage.js),
 * préchargement de la police et de l'image d'ouverture, styles du site et script app.js. WordPress ajoute l'adresse
 * canonique ; Polylang, les liens vers les traductions (hreflang). Le reste de ce que WordPress pose d'habitude dans
 * le <head> (émoticônes, styles des blocs, liens techniques) est retiré : la maquette n'en a pas besoin.
 * En-têtes de sécurité : ceux du site statique (vercel.json), sauf la politique de contenu (CSP), que l'administration
 * de WordPress ne respecterait pas.
 */
defined('ABSPATH') || exit;

const SNHG_NOM_SITE = ['fr' => 'SNHG – Gabon Oil Company', 'en' => 'Gabon Oil Company'];
const SNHG_LOCALES = ['fr' => 'fr_FR', 'en' => 'en_GB'];
const SNHG_PARTAGE_DEFAUT = 'img/photos/accueil-expertise.jpg';

add_action('after_setup_theme', function () {
	add_theme_support('title-tag');
	add_theme_support('post-thumbnails');
	add_theme_support('html5', ['script', 'style', 'navigation-widgets']);
	register_nav_menus([
		'principal' => 'Menu principal (onglets, menu mobile et plan du pied de page)',
		'legal' => 'Liens légaux (bas du pied de page)',
	]);
});

remove_action('wp_head', 'print_emoji_detection_script', 7);
remove_action('wp_print_styles', 'print_emoji_styles');
remove_action('wp_head', 'wp_generator');
remove_action('wp_head', 'rsd_link');
remove_action('wp_head', 'wlwmanifest_link');
remove_action('wp_head', 'wp_shortlink_wp_head');
remove_action('wp_head', 'wp_oembed_add_discovery_links');
remove_action('wp_head', 'rest_output_link_wp_head');
remove_action('wp_head', 'feed_links_extra', 3);
remove_action('wp_head', 'wp_site_icon', 99);
add_filter('wp_img_tag_add_auto_sizes', '__return_false');

/* Rubriques sans page propre (Le groupe, Engagements, Informations légales) : renvoi vers leur première page */
add_action('template_redirect', function () {
	if (!is_page()) return;
	$cible = get_post_meta(get_queried_object_id(), '_snhg_redirection', true);
	if (!$cible) return;
	[$langue, $identite] = explode(':', $cible, 2);
	$id = snhg_page($identite, $langue);
	if ($id) { wp_safe_redirect(snhg_permalien($id), 302); exit; }
});

add_action('send_headers', function () {
	if (is_admin()) return;
	header('X-Frame-Options: SAMEORIGIN');
	header('X-Content-Type-Options: nosniff');
	header('Referrer-Policy: strict-origin-when-cross-origin');
	header('Permissions-Policy: camera=(), microphone=(), geolocation=(self), payment=(), usb=(), browsing-topics=()');
	if (is_ssl()) header('Strict-Transport-Security: max-age=63072000; includeSubDomains');
});

/* Métadonnées de la page : titre de l'onglet, description, image préchargée et feuilles de style propres à la page */
function snhg_meta(string $cle) {
	if (!is_singular()) return null;
	$id = get_queried_object_id();
	if (in_array($cle, ['precharger', 'css', 'partage'], true)) {
		$valeur = get_post_meta($id, "_snhg_$cle", true);
		return $valeur ? json_decode($valeur, true) : null;
	}
	return get_post_meta($id, "snhg_$cle", true) ?: null;
}

add_filter('pre_get_document_title', function ($titre) {
	if (is_singular('post')) return esc_html(snhg_t('titre-article', ['titre' => wp_strip_all_tags(get_the_title())]));
	$propre = snhg_meta('titre');
	return $propre ? esc_html($propre) : $titre;
});

function snhg_description(): string {
	if (is_singular('post')) return wp_strip_all_tags(get_the_excerpt());
	return (string) (snhg_meta('description') ?: get_bloginfo('description'));
}

/* Image d'ouverture à précharger : celle de la page (image préparée ou diapositive de l'accueil, posée par le diaporama) */
function snhg_prechargement(): ?array {
	return $GLOBALS['snhg_precharger'] ?? snhg_meta('precharger');
}

/* Aperçu de partage : l'image de 1200 × 630 px préparée par scripts/preparer-partage.js à partir de la photo de la page */
function snhg_image_partage(): string {
	$source = snhg_meta('partage')['src'] ?? '';
	if (!$source) {
		$p = snhg_prechargement();
		$source = $p['src'] ?? '';
	}
	if (is_singular('post') && has_post_thumbnail()) $source = get_attached_file(get_post_thumbnail_id());
	$nom = $source ? basename(strtok($source, '?')) : '';
	$prevue = $nom && substr($nom, -4) === '.jpg' ? "img/partage/$nom" : '';
	return snhg_fichier($prevue && is_file(get_template_directory() . "/$prevue") ? $prevue : 'img/partage/' . basename(SNHG_PARTAGE_DEFAUT));
}

add_action('wp_head', function () {
	$langue = snhg_langue();
	$titre = wp_get_document_title();
	$titre_partage = preg_replace('/ · ((Actualités|News) · )?(SNHG – )?Gabon Oil Company$/u', '', html_entity_decode($titre, ENT_QUOTES, 'UTF-8'));
	$url = is_singular() ? snhg_permalien(get_queried_object_id()) : snhg_accueil();
	$autres = [];
	if (is_singular() && function_exists('pll_get_post_translations')) {
		$autres = array_diff(array_keys(pll_get_post_translations(get_queried_object_id())), [$langue]);
	}
	$balises = [
		'<meta name="description" content="' . snhg_attribut(snhg_description()) . '">',
		'<meta property="og:type" content="' . (is_singular('post') ? 'article' : 'website') . '">',
		'<meta property="og:site_name" content="' . esc_attr(SNHG_NOM_SITE[$langue] ?? SNHG_NOM_SITE['fr']) . '">',
		'<meta property="og:locale" content="' . esc_attr(SNHG_LOCALES[$langue] ?? 'fr_FR') . '">',
	];
	foreach ($autres as $l) $balises[] = '<meta property="og:locale:alternate" content="' . esc_attr(SNHG_LOCALES[$l] ?? $l) . '">';
	array_push($balises,
		'<meta property="og:url" content="' . esc_url($url) . '">',
		'<meta property="og:title" content="' . snhg_attribut($titre_partage) . '">',
		'<meta property="og:description" content="' . snhg_attribut(snhg_description()) . '">',
		'<meta property="og:image" content="' . esc_url(snhg_image_partage()) . '">',
		'<meta property="og:image:width" content="1200">',
		'<meta property="og:image:height" content="630">',
		'<meta name="twitter:card" content="summary_large_image">',
		'<meta name="theme-color" content="#14171B">',
		'<link rel="icon" href="' . esc_url(snhg_fichier('img/favicon.png')) . '" type="image/png">',
		// même adresse que dans la feuille de style (sans version), sinon la police serait chargée deux fois
		'<link rel="preload" href="' . esc_url(get_template_directory_uri() . '/fonts/archivo-latin.woff2') . '" as="font" type="font/woff2" crossorigin>',
	);
	$p = snhg_prechargement();
	if ($p && !empty($p['src'])) {
		$variantes = '';
		if (!empty($p['srcset'])) {
			$srcset = implode(', ', array_map(fn($v) => preg_replace_callback('/^\S+/', fn($m) => snhg_adresse($m[0]), trim($v)), explode(',', $p['srcset'])));
			$variantes = ' imagesrcset="' . esc_attr($srcset) . '" imagesizes="' . esc_attr($p['sizes'] ?? '100vw') . '"';
		}
		$balises[] = '<link rel="preload" as="image" href="' . esc_url(snhg_adresse($p['src'])) . '"' . $variantes . ' fetchpriority="high">';
	}
	echo '  ' . implode("\n  ", $balises) . "\n";
}, 2);

add_action('wp_enqueue_scripts', function () {
	foreach (['wp-block-library', 'wp-block-library-theme', 'global-styles', 'classic-theme-styles', 'core-block-supports'] as $style) {
		wp_dequeue_style($style);
	}
	$theme = get_template_directory_uri();
	wp_enqueue_style('snhg-styles', "$theme/css/styles.css", [], snhg_version('css/styles.css'));
	foreach ((array) snhg_meta('css') as $css) {
		wp_enqueue_style('snhg-' . sanitize_key(basename($css, '.css')), "$theme/$css", ['snhg-styles'], snhg_version($css));
	}
	if (is_singular('post')) wp_enqueue_style('snhg-pages', "$theme/css/pages.css", ['snhg-styles'], snhg_version('css/pages.css'));
	wp_enqueue_script('snhg-app', "$theme/js/app.js", [], snhg_version('js/app.js'), ['in_footer' => true, 'strategy' => 'defer']);
}, 20);
