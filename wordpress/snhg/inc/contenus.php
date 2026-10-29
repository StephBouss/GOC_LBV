<?php
/**
 * Types de contenus gérés depuis l'administration et leurs champs (extension Secure Custom Fields) :
 *
 *  Diaporama d'accueil (snhg_diapositive)  une diapositive : fond vidéo ou photo, sur-titre, titre, chapô, boutons ;
 *                                          traduite avec Polylang (une diapositive par langue), dans l'ordre du champ « Ordre »
 *  Stations Gab'Oil (snhg_station)         une station : ville, province, état, coordonnées, photo ; la même fiche sert
 *                                          aux deux langues (seuls les textes de la carte se traduisent, dans le thème)
 *  Articles                                cadrage et texte alternatif de l'image à la une
 *  Pages                                   titre de l'onglet, description pour les moteurs de recherche, rubrique du menu
 */
defined('ABSPATH') || exit;

add_action('init', function () {
	register_post_type('snhg_diapositive', [
		'labels' => [
			'name' => "Diaporama d'accueil",
			'singular_name' => 'Diapositive',
			'menu_name' => "Diaporama d'accueil",
			'all_items' => 'Toutes les diapositives',
			'add_new' => 'Ajouter',
			'add_new_item' => 'Ajouter une diapositive',
			'edit_item' => 'Modifier la diapositive',
			'new_item' => 'Nouvelle diapositive',
			'search_items' => 'Rechercher une diapositive',
			'not_found' => 'Aucune diapositive',
		],
		'description' => "Diapositives d'ouverture de l'accueil, affichées dans l'ordre du champ « Ordre ».",
		'public' => false,
		'show_ui' => true,
		'show_in_rest' => false,
		'menu_position' => 21,
		'menu_icon' => 'dashicons-format-video',
		'supports' => ['title', 'page-attributes'],
	]);
	register_post_type('snhg_station', [
		'labels' => [
			'name' => "Stations Gab'Oil",
			'singular_name' => 'Station',
			'menu_name' => "Stations Gab'Oil",
			'all_items' => 'Toutes les stations',
			'add_new' => 'Ajouter',
			'add_new_item' => 'Ajouter une station',
			'edit_item' => 'Modifier la station',
			'new_item' => 'Nouvelle station',
			'search_items' => 'Rechercher une station',
			'not_found' => 'Aucune station',
		],
		'description' => "Stations-service du réseau Gab'Oil, montrées sur la carte du Gabon (accueil et page des stations).",
		'public' => false,
		'show_ui' => true,
		'show_in_rest' => false,
		'menu_position' => 22,
		'menu_icon' => 'dashicons-location-alt',
		'supports' => ['title', 'page-attributes'],
	]);
});

/* Polylang : les diapositives se traduisent ; les stations, non (noms propres, une seule fiche par station) */
add_filter('pll_get_post_types', function ($types, $reglages) {
	if (!$reglages) $types['snhg_diapositive'] = 'snhg_diapositive';
	unset($types['snhg_station']);
	return $types;
}, 10, 2);

/* Listes de l'administration dans l'ordre d'affichage du site */
add_action('pre_get_posts', function ($requete) {
	if (is_admin() && $requete->is_main_query() && in_array($requete->get('post_type'), ['snhg_diapositive', 'snhg_station'], true) && !$requete->get('orderby')) {
		$requete->set('orderby', ['menu_order' => 'ASC', 'title' => 'ASC']);
	}
});

const SNHG_ETATS = ['service' => 'En service', 'construction' => 'En construction', 'etudes' => 'Études en cours'];

