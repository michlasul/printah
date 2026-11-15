<?php
/**
 * The admin-specific functionality of the plugin.
 *
 * @since      1.0.0
 *
 * @package    Printah
 * @subpackage Printah/admin
 */

namespace Printah\Admin;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * The admin-specific functionality of the plugin.
 *
 * Defines the plugin name, version, and two examples hooks for how to
 * enqueue the admin-specific stylesheet and JavaScript.
 *
 * @package    Printah
 * @subpackage Printah/admin
 * @author     Davies Holmes
 */
final class Printah_Admin {

	/**
	 * The ID of this plugin.
	 *
	 * @since    1.0.0
	 * @access   private
	 * @var      string    $plugin_name    The ID of this plugin.
	 */
	private $plugin_name;

	/**
	 * The version of this plugin.
	 *
	 * @since    1.0.0
	 * @access   private
	 * @var      string    $version    The current version of this plugin.
	 */
	private $version;

	/**
	 * Commands provider instance.
	 *
	 * @since    1.0.0
	 * @access   private
	 * @var      Printah_Commands    $commands    Commands registry instance.
	 */
	private $commands;

	/**
	 * Initialize the class and set its properties.
	 *
	 * @since    1.0.0
	 * @param      string                $plugin_name The name of this plugin.
	 * @param      string                $version     The version of this plugin.
	 * @param      Printah_Commands|null $commands    Optional commands registry instance.
	 */
	public function __construct( $plugin_name, $version, ?Printah_Commands $commands = null ) {
		$this->plugin_name = $plugin_name;
		$this->version     = $version;
		$this->commands    = $commands ? $commands : new Printah_Commands();
	}

	/**
	 * Register the stylesheets for the admin area.
	 *
	 * @since    1.0.0
	 * @param string $hook_suffix Current admin page hook.
	 */
	public function enqueue_styles( $hook_suffix ) {
		if ( 'toplevel_page_printah' !== $hook_suffix ) {
			return;
		}

		$style_file = __DIR__ . '/css/printah-admin.css';

		wp_enqueue_style( $this->plugin_name, plugins_url( 'admin/css/printah-admin.css', dirname( __DIR__ ) . '/printah.php' ), array(), filemtime( $style_file ), 'all' );
		$script_file = __DIR__ . '/js/printah-admin.js';
		wp_enqueue_script( $this->plugin_name . '-admin', plugins_url( 'admin/js/printah-admin.js', dirname( __DIR__ ) . '/printah.php' ), array(), filemtime( $script_file ), true );
	}

	/**
	 * Register the JavaScript for the admin area.
	 *
	 * @since    1.0.0
	 */
	public function enqueue_scripts() {
		$plugin_file = dirname( __DIR__ ) . '/printah.php';
		$asset_file  = dirname( __DIR__ ) . '/build/index.asset.php';

		if ( ! is_readable( $asset_file ) ) {
			return;
		}

		$asset       = require $asset_file;
		$palette_css = dirname( __DIR__ ) . '/build/index.css';

		if ( is_readable( $palette_css ) ) {
			wp_enqueue_style(
				$this->plugin_name . '-palette',
				plugins_url( 'build/index.css', $plugin_file ),
				array(),
				$asset['version']
			);
		}

		wp_enqueue_script(
			$this->plugin_name,
			plugins_url( 'build/index.js', $plugin_file ),
			$asset['dependencies'],
			$asset['version'],
			array( 'in_footer' => true )
		);

		$commands = $this->commands->get_commands();
		$settings = Printah_Settings::get();

		wp_add_inline_script(
			$this->plugin_name,
			'window.printahConfig = ' . wp_json_encode(
				array(
					'commands'  => $commands,
					'searchUrl' => esc_url_raw( rest_url( 'printah/v1/search' ) ),
					'restNonce' => wp_create_nonce( 'wp_rest' ),
					'settings'  => $settings,
					'toolbar'   => $this->get_toolbar_items(),
				)
			) . ';',
			'before'
		);
	}

	/**
	 * Supply only actions the current user can perform.
	 *
	 * @return array<string, mixed> Toolbar links.
	 */
	private function get_toolbar_items(): array {
		$items = array(
			'site'    => array(
				'label' => __( 'View Site', 'printah' ),
				'url'   => home_url( '/' ),
			),
			'new'     => array(),
			'profile' => array(
				array(
					'label' => __( 'Edit Profile', 'printah' ),
					'url'   => admin_url( 'profile.php' ),
				),
				array(
					'label' => __( 'Log Out', 'printah' ),
					'url'   => wp_logout_url(),
				),
			),
		);

		if ( function_exists( 'wc_get_page_id' ) ) {
			$shop_id = wc_get_page_id( 'shop' );
			if ( $shop_id > 0 ) {
				$items['store'] = array(
					'label' => __( 'View Store', 'printah' ),
					'url'   => get_permalink( $shop_id ),
				);
			}
		}
		if ( current_user_can( 'moderate_comments' ) ) {
			$items['comments'] = array(
				'label' => __( 'Comments', 'printah' ),
				'url'   => admin_url( 'edit-comments.php' ),
				'count' => (int) wp_count_comments()->moderated,
			);
		}
		foreach ( array(
			'post'    => __( 'New Post', 'printah' ),
			'page'    => __( 'New Page', 'printah' ),
			'product' => __( 'New Product', 'printah' ),
		) as $post_type => $label ) {
			$type = get_post_type_object( $post_type );
			if ( $type && current_user_can( $type->cap->create_posts ) ) {
				$items['new'][] = array(
					'label' => $label,
					'url'   => admin_url( 'post-new.php' . ( 'post' === $post_type ? '' : '?post_type=' . $post_type ) ),
				);
			}
		}
		return $items;
	}

	/**
	 * Add a mount point for the command palette on admin pages.
	 */
	public function render_palette_root() {
		echo '<div id="printah-root"></div>';
	}

	/** Remove the native toolbar trigger when its palette is disabled. */
	public function remove_native_toolbar_trigger() {
		if ( ! Printah_Settings::get()['native_palette_enabled'] ) {
			global $wp_admin_bar;
			$wp_admin_bar->remove_node( 'command-palette' );
		}
	}

	/**
	 * Add printah admin menu.
	 */
	public function printah_admin_menu() {
		add_menu_page(
			'Printah',
			'Printah',
			'manage_options',
			'printah',
			array( $this, 'printah_admin_page' ),
			plugins_url( 'admin/img/printah-command-icon.svg', dirname( __DIR__ ) . '/printah.php' ),
			6
		);
	}

	/**
	 * Display the printah admin page.
	 */
	public function printah_admin_page() {
		require_once __DIR__ . '/partials/printah-admin-display.php';
	}
}
