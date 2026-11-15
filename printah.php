<?php
/**
 * The plugin bootstrap file
 *
 * This file is read by WordPress to generate the plugin information in the plugin
 * admin area. This file also includes all of the dependencies used by the plugin,
 * registers the activation and deactivation functions, and defines a function
 * that starts the plugin.
 *
 * @since             1.0.0
 * @package           Printah
 *
 * @wordpress-plugin
 * Plugin Name:       Printah
 * Plugin URI:        https://github.com/michlasul/printah
 * Description:       A fast command palette and floating toolbar for WordPress. Navigate WP Admin, search posts, pages, and custom post types, and jump into Elementor or WooCommerce from your keyboard.
 * Version:           1.0.0
 * Requires at least: 6.5
 * Requires PHP:      7.4
 * Author:            Ichlas
 * Author URI:        https://portome-eta.vercel.app/
 * License:           GPL-2.0+
 * License URI:       http://www.gnu.org/licenses/gpl-2.0.txt
 * Text Domain:       printah
 * Domain Path:       /languages
 */

use Printah\Printah_Core;
use Printah\Printah_Activator;
use Printah\Printah_Deactivator;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

define( 'PRINTAH_VERSION', '1.0.0' );

/**
 * The code that runs during plugin activation.
 */
function printah_activate() {
	require_once __DIR__ .
		'/includes/class-printah-activator.php';

	Printah_Activator::activate();
}

/** The code that runs during plugin deactivation. */
function printah_deactivate() {
	require_once __DIR__ .
		'/includes/class-printah-deactivator.php';

	Printah_Deactivator::deactivate();
}

register_activation_hook( __FILE__, 'printah_activate' );
register_deactivation_hook( __FILE__, 'printah_deactivate' );

require_once __DIR__ . '/includes/class-printah-core.php';

/**
 * Begins execution of the plugin.
 *
 * Since everything within the plugin is registered via hooks,
 * then kicking off the plugin from this point in the file does
 * not affect the page life cycle.
 *
 * @since    1.0.0
 */
function printah_run() {
	$plugin = new Printah_Core();
	$plugin->run();
}
add_action( 'plugins_loaded', 'printah_run' );
