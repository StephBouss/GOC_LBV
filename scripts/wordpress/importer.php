<?php
/**
 * Importe dans WordPress les contenus préparés par scripts/wordpress/construire.js, en ligne de commande (sans limite
 * de durée, contrairement à une page web) :
 *
 *   C:/xampp/php/php.exe scripts/wordpress/importer.php [dossier du WordPress] [etape]
 *
 *   etape « theme »     active le thème snhg et crée les langues de Polylang (à faire une fois, avant le reste)
 *   etape « contenus »  (par défaut) médias, pages, articles, diapositives, stations, menus et réglages
 *   etape « pages » <clés>  contenu et réglages de quelques pages seulement, sans toucher au reste (une page nouvelle est créée)
 *                       (clés séparées par des virgules : fr:groupe/presentation.html,en:groupe/presentation.html)
 *   etape « menus »     menus de chaque langue seulement, recréés depuis sources/navigation.json
 *
 * Le travail est fait par wordpress/snhg/inc/importer.php, au nom du premier administrateur du site.
 */
if (PHP_SAPI !== 'cli') exit(1);

$wordpress = rtrim($argv[1] ?? 'C:/xampp/htdocs/website_SNHG', '/\\');
$etape = $argv[2] ?? 'contenus';
$_SERVER['HTTP_HOST'] = $_SERVER['HTTP_HOST'] ?? 'localhost';
$_SERVER['REQUEST_URI'] = $_SERVER['REQUEST_URI'] ?? '/';
// Polylang ne charge rien en ligne de commande tant qu'aucune langue n'existe, et son mode visiteur filtre les requêtes : on lui impose son mode administration
// (filtre posé avant le chargement de WordPress, que WordPress reprend tel quel)
$GLOBALS['wp_filter']['pll_context'][10][] = ['function' => fn() => 'PLL_Admin', 'accepted_args' => 1];
require $wordpress . '/wp-load.php';

$admin = get_users(['role' => 'administrator', 'number' => 1, 'orderby' => 'ID']);
if (!$admin) { fwrite(STDERR, "Aucun administrateur\n"); exit(1); }
wp_set_current_user($admin[0]->ID);

try {
	if ($etape === 'theme') {
		if (get_stylesheet() !== 'snhg') switch_theme('snhg');
		require get_theme_root() . '/snhg/inc/importer.php';
		$bilan = ['theme' => get_option('stylesheet')] + snhg_importer_langues();
	} else {
		if (get_stylesheet() !== 'snhg') throw new RuntimeException("le thème snhg n'est pas actif : lancer d'abord l'étape « theme »");
		require get_template_directory() . '/inc/importer.php';
		$fichier = wp_upload_dir()['basedir'] . '/snhg-import/contenus.json';
		$contenus = json_decode(file_get_contents($fichier), true);
		if (!$contenus) throw new RuntimeException("contenus illisibles : $fichier");
		if ($etape === 'menus') {
			snhg_importer_menus($contenus, snhg_cles('page'), snhg_cles('post'));
			$bilan = ['menus' => array_keys($contenus['menus'])];
		} else {
			$bilan = $etape === 'pages'
				? snhg_importer_pages($contenus, array_filter(explode(',', $argv[3] ?? '')))
				: snhg_importer_contenus($contenus);
		}
	}
	echo json_encode($bilan, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES), "\n";
} catch (Throwable $e) {
	fwrite(STDERR, 'Erreur : ' . $e->getMessage() . ' (' . basename($e->getFile()) . ':' . $e->getLine() . ")\n");
	exit(1);
}
