<?php
/**
 * [snhg_diaporama] : diaporama d'ouverture de l'accueil (section .hero de la page), d'après les diapositives
 * « Diaporama d'accueil » de la langue de la page, dans l'ordre de leur champ « Ordre ». Mêmes balises que
 * scripts/diaporama.js : fonds empilés, voile, commandes (pause, repères), légendes ; app.js les anime.
 * La première image (affiche de la vidéo ou photo) est préchargée dans le <head>.
 */
defined('ABSPATH') || exit;

function snhg_diapositives(): array {
	return get_posts(['post_type' => 'snhg_diapositive', 'post_status' => 'publish', 'posts_per_page' => 20,
		'orderby' => ['menu_order' => 'ASC', 'date' => 'ASC'], 'lang' => snhg_langue(), 'no_found_rows' => true]);
}

/* Sources d'une vidéo : WebM d'abord (plus léger), MP4 pour les autres navigateurs */
function snhg_diapo_sources(int $webm, int $mp4, string $media = ''): array {
	$sources = [];
	if ($webm) $sources[] = '<source src="' . esc_url(wp_get_attachment_url($webm)) . '" type="video/webm; codecs=vp9"' . $media . '>';
	if ($mp4) $sources[] = '<source src="' . esc_url(wp_get_attachment_url($mp4)) . '" type="video/mp4"' . $media . '>';
	return $sources;
}

/* Fond : ni autoplay ni chargement différé ; preload="none", app.js lance la vidéo quand il le peut (pas en économie
   de données, ni si la personne limite les animations, ni sur téléphone sans version verticale) */
function snhg_diapo_fond(WP_Post $d, int $i, bool $seule): string {
	$actif = $i === 0 ? ' est-actif' : '';
	if (snhg_champ('type_fond', $d->ID) !== 'photo') {
		$mp4 = (int) snhg_champ('video', $d->ID);
		$mobile = (int) snhg_champ('video_mobile', $d->ID);
		$webm = (int) snhg_champ('video_webm', $d->ID);
		$mobile_webm = (int) snhg_champ('video_mobile_webm', $d->ID);
		$liste = $mobile || $mobile_webm
			? array_merge(snhg_diapo_sources($webm, $mp4, ' media="(min-width: 768px)"'), snhg_diapo_sources($mobile_webm, $mobile))
			: snhg_diapo_sources($webm, $mp4);
		$meta = $mp4 ? wp_get_attachment_metadata($mp4) : [];
		$affiche = (int) snhg_champ('affiche', $d->ID);
		return '      <video class="hero-fond' . $actif . '" muted playsinline' . ($seule ? ' loop' : '') . ' preload="none" poster="' . esc_url($affiche ? wp_get_attachment_url($affiche) : '') . '" width="' . (int) ($meta['width'] ?? 1920) . '" height="' . (int) ($meta['height'] ?? 1080) . "\">\n"
			. implode('', array_map(fn($s) => "        $s\n", $liste)) . '      </video>';
	}
	$photo = (int) snhg_champ('photo', $d->ID);
	$image = $photo ? wp_get_attachment_image_src($photo, 'full') : null;
	if (!$image) return '';
	$priorite = $i === 0 ? ' fetchpriority="high"' : ' fetchpriority="low" decoding="async"';
	return '      <img class="hero-fond hero-image' . $actif . '" src="' . esc_url($image[0]) . '" srcset="' . esc_attr(wp_get_attachment_image_srcset($photo, 'full')) . '" sizes="100vw" alt="" width="' . (int) $image[1] . '" height="' . (int) $image[2] . '"' . $priorite . '>';
}

function snhg_diapo_bouton(array $b): string {
	$lien = $b['lien'] ?? [];
	if (empty($lien['url'])) return '';
	$cible = !empty($lien['target']) ? ' target="' . esc_attr($lien['target']) . '" rel="noopener noreferrer"' : '';
	$texte = esc_html($lien['title'] ?? '');
	return ($b['style'] ?? '') === 'contour'
		? '<a class="bouton bouton-contour-blanc" href="' . esc_url($lien['url']) . '"' . $cible . '>' . $texte . '</a>'
		: '<a class="bouton" href="' . esc_url($lien['url']) . '"' . $cible . '>' . $texte . ' <span class="fleche" aria-hidden="true">→</span></a>';
}

