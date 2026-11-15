=== Printah ===
Contributors: ichlas
Tags: command palette, admin navigation, productivity, elementor, woocommerce
Requires at least: 6.5
Tested up to: 7.1
Requires PHP: 7.4
Stable tag: 1.0.0
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

A fast command palette and floating toolbar to search content, jump across WordPress screens, and work faster in Elementor and WooCommerce.

== Description ==

**Printah** brings a clean, Raycast-style command bar and floating quick-action pill straight into your WordPress dashboard and editors—so you can move around your site in seconds without hunting through menus.

Press **Cmd + K** (Mac) or **Ctrl + K** (Windows/Linux) from anywhere in WP Admin, the Block Editor, Site Editor, or Elementor to jump to settings, find any post, page, or product, and launch key actions right from your keyboard.

= Why Use Printah? =

* **Instant Keyboard Navigation**: Open the palette anytime with `Cmd/Ctrl + K`, pick from your recent commands, or type 3+ characters to search screens and site content immediately.
* **Search Your Real Content**: Quickly locate Posts, Pages, WooCommerce Products, Elementor Templates, and custom post types—then open them directly or choose secondary actions like *View on Site* or *Edit with Elementor*.
* **Clean Floating Pill**: Keep essential actions—**View Site / Store**, **Comments** (with pending count badge), **Create New** (Post, Page, Product), **Profile / Log Out**, and quick search—within easy reach at the bottom center of your screen, with the option to hide the crowded top WordPress admin bar.
* **Works With Elementor**: Automatically detects Elementor and adds shortcuts for Saved Templates, Tools, Settings, and Theme Builder (when Elementor Pro is active). Inside the Elementor editor, press your shortcut to preview your page or return to WordPress without extra clicks.
* **Works With WooCommerce**: Automatically detects WooCommerce and gives store owners fast access to Orders, Products, New Product, Coupons, Customers, Analytics, and Store Settings.
* **Role-Aware & Respects Permissions**: Every user only sees pages and content they actually have permission to access.
* **Flexible Shortcut & Workspace Controls**: Choose separate keyboard shortcuts if you also want to keep the built-in WordPress Command Palette active, toggle the floating pill or top admin bar, and enable or disable Elementor/WooCommerce modules anytime.
* **Translation Ready**: Includes full English and Indonesian (`id_ID`) translations out of the box.

== Installation ==

1. Upload the `printah` folder to `/wp-content/plugins/` or install the plugin ZIP through **Plugins > Add New** in your WordPress dashboard.
2. Activate **Printah** from the **Plugins** menu.
3. Open **Printah** from your WordPress admin sidebar (or press `Cmd + K` / `Ctrl + K` and search for **Printah Settings**) to customize your shortcuts, floating pill, and integrations.

== Frequently Asked Questions ==

= How do I open the Printah Command Palette? =
Press `Cmd + K` on macOS or `Ctrl + K` on Windows and Linux anywhere inside WP Admin, the Block Editor, the Site Editor, or the Elementor editor. You can also click the search icon on the floating pill at the bottom center of the screen.

= Can I change the keyboard shortcut? =
Yes. Go to **Printah** in your WordPress sidebar and choose from `Cmd/Ctrl + K`, `Cmd/Ctrl + J`, `Cmd/Ctrl + Shift + K`, or `Cmd/Ctrl + Shift + J`.

= What happened to the built-in WordPress Command Palette? =
Printah disables the default WordPress Command Palette shortcut by default so `Cmd/Ctrl + K` opens Printah without conflicts. If you want to use both palettes side by side, turn on **WordPress Command Palette** in **Printah** settings and give each palette a different shortcut.

= Will hiding the WordPress toolbar lock me out of View Site or Log Out? =
No. All essential toolbar links—View Site/Store, Comments, Create New, Edit Profile, and Log Out—are built right into the Printah floating pill. Printah also prevents hiding the top WordPress toolbar if you turn off the floating pill.

= Do I need Elementor or WooCommerce to use Printah? =
No. Printah works out of the box on any WordPress site. When Elementor or WooCommerce is active, Printah automatically unlocks dedicated shortcuts for them—and you can turn either integration off in settings if you prefer.

= Where is the source code for the compiled assets? =
All unminified TypeScript, React, and CSS source files are included inside the `src/` directory alongside `package.json`, and can be built using standard `@wordpress/scripts` (`npm run build`).

== Screenshots ==

1. Printah Command Palette searching WordPress pages, settings, and quick actions.
2. Printah floating quick-action pill at the bottom center of WP Admin.
3. Dark Liquid-Glass Printah Settings dashboard for shortcuts, toolbar controls, and integrations.
4. Contextual commands while editing inside the Block Editor or Elementor.

== Changelog ==

= 1.0.0 =
* Initial public release.
* Added Raycast-style Command Palette (`Cmd/Ctrl + K`) with recent commands, live content search, and secondary item actions.
* Added floating quick-action pill with View Site/Store, Comments badge, Create New, and Profile/Log Out menus.
* Added contextual commands for Block Editor, Site Editor, and Elementor editor.
* Added automatic Elementor and WooCommerce command integrations with module toggles.
* Added dark Printah Settings dashboard, shortcut conflict validation, and REST settings endpoint.
* Added English and Indonesian (`id_ID`) translations.

== Upgrade Notice ==

= 1.0.0 =
Initial release of Printah for WordPress.

== Credits ==

Printah uses the following open-source libraries (full licenses are included in `license.txt`):

* **Anime.js** (`animejs` v4.5.0) — JavaScript animation engine by Julian Garnier, licensed under the MIT License (https://animejs.com).
* **Lucide React** (`lucide-react` v1.52.0) — Icon library by Lucide Icons and Contributors, licensed under the ISC License, with portions derived from Feather Icons licensed under the MIT License (https://lucide.dev).
