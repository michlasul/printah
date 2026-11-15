<?php
/**
 * Provide an admin area view for the plugin.
 *
 * @package    Printah
 * @subpackage Printah/admin/partials
 */

namespace Printah\Admin;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$printah_settings        = Printah_Settings::get();
$printah_user_agent      = isset( $_SERVER['HTTP_USER_AGENT'] ) ? sanitize_text_field( wp_unslash( $_SERVER['HTTP_USER_AGENT'] ) ) : '';
$printah_is_mac          = false !== stripos( $printah_user_agent, 'Mac' );
$printah_mod_label       = $printah_is_mac ? '⌘' : 'Ctrl+';
$printah_shift_label     = $printah_is_mac ? '⇧' : 'Shift+';
$printah_has_elementor   = did_action( 'elementor/loaded' ) || defined( 'ELEMENTOR_VERSION' );
$printah_has_woocommerce = class_exists( 'WooCommerce' );

$printah_shortcuts = array(
	'mod+k'       => $printah_mod_label . 'K',
	'mod+j'       => $printah_mod_label . 'J',
	'mod+shift+k' => $printah_mod_label . $printah_shift_label . 'K',
	'mod+shift+j' => $printah_mod_label . $printah_shift_label . 'J',
);
?>

<div class="wrap printah-settings">
	<div class="printah-shell">
		<header class="printah-hero">
			<div class="printah-hero__brand">
				<div class="printah-hero__mark" aria-hidden="true">
					<svg width="22" height="22" viewBox="0 0 24 24" fill="none">
						<path d="M9 15V9a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3v6a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3Z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
					</svg>
				</div>
				<div class="printah-hero__copy">
					<div class="printah-hero__title-row">
						<h1><?php esc_html_e( 'Printah', 'printah' ); ?></h1>
						<span class="printah-version"><?php echo esc_html( 'v' . PRINTAH_VERSION ); ?></span>
					</div>
					<p class="printah-hero__subtitle">
						<?php esc_html_e( 'Fast command palette and floating navigation across WordPress admin and editors.', 'printah' ); ?>
					</p>
				</div>
			</div>

			<div class="printah-status-group" aria-label="<?php esc_attr_e( 'Environment status', 'printah' ); ?>">
				<span class="printah-status-pill is-active">
					<span class="printah-status-dot" aria-hidden="true"></span>
					<?php esc_html_e( 'WordPress', 'printah' ); ?>
				</span>
				<span class="printah-status-pill <?php echo esc_attr( $printah_has_elementor ? 'is-active' : 'is-inactive' ); ?>">
					<span class="printah-status-dot" aria-hidden="true"></span>
					<?php esc_html_e( 'Elementor', 'printah' ); ?>
				</span>
				<span class="printah-status-pill <?php echo esc_attr( $printah_has_woocommerce ? 'is-active' : 'is-inactive' ); ?>">
					<span class="printah-status-dot" aria-hidden="true"></span>
					<?php esc_html_e( 'WooCommerce', 'printah' ); ?>
				</span>
			</div>
		</header>

		<?php settings_errors( Printah_Settings::OPTION ); ?>

		<div id="printah-settings-feedback" class="printah-alert" role="status" aria-live="polite" hidden></div>

		<form method="post" action="options.php" class="printah-form" id="printah-settings-form" novalidate>
			<?php settings_fields( 'printah_settings' ); ?>

			<div class="printah-grid">
				<div class="printah-column printah-column--main">
					<section class="printah-card" aria-labelledby="printah-section-shortcuts">
						<div class="printah-card__header">
							<h2 id="printah-section-shortcuts"><?php esc_html_e( 'Keyboard Shortcuts', 'printah' ); ?></h2>
							<p><?php esc_html_e( 'Choose non-overlapping shortcuts for Printah and the built-in WordPress palette.', 'printah' ); ?></p>
						</div>

						<div class="printah-field-list">
							<div class="printah-field printah-field--select">
								<div class="printah-field__info">
									<label for="printah_shortcut" class="printah-field__label">
										<?php esc_html_e( 'Printah Palette Shortcut', 'printah' ); ?>
									</label>
									<p class="printah-field__hint" id="printah-shortcut-hint">
										<?php esc_html_e( 'Opens Printah from anywhere inside WP Admin and editors.', 'printah' ); ?>
									</p>
								</div>
								<div class="printah-field__control">
									<select
										name="printah_settings[printah_shortcut]"
										id="printah_shortcut"
										class="printah-select"
										aria-invalid="false"
										aria-describedby="printah-shortcut-hint"
										data-hint-id="printah-shortcut-hint"
										data-error-id="printah-shortcut-error"
									>
										<?php foreach ( $printah_shortcuts as $printah_key => $printah_label ) : ?>
											<option value="<?php echo esc_attr( $printah_key ); ?>" <?php selected( $printah_settings['printah_shortcut'], $printah_key ); ?>>
												<?php echo esc_html( $printah_label ); ?>
											</option>
										<?php endforeach; ?>
									</select>
								</div>
							</div>

							<div class="printah-field printah-field--toggle">
								<div class="printah-field__info">
									<label for="native_palette_enabled" class="printah-field__label">
										<?php esc_html_e( 'WordPress Command Palette', 'printah' ); ?>
									</label>
									<p class="printah-field__hint" id="printah-native-toggle-hint">
										<?php esc_html_e( 'Keep the native WordPress palette available alongside Printah.', 'printah' ); ?>
									</p>
								</div>
								<div class="printah-field__control">
									<label class="printah-switch" for="native_palette_enabled">
										<input
											type="checkbox"
											id="native_palette_enabled"
											name="printah_settings[native_palette_enabled]"
											value="1"
											class="printah-switch__input"
											aria-describedby="printah-native-toggle-hint"
											<?php checked( $printah_settings['native_palette_enabled'] ); ?>
										/>
										<span class="printah-switch__track" aria-hidden="true">
											<span class="printah-switch__thumb"></span>
										</span>
									</label>
								</div>
							</div>

							<div class="printah-field printah-field--select" id="printah-native-shortcut-row">
								<div class="printah-field__info">
									<label for="native_shortcut" class="printah-field__label">
										<?php esc_html_e( 'WordPress Palette Shortcut', 'printah' ); ?>
									</label>
									<p class="printah-field__hint" id="printah-native-shortcut-hint">
										<?php esc_html_e( 'Used when the built-in WordPress Command Palette is active.', 'printah' ); ?>
									</p>
								</div>
								<div class="printah-field__control">
									<select
										name="printah_settings[native_shortcut]"
										id="native_shortcut"
										class="printah-select"
										aria-invalid="false"
										aria-describedby="printah-native-shortcut-hint"
										data-hint-id="printah-native-shortcut-hint"
										data-error-id="printah-shortcut-error"
									>
										<?php foreach ( $printah_shortcuts as $printah_key => $printah_label ) : ?>
											<option value="<?php echo esc_attr( $printah_key ); ?>" <?php selected( $printah_settings['native_shortcut'], $printah_key ); ?>>
												<?php echo esc_html( $printah_label ); ?>
											</option>
										<?php endforeach; ?>
									</select>
								</div>
							</div>
						</div>

						<p id="printah-shortcut-error" class="printah-field-error" hidden></p>
					</section>

					<section class="printah-card" aria-labelledby="printah-section-workspace">
						<div class="printah-card__header">
							<h2 id="printah-section-workspace"><?php esc_html_e( 'Floating Pill & Toolbar', 'printah' ); ?></h2>
							<p><?php esc_html_e( 'Control the bottom-center quick launcher and the default WordPress admin bar.', 'printah' ); ?></p>
						</div>

						<div class="printah-field-list">
							<div class="printah-field printah-field--toggle">
								<div class="printah-field__info">
									<label for="show_floating_pill" class="printah-field__label">
										<?php esc_html_e( 'Show Floating Pill', 'printah' ); ?>
									</label>
									<p class="printah-field__hint" id="printah-pill-hint">
										<?php esc_html_e( 'Display the floating pill for View Site, Comments, New, and Profile actions.', 'printah' ); ?>
									</p>
								</div>
								<div class="printah-field__control">
									<label class="printah-switch" for="show_floating_pill">
										<input
											type="checkbox"
											id="show_floating_pill"
											name="printah_settings[show_floating_pill]"
											value="1"
											class="printah-switch__input"
											aria-invalid="false"
											aria-describedby="printah-pill-hint"
											data-hint-id="printah-pill-hint"
											data-error-id="printah-toolbar-error"
											<?php checked( $printah_settings['show_floating_pill'] ); ?>
										/>
										<span class="printah-switch__track" aria-hidden="true">
											<span class="printah-switch__thumb"></span>
										</span>
									</label>
								</div>
							</div>

							<div class="printah-field printah-field--toggle">
								<div class="printah-field__info">
									<label for="hide_toolbar" class="printah-field__label">
										<?php esc_html_e( 'Hide WordPress Toolbar', 'printah' ); ?>
									</label>
									<p class="printah-field__hint" id="printah-toolbar-hint">
										<?php esc_html_e( 'Hide the top admin bar in WP Admin when the Printah floating pill is active.', 'printah' ); ?>
									</p>
								</div>
								<div class="printah-field__control">
									<label class="printah-switch" for="hide_toolbar">
										<input
											type="checkbox"
											id="hide_toolbar"
											name="printah_settings[hide_toolbar]"
											value="1"
											class="printah-switch__input"
											aria-invalid="false"
											aria-describedby="printah-toolbar-hint"
											data-hint-id="printah-toolbar-hint"
											data-error-id="printah-toolbar-error"
											<?php checked( $printah_settings['hide_toolbar'] ); ?>
										/>
										<span class="printah-switch__track" aria-hidden="true">
											<span class="printah-switch__thumb"></span>
										</span>
									</label>
								</div>
							</div>
						</div>

						<p id="printah-toolbar-error" class="printah-field-error" hidden></p>
					</section>

					<section class="printah-card" aria-labelledby="printah-section-modules">
						<div class="printah-card__header">
							<h2 id="printah-section-modules"><?php esc_html_e( 'Search & Integrations', 'printah' ); ?></h2>
							<p><?php esc_html_e( 'Tune live content indexing and plugin command modules.', 'printah' ); ?></p>
						</div>

						<div class="printah-field-list">
							<div class="printah-field printah-field--toggle">
								<div class="printah-field__info">
									<label for="content_search_enabled" class="printah-field__label">
										<?php esc_html_e( 'Live Content Search', 'printah' ); ?>
									</label>
									<p class="printah-field__hint" id="printah-search-hint">
										<?php esc_html_e( 'Search posts, pages, products, and templates when typing 3 or more characters.', 'printah' ); ?>
									</p>
								</div>
								<div class="printah-field__control">
									<label class="printah-switch" for="content_search_enabled">
										<input
											type="checkbox"
											id="content_search_enabled"
											name="printah_settings[content_search_enabled]"
											value="1"
											class="printah-switch__input"
											aria-describedby="printah-search-hint"
											<?php checked( $printah_settings['content_search_enabled'] ); ?>
										/>
										<span class="printah-switch__track" aria-hidden="true">
											<span class="printah-switch__thumb"></span>
										</span>
									</label>
								</div>
							</div>

							<div class="printah-field printah-field--toggle">
								<div class="printah-field__info">
									<div class="printah-field__label-row">
										<label for="module_elementor_enabled" class="printah-field__label">
											<?php esc_html_e( 'Elementor Commands', 'printah' ); ?>
										</label>
										<span class="printah-badge <?php echo esc_attr( $printah_has_elementor ? 'is-ready' : 'is-muted' ); ?>">
											<?php echo esc_html( $printah_has_elementor ? __( 'Detected', 'printah' ) : __( 'Not active', 'printah' ) ); ?>
										</span>
									</div>
									<p class="printah-field__hint" id="printah-elementor-hint">
										<?php esc_html_e( 'Include Elementor templates, tools, settings, and quick "Edit with Elementor" actions.', 'printah' ); ?>
									</p>
								</div>
								<div class="printah-field__control">
									<label class="printah-switch" for="module_elementor_enabled">
										<input
											type="checkbox"
											id="module_elementor_enabled"
											name="printah_settings[module_elementor_enabled]"
											value="1"
											class="printah-switch__input"
											aria-describedby="printah-elementor-hint"
											<?php checked( $printah_settings['module_elementor_enabled'] ); ?>
										/>
										<span class="printah-switch__track" aria-hidden="true">
											<span class="printah-switch__thumb"></span>
										</span>
									</label>
								</div>
							</div>

							<div class="printah-field printah-field--toggle">
								<div class="printah-field__info">
									<div class="printah-field__label-row">
										<label for="module_woocommerce_enabled" class="printah-field__label">
											<?php esc_html_e( 'WooCommerce Commands', 'printah' ); ?>
										</label>
										<span class="printah-badge <?php echo esc_attr( $printah_has_woocommerce ? 'is-ready' : 'is-muted' ); ?>">
											<?php echo esc_html( $printah_has_woocommerce ? __( 'Detected', 'printah' ) : __( 'Not active', 'printah' ) ); ?>
										</span>
									</div>
									<p class="printah-field__hint" id="printah-woo-hint">
										<?php esc_html_e( 'Include store commands and product search for Orders, Products, Coupons, and Analytics.', 'printah' ); ?>
									</p>
								</div>
								<div class="printah-field__control">
									<label class="printah-switch" for="module_woocommerce_enabled">
										<input
											type="checkbox"
											id="module_woocommerce_enabled"
											name="printah_settings[module_woocommerce_enabled]"
											value="1"
											class="printah-switch__input"
											aria-describedby="printah-woo-hint"
											<?php checked( $printah_settings['module_woocommerce_enabled'] ); ?>
										/>
										<span class="printah-switch__track" aria-hidden="true">
											<span class="printah-switch__thumb"></span>
										</span>
									</label>
								</div>
							</div>
						</div>
					</section>
				</div>

				<aside class="printah-column printah-column--side">
					<section class="printah-card" aria-labelledby="printah-section-guide">
						<div class="printah-card__header">
							<h2 id="printah-section-guide"><?php esc_html_e( 'Quick Reference', 'printah' ); ?></h2>
							<p><?php esc_html_e( 'Essential keys while navigating inside the palette.', 'printah' ); ?></p>
						</div>

						<dl class="printah-guide-list">
							<div class="printah-guide-item">
								<dt><?php esc_html_e( 'Open Palette', 'printah' ); ?></dt>
								<dd><kbd class="printah-kbd" id="printah-guide-open"><?php echo esc_html( $printah_shortcuts[ $printah_settings['printah_shortcut'] ] ?? ( $printah_mod_label . 'K' ) ); ?></kbd></dd>
							</div>
							<div class="printah-guide-item">
								<dt><?php esc_html_e( 'Search Trigger', 'printah' ); ?></dt>
								<dd><kbd class="printah-kbd"><?php esc_html_e( '3+ chars', 'printah' ); ?></kbd></dd>
							</div>
							<div class="printah-guide-item">
								<dt><?php esc_html_e( 'Item Actions', 'printah' ); ?></dt>
								<dd><kbd class="printah-kbd"><?php echo esc_html( $printah_mod_label . 'K' ); ?></kbd></dd>
							</div>
							<div class="printah-guide-item">
								<dt><?php esc_html_e( 'Navigate List', 'printah' ); ?></dt>
								<dd><span class="printah-kbd-pair"><kbd class="printah-kbd">↑</kbd><kbd class="printah-kbd">↓</kbd></span></dd>
							</div>
							<div class="printah-guide-item">
								<dt><?php esc_html_e( 'Run / Close', 'printah' ); ?></dt>
								<dd><span class="printah-kbd-pair"><kbd class="printah-kbd">↵</kbd><kbd class="printah-kbd">Esc</kbd></span></dd>
							</div>
						</dl>
					</section>

					<section class="printah-card printah-card--pro" aria-labelledby="printah-section-pro">
						<div class="printah-card__header">
							<div class="printah-pro-title">
								<h2 id="printah-section-pro"><?php esc_html_e( 'Printah Pro', 'printah' ); ?></h2>
								<span class="printah-badge is-pro"><?php esc_html_e( 'Roadmap', 'printah' ); ?></span>
							</div>
							<p><?php esc_html_e( 'AI-assisted workflows designed to run straight from the command palette.', 'printah' ); ?></p>
						</div>

						<ul class="printah-pro-list">
							<li><?php esc_html_e( 'Custom Elementor widgets and page drafts', 'printah' ); ?></li>
							<li><?php esc_html_e( 'Guided WooCommerce product creation and sales analysis', 'printah' ); ?></li>
							<li><?php esc_html_e( 'Fast AI post drafting directly in WordPress', 'printah' ); ?></li>
						</ul>
					</section>
				</aside>
			</div>

			<div class="printah-footer">
				<p class="printah-footer__note">
					<?php esc_html_e( 'Changes take effect immediately across WP Admin after saving.', 'printah' ); ?>
				</p>
				<button type="submit" name="submit" id="submit" class="printah-submit">
					<?php esc_html_e( 'Save Settings', 'printah' ); ?>
				</button>
			</div>
		</form>
	</div>
</div>
