<?php
/**
 * Fired during plugin deactivation.
 *
 * This class defines all code necessary to run during the plugin's deactivation.
 *
 * @since      1.0.0
 * @package    Printah
 * @subpackage Printah/includes
 * @author     Davies Holmes
 */

namespace Printah;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Fired during plugin deactivation.
 *
 * This class defines all code necessary to run during the plugin's deactivation.
 *
 * @since      1.0.0
 * @package    Printah
 * @subpackage Printah/includes
 * @author     Davies Holmes
 */
class Printah_Deactivator {
	/**
	 * Method that runs during plugin deactivation.
	 */
	public static function deactivate() {
	}
}