add_action('acf/init', function () {
	$si_video = [[['field' => 'field_snhg_diapo_type_fond', 'operator' => '==', 'value' => 'video']]];
	acf_add_local_field_group([
		'key' => 'group_snhg_diapositive',
		'title' => 'Diapositive',
		'location' => [[['param' => 'post_type', 'operator' => '==', 'value' => 'snhg_diapositive']]],
		'position' => 'acf_after_title',
		'style' => 'seamless',
		'instruction_placement' => 'field',
		'fields' => [
			['key' => 'field_snhg_diapo_sur_titre', 'name' => 'sur_titre', 'label' => 'Sur-titre', 'type' => 'text', 'required' => 1],
			['key' => 'field_snhg_diapo_titre', 'name' => 'titre', 'label' => 'Titre', 'type' => 'text', 'required' => 1,
				'instructions' => "Le titre de la première diapositive est le titre principal de l'accueil : une phrase qui présente la SNHG."],
			['key' => 'field_snhg_diapo_chapo', 'name' => 'chapo', 'label' => 'Chapô', 'type' => 'textarea', 'rows' => 3, 'new_lines' => '', 'required' => 1],
			['key' => 'field_snhg_diapo_duree', 'name' => 'duree', 'label' => 'Durée', 'type' => 'number', 'min' => 3, 'max' => 60, 'step' => 1,
				'default_value' => 8, 'append' => 'secondes', 'instructions' => "Une vidéo passe à la diapositive suivante quand elle se termine ; une photo reste affichée cette durée."],
			['key' => 'field_snhg_diapo_type_fond', 'name' => 'type_fond', 'label' => 'Fond', 'type' => 'button_group',
				'choices' => ['video' => 'Vidéo', 'photo' => 'Photo'], 'default_value' => 'video'],
			['key' => 'field_snhg_diapo_video', 'name' => 'video', 'label' => 'Vidéo (MP4, format large)', 'type' => 'file', 'return_format' => 'id', 'mime_types' => 'mp4',
				'instructions' => 'Sans son, en 1920 × 1080 px.', 'conditional_logic' => $si_video, 'wrapper' => ['width' => 50]],
			['key' => 'field_snhg_diapo_video_webm', 'name' => 'video_webm', 'label' => 'Vidéo WebM, format large (facultative)', 'type' => 'file', 'return_format' => 'id', 'mime_types' => 'webm',
				'instructions' => 'Plus légère que le MP4 : les navigateurs qui la lisent la préfèrent.', 'conditional_logic' => $si_video, 'wrapper' => ['width' => 50]],
			['key' => 'field_snhg_diapo_video_mobile', 'name' => 'video_mobile', 'label' => 'Vidéo verticale pour les téléphones (MP4, facultative)', 'type' => 'file', 'return_format' => 'id', 'mime_types' => 'mp4',
				'instructions' => "Sans elle, les téléphones n'affichent que l'image d'affiche.", 'conditional_logic' => $si_video, 'wrapper' => ['width' => 50]],
			['key' => 'field_snhg_diapo_video_mobile_webm', 'name' => 'video_mobile_webm', 'label' => 'Vidéo verticale WebM (facultative)', 'type' => 'file', 'return_format' => 'id', 'mime_types' => 'webm',
				'conditional_logic' => $si_video, 'wrapper' => ['width' => 50]],
			['key' => 'field_snhg_diapo_affiche', 'name' => 'affiche', 'label' => "Image d'affiche", 'type' => 'image', 'return_format' => 'id', 'preview_size' => 'medium',
				'instructions' => "Première image de la vidéo, affichée pendant son chargement et pour les visiteurs qui limitent les animations.", 'conditional_logic' => $si_video],
			['key' => 'field_snhg_diapo_photo', 'name' => 'photo', 'label' => 'Photo', 'type' => 'image', 'return_format' => 'id', 'preview_size' => 'medium',
				'instructions' => 'Format paysage, 1536 px de large au moins.',
				'conditional_logic' => [[['field' => 'field_snhg_diapo_type_fond', 'operator' => '==', 'value' => 'photo']]]],
			['key' => 'field_snhg_diapo_boutons', 'name' => 'boutons', 'label' => 'Boutons', 'type' => 'repeater', 'layout' => 'table', 'min' => 0, 'max' => 2,
				'button_label' => 'Ajouter un bouton', 'sub_fields' => [
					['key' => 'field_snhg_diapo_bouton_lien', 'name' => 'lien', 'label' => 'Texte et lien', 'type' => 'link', 'return_format' => 'array', 'required' => 1],
					['key' => 'field_snhg_diapo_bouton_style', 'name' => 'style', 'label' => 'Style', 'type' => 'select',
						'choices' => ['principal' => 'Rouge (principal)', 'contour' => 'Contour blanc'], 'default_value' => 'principal'],
				]],
		],
	]);

	acf_add_local_field_group([
		'key' => 'group_snhg_station',
		'title' => 'Station',
		'location' => [[['param' => 'post_type', 'operator' => '==', 'value' => 'snhg_station']]],
		'position' => 'acf_after_title',
		'style' => 'seamless',
		'fields' => [
			['key' => 'field_snhg_station_ville', 'name' => 'ville', 'label' => 'Ville', 'type' => 'text', 'wrapper' => ['width' => 50]],
			['key' => 'field_snhg_station_province', 'name' => 'province', 'label' => 'Province', 'type' => 'text', 'wrapper' => ['width' => 50],
				'instructions' => 'Laisser vide tant que la province n\'est pas confirmée.'],
			['key' => 'field_snhg_station_etat', 'name' => 'etat', 'label' => 'État', 'type' => 'button_group', 'choices' => SNHG_ETATS, 'default_value' => 'service'],
			['key' => 'field_snhg_station_latitude', 'name' => 'latitude', 'label' => 'Latitude', 'type' => 'number', 'step' => 'any', 'wrapper' => ['width' => 50],
				'instructions' => "En degrés décimaux, comme dans Google Maps (positive au nord de l'équateur). Sans coordonnées, la station figure dans la liste mais pas sur la carte."],
			['key' => 'field_snhg_station_longitude', 'name' => 'longitude', 'label' => 'Longitude', 'type' => 'number', 'step' => 'any', 'wrapper' => ['width' => 50],
				'instructions' => 'En degrés décimaux (positive à l\'est). Pour 9°22\'31.3"E : 9 + 22 ÷ 60 + 31,3 ÷ 3600 = 9.375361.'],
			['key' => 'field_snhg_station_provisoire', 'name' => 'position_provisoire', 'label' => 'Position provisoire', 'type' => 'true_false', 'ui' => 1,
				'message' => 'Position approchée (centre de la localité)', 'instructions' => "Une position provisoire n'a pas de lien Google Maps : il mènerait au centre de la localité, pas à la station."],
			['key' => 'field_snhg_station_photo', 'name' => 'photo', 'label' => 'Photo', 'type' => 'image', 'return_format' => 'id', 'preview_size' => 'medium',
				'instructions' => "Format paysage, montrée dans la bulle de la carte. Sans photo, la bulle montre le logo Gab'Oil."],
		],
	]);

	acf_add_local_field_group([
		'key' => 'group_snhg_article',
		'title' => 'Image à la une',
		'location' => [[['param' => 'post_type', 'operator' => '==', 'value' => 'post']]],
		'position' => 'side',
		'fields' => [
			['key' => 'field_snhg_article_alt', 'name' => 'texte_alternatif', 'label' => 'Texte alternatif', 'type' => 'text',
				'instructions' => "Ce que montre l'image, dans la langue de l'article (sinon celui de la médiathèque)."],
			['key' => 'field_snhg_article_cadrage', 'name' => 'cadrage', 'label' => 'Point de cadrage', 'type' => 'text', 'placeholder' => '50% 50%',
				'instructions' => "Partie de l'image gardée quand elle est recadrée : horizontal puis vertical, en pourcentage."],
		],
	]);

	acf_add_local_field_group([
		'key' => 'group_snhg_page',
		'title' => 'Page',
		'location' => [[['param' => 'post_type', 'operator' => '==', 'value' => 'page']]],
		'position' => 'side',
		'fields' => [
			['key' => 'field_snhg_page_titre', 'name' => 'snhg_titre', 'label' => "Titre de l'onglet", 'type' => 'text',
				'instructions' => "Titre affiché dans l'onglet du navigateur et dans les moteurs de recherche."],
			['key' => 'field_snhg_page_description', 'name' => 'snhg_description', 'label' => 'Description', 'type' => 'textarea', 'rows' => 4, 'new_lines' => '',
				'instructions' => 'Résumé de la page pour les moteurs de recherche et les aperçus de partage (160 caractères environ).'],
			['key' => 'field_snhg_page_onglet', 'name' => 'snhg_onglet', 'label' => 'Rubrique du menu', 'type' => 'select', 'allow_null' => 1,
				'choices' => ['groupe' => 'Le Groupe', 'activites' => 'Nos activités', 'engagements' => 'Nos engagements', 'carrieres' => 'Carrières', 'information' => 'Actualités & Médias', 'contact' => 'Contact'],
				'instructions' => "Onglet du menu signalé sur cette page ; sa liste de liens forme la bande de navigation de la page."],
		],
	]);
});