/* Légende : la première diapositive porte le titre de la page (h1), les suivantes un paragraphe de même style */
function snhg_diapo_legende(WP_Post $d, int $i, int $total): string {
	$titre = wp_kses_post(snhg_champ('titre', $d->ID));
	$balise = $i === 0 ? '<h1 class="hero-titre" id="hero-titre">' . $titre . '</h1>' : '<p class="hero-titre">' . $titre . '</p>';
	$boutons = array_filter(array_map('snhg_diapo_bouton', (array) snhg_champ('boutons', $d->ID)));
	return '        <div class="hero-bloc' . ($i === 0 ? ' est-actif' : '') . '" id="hero-diapo-' . ($i + 1) . '" role="group" aria-roledescription="' . esc_attr(snhg_t('diapositive')) . '" aria-label="' . esc_attr(snhg_t('diapositive-rang', ['n' => $i + 1, 'total' => $total])) . '" data-duree="' . (int) (snhg_champ('duree', $d->ID) ?: 8) . '"' . ($i === 0 ? '' : ' inert') . ">\n"
		. '          <p class="sur-titre clair">' . wp_kses_post(snhg_champ('sur_titre', $d->ID)) . "</p>\n"
		. "          $balise\n"
		. '          <p class="hero-chapo">' . wp_kses_post(snhg_champ('chapo', $d->ID)) . "</p>\n"
		. "          <div class=\"hero-actions\">\n"
		. implode('', array_map(fn($b) => "            $b\n", $boutons))
		. "          </div>\n        </div>";
}

/* Commandes placées avant les légendes : le bouton pause est le premier élément atteint au clavier */
function snhg_diapo_commandes(array $diapos): string {
	$total = count($diapos);
	$reperes = '';
	if ($total > 1) {
		$reperes = "\n      <div class=\"hero-reperes\">\n";
		foreach ($diapos as $i => $d) {
			$reperes .= '        <button class="hero-repere" type="button" aria-controls="hero-diapo-' . ($i + 1) . '"' . ($i === 0 ? ' aria-current="true"' : '') . '><span class="visuellement-masque">'
				. esc_html(snhg_t('diapositive-repere', ['n' => $i + 1, 'total' => $total, 'titre' => wp_strip_all_tags(snhg_champ('titre', $d->ID))])) . "</span></button>\n";
		}
		$reperes .= '      </div>';
	}
	return "    <div class=\"hero-commandes\">\n"
		. '      <button class="hero-pause bouton-rond" type="button" aria-pressed="false" aria-label="' . esc_attr(snhg_t('diaporama-pause')) . "\">\n"
		. "        <svg class=\"icone icone-pause\" aria-hidden=\"true\"><use href=\"#i-pause\"/></svg>\n"
		. "        <svg class=\"icone icone-lecture\" aria-hidden=\"true\"><use href=\"#i-lecture\"/></svg>\n"
		. "      </button>$reperes\n    </div>";
}

/* Première image, préchargée dans le <head> (le contenu de la page est mis en forme avant l'en-tête) */
function snhg_diapo_prechargement(WP_Post $d): ?array {
	if (snhg_champ('type_fond', $d->ID) !== 'photo') {
		$affiche = (int) snhg_champ('affiche', $d->ID);
		return $affiche ? ['src' => wp_get_attachment_url($affiche)] : null;
	}
	$photo = (int) snhg_champ('photo', $d->ID);
	return $photo ? ['src' => wp_get_attachment_image_url($photo, 'full'), 'srcset' => wp_get_attachment_image_srcset($photo, 'full')] : null;
}

add_shortcode('snhg_diaporama', function () {
	$diapos = snhg_diapositives();
	if (!$diapos) return '';
	$GLOBALS['snhg_precharger'] = snhg_diapo_prechargement($diapos[0]);
	$seule = count($diapos) === 1;
	$fonds = array_map(fn($d, $i) => snhg_diapo_fond($d, $i, $seule), $diapos, array_keys($diapos));
	$legendes = array_map(fn($d, $i) => snhg_diapo_legende($d, $i, count($diapos)), $diapos, array_keys($diapos));
	return "<div class=\"hero-fonds\" aria-hidden=\"true\">\n" . implode("\n", $fonds) . "\n    </div>\n"
		. "    <div class=\"voile\" aria-hidden=\"true\"></div>\n"
		. snhg_diapo_commandes($diapos) . "\n"
		. "    <div class=\"conteneur hero-contenu\">\n      <div class=\"hero-legendes\" aria-live=\"off\">\n"
		. implode("\n", $legendes) . "\n      </div>\n    </div>";
});
