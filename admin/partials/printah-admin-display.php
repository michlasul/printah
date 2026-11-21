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
	<div class="printah-header">
		<div class="printah-header__title">
			<div class="printah-header__row">
				<h1 class="wp-heading-inline"><?php esc_html_e( 'Printah', 'printah' ); ?></h1>
				<span class="printah-version"><?php echo esc_html( 'v' . PRINTAH_VERSION ); ?></span>
			</div>
			<p class="description">
				<?php esc_html_e( 'Fast command palette and floating navigation across WordPress admin and editors.', 'printah' ); ?>
			</p>
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
	</div>

	<hr class="wp-header-end" />

	<div id="printah-settings-feedback" class="notice notice-error inline printah-inline-notice" role="status" aria-live="polite" hidden></div>

	<form method="post" action="options.php" id="printah-settings-form" novalidate>
		<?php settings_fields( 'printah_settings' ); ?>

		<div class="printah-layout">
			<div class="printah-layout__main">
				<div class="postbox printah-postbox">
					<div class="postbox-header">
						<h2 class="hndle" id="printah-section-shortcuts"><?php esc_html_e( 'Keyboard Shortcuts', 'printah' ); ?></h2>
					</div>
					<div class="inside">
						<p class="description printah-section-desc">
							<?php esc_html_e( 'Choose non-overlapping shortcuts for Printah and the built-in WordPress palette.', 'printah' ); ?>
						</p>

						<table class="form-table printah-form-table" role="presentation" aria-labelledby="printah-section-shortcuts">
							<tbody>
								<tr>
									<th scope="row">
										<label for="printah_shortcut"><?php esc_html_e( 'Printah Palette Shortcut', 'printah' ); ?></label>
									</th>
									<td>
										<select
											name="printah_settings[printah_shortcut]"
											id="printah_shortcut"
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
										<p class="description" id="printah-shortcut-hint">
											<?php esc_html_e( 'Opens Printah from anywhere inside WP Admin and editors.', 'printah' ); ?>
										</p>
									</td>
								</tr>
								<tr>
									<th scope="row">
										<label for="native_palette_enabled"><?php esc_html_e( 'WordPress Command Palette', 'printah' ); ?></label>
									</th>
									<td>
										<label for="native_palette_enabled" class="printah-checkbox-label">
											<input
												type="checkbox"
												id="native_palette_enabled"
												name="printah_settings[native_palette_enabled]"
												value="1"
												aria-describedby="printah-native-toggle-hint"
												<?php checked( $printah_settings['native_palette_enabled'] ); ?>
											/>
											<span id="printah-native-toggle-hint">
												<?php esc_html_e( 'Keep the native WordPress palette available alongside Printah.', 'printah' ); ?>
											</span>
										</label>
									</td>
								</tr>
								<tr id="printah-native-shortcut-row">
									<th scope="row">
										<label for="native_shortcut"><?php esc_html_e( 'WordPress Palette Shortcut', 'printah' ); ?></label>
									</th>
									<td>
										<select
											name="printah_settings[native_shortcut]"
											id="native_shortcut"
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
										<p class="description" id="printah-native-shortcut-hint">
											<?php esc_html_e( 'Used when the built-in WordPress Command Palette is active.', 'printah' ); ?>
										</p>
									</td>
								</tr>
							</tbody>
						</table>

						<p id="printah-shortcut-error" class="printah-field-error" hidden></p>
					</div>
				</div>

				<div class="postbox printah-postbox">
					<div class="postbox-header">
						<h2 class="hndle" id="printah-section-workspace"><?php esc_html_e( 'Floating Pill & Toolbar', 'printah' ); ?></h2>
					</div>
					<div class="inside">
						<p class="description printah-section-desc">
							<?php esc_html_e( 'Control the bottom-center quick launcher and the default WordPress admin bar.', 'printah' ); ?>
						</p>

						<table class="form-table printah-form-table" role="presentation" aria-labelledby="printah-section-workspace">
							<tbody>
								<tr>
									<th scope="row">
										<label for="show_floating_pill"><?php esc_html_e( 'Show Floating Pill', 'printah' ); ?></label>
									</th>
									<td>
										<label for="show_floating_pill" class="printah-checkbox-label">
											<input
												type="checkbox"
												id="show_floating_pill"
												name="printah_settings[show_floating_pill]"
												value="1"
												aria-invalid="false"
												aria-describedby="printah-pill-hint"
												data-hint-id="printah-pill-hint"
												data-error-id="printah-toolbar-error"
												<?php checked( $printah_settings['show_floating_pill'] ); ?>
											/>
											<span id="printah-pill-hint">
												<?php esc_html_e( 'Display the floating pill for View Site, Comments, New, and Profile actions.', 'printah' ); ?>
											</span>
										</label>
									</td>
								</tr>
								<tr>
									<th scope="row">
										<label for="hide_toolbar"><?php esc_html_e( 'Hide WordPress Toolbar', 'printah' ); ?></label>
									</th>
									<td>
										<label for="hide_toolbar" class="printah-checkbox-label">
											<input
												type="checkbox"
												id="hide_toolbar"
												name="printah_settings[hide_toolbar]"
												value="1"
												aria-invalid="false"
												aria-describedby="printah-toolbar-hint"
												data-hint-id="printah-toolbar-hint"
												data-error-id="printah-toolbar-error"
												<?php checked( $printah_settings['hide_toolbar'] ); ?>
											/>
											<span id="printah-toolbar-hint">
												<?php esc_html_e( 'Hide the top admin bar in WP Admin when the Printah floating pill is active.', 'printah' ); ?>
											</span>
										</label>
									</td>
								</tr>
							</tbody>
						</table>

						<p id="printah-toolbar-error" class="printah-field-error" hidden></p>
					</div>
				</div>

				<div class="postbox printah-postbox">
					<div class="postbox-header">
						<h2 class="hndle" id="printah-section-modules"><?php esc_html_e( 'Search & Integrations', 'printah' ); ?></h2>
					</div>
					<div class="inside">
						<p class="description printah-section-desc">
							<?php esc_html_e( 'Tune live content indexing and plugin command modules.', 'printah' ); ?>
						</p>

						<table class="form-table printah-form-table" role="presentation" aria-labelledby="printah-section-modules">
							<tbody>
								<tr>
									<th scope="row">
										<label for="content_search_enabled"><?php esc_html_e( 'Live Content Search', 'printah' ); ?></label>
									</th>
									<td>
										<label for="content_search_enabled" class="printah-checkbox-label">
											<input
												type="checkbox"
												id="content_search_enabled"
												name="printah_settings[content_search_enabled]"
												value="1"
												aria-describedby="printah-search-hint"
												<?php checked( $printah_settings['content_search_enabled'] ); ?>
											/>
											<span id="printah-search-hint">
												<?php esc_html_e( 'Search posts, pages, products, and templates when typing 3 or more characters.', 'printah' ); ?>
											</span>
										</label>
									</td>
								</tr>
								<tr>
									<th scope="row">
										<label for="module_elementor_enabled"><?php esc_html_e( 'Elementor Commands', 'printah' ); ?></label>
									</th>
									<td>
										<div class="printah-integration-row">
											<label for="module_elementor_enabled" class="printah-checkbox-label">
												<input
													type="checkbox"
													id="module_elementor_enabled"
													name="printah_settings[module_elementor_enabled]"
													value="1"
													aria-describedby="printah-elementor-hint"
													<?php checked( $printah_settings['module_elementor_enabled'] ); ?>
												/>
												<span id="printah-elementor-hint">
													<?php esc_html_e( 'Include Elementor templates, tools, settings, and quick "Edit with Elementor" actions.', 'printah' ); ?>
												</span>
											</label>
											<span class="printah-badge <?php echo esc_attr( $printah_has_elementor ? 'is-ready' : 'is-muted' ); ?>">
												<?php echo esc_html( $printah_has_elementor ? __( 'Detected', 'printah' ) : __( 'Not active', 'printah' ) ); ?>
											</span>
										</div>
									</td>
								</tr>
								<tr>
									<th scope="row">
										<label for="module_woocommerce_enabled"><?php esc_html_e( 'WooCommerce Commands', 'printah' ); ?></label>
									</th>
									<td>
										<div class="printah-integration-row">
											<label for="module_woocommerce_enabled" class="printah-checkbox-label">
												<input
													type="checkbox"
													id="module_woocommerce_enabled"
													name="printah_settings[module_woocommerce_enabled]"
													value="1"
													aria-describedby="printah-woo-hint"
													<?php checked( $printah_settings['module_woocommerce_enabled'] ); ?>
												/>
												<span id="printah-woo-hint">
													<?php esc_html_e( 'Include store commands and product search for Orders, Products, Coupons, and Analytics.', 'printah' ); ?>
												</span>
											</label>
											<span class="printah-badge <?php echo esc_attr( $printah_has_woocommerce ? 'is-ready' : 'is-muted' ); ?>">
												<?php echo esc_html( $printah_has_woocommerce ? __( 'Detected', 'printah' ) : __( 'Not active', 'printah' ) ); ?>
											</span>
										</div>
									</td>
								</tr>
							</tbody>
						</table>
					</div>
				</div>

				<div class="printah-submit-bar">
					<?php submit_button( __( 'Save Settings', 'printah' ), 'primary', 'submit', false ); ?>
					<span class="description">
						<?php esc_html_e( 'Changes take effect immediately across WP Admin after saving.', 'printah' ); ?>
					</span>
				</div>
			</div>

			<aside class="printah-layout__side">
				<div class="postbox printah-postbox">
					<div class="postbox-header">
						<h2 class="hndle" id="printah-section-guide"><?php esc_html_e( 'Quick Reference', 'printah' ); ?></h2>
					</div>
					<div class="inside">
						<p class="description printah-section-desc">
							<?php esc_html_e( 'Essential keys while navigating inside the palette.', 'printah' ); ?>
						</p>

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
					</div>
				</div>

				<div class="postbox printah-postbox printah-postbox--pro">
					<div class="postbox-header">
						<h2 class="hndle" id="printah-section-pro"><?php esc_html_e( 'Printah Pro', 'printah' ); ?></h2>
						<div class="handle-actions">
							<span class="printah-badge is-pro"><?php esc_html_e( 'Roadmap', 'printah' ); ?></span>
						</div>
					</div>
					<div class="inside">
						<p class="description printah-section-desc">
							<?php esc_html_e( 'AI-assisted workflows designed to run straight from the command palette.', 'printah' ); ?>
						</p>

						<ul class="printah-pro-list">
							<li><?php esc_html_e( 'Custom Elementor widgets and page drafts', 'printah' ); ?></li>
							<li><?php esc_html_e( 'Guided WooCommerce product creation and sales analysis', 'printah' ); ?></li>
							<li><?php esc_html_e( 'Fast AI post drafting directly in WordPress', 'printah' ); ?></li>
						</ul>
					</div>
				</div>
			</aside>
		</div>
	</form>
</div>
