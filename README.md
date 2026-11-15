# Printah

A fast, keyboard-first command palette and floating quick-action bar for WordPress. Navigate WP Admin, search posts, pages, and custom post types, and jump into Elementor or WooCommerce without leaving your keyboard.

---

## Key Features

- **Keyboard-First Command Palette**
  - Open anywhere in WP Admin with `Cmd + K` (macOS) or `Ctrl + K` (Windows/Linux).
  - Navigate results with arrow keys, inspect secondary actions via `ArrowRight` / **Actions**, and press `Esc` to step back or close.
- **Complete WP Admin Navigation**
  - Jump straight to **Dashboard**, **Updates**, **Posts**, **Categories**, **Tags**, **Pages**, **Media Library**, **Comments**, **Themes**, **Site Editor** (or **Customize** + **Menus** on classic themes), **Plugins**, **Users**, **Profile**, **Tools**, and all **Settings** subpages.
  - Every command is filtered server-side via `current_user_can()` so users only see screens they have permission to access.
- **Automatic Ecosystem Detection**
  - **Elementor**: Automatically adds **Elementor Saved Templates**, **Elementor Settings**, **Elementor Tools**, and **Elementor Theme Builder** (when Elementor Pro is active).
  - **WooCommerce**: Automatically adds **WooCommerce Home**, **Orders** (with HPOS detection), **Products**, **Add New Product**, **Coupons**, **Customers**, **Analytics**, and **Settings**.
- **Live Content Search & Quick Actions**
  - Debounced REST search (`GET /wp-json/printah/v1/search`) across editable **Posts**, **Pages**, **Products**, **Elementor Templates**, and public **Custom Post Types**.
  - Press `Enter` to open the default editor, or drill into item actions such as **Edit with Elementor** and **View on Site**.
- **Floating Quick-Action Pill**
  - Replaces the crowded top WP Admin toolbar with a compact floating pill for **View Site / Store**, **Comments** (with moderation badge), **Create New** (`Post`, `Page`, `Product`), **Profile** (`Edit Profile`, `Log Out`), and the **Command Palette** trigger.
  - Keeps the WP Admin sidebar intact and safely falls back to the native toolbar if disabled or if assets fail to load.
- **WordPress Command Palette Coordination**
  - Disables the built-in WordPress Command Palette by default so `Cmd/Ctrl + K` opens Printah without conflicts.
  - Optionally re-enable the native WordPress palette in settings with its own dedicated shortcut.

---

## Settings

After activating Printah, open **Printah** in the WP Admin sidebar to configure:

- **Open Printah**: Choose between `⌘/Ctrl + K` (default), `⌘/Ctrl + J`, `⌘/Ctrl + Shift + K`, or `⌘/Ctrl + Shift + J`.
- **WordPress Command Palette**: Enable or disable the native WordPress palette and assign it a separate shortcut.
- **Admin Interface**: Toggle hiding the top WP Admin toolbar once the floating pill is ready.

---

## Developer Hooks

All plugin hooks are coordinated through `Printah\Printah_Loader`.

### `printah_commands`

Add or customize static commands in the palette. You can pass an optional `capability` key (`string` or `string[]`), and Printah will verify `current_user_can()` before exposing the command to the frontend:

```php
add_filter(
	'printah_commands',
	function ( array $commands ): array {
		$commands[] = array(
			'id'          => 'my-custom-screen',
			'label'       => __( 'Custom Screen', 'my-plugin' ),
			'description' => __( 'Open my plugin screen', 'my-plugin' ),
			'keywords'    => array( 'custom', 'settings' ),
			'url'         => admin_url( 'admin.php?page=my-custom-screen' ),
			'category'    => 'situs', // 'utama' | 'konten' | 'situs' | 'pengaturan' | 'elementor' | 'toko'
			'capability'  => 'manage_options',
		);

		return $commands;
	}
);
```

### `printah_search_post_types`

Customize which post type slugs are queried by live content search:

```php
add_filter(
	'printah_search_post_types',
	function ( array $post_types ): array {
		$post_types[] = 'portfolio';

		return $post_types;
	}
);
```

---

## Local Development

### Prerequisites

- **Node.js & npm** (for building the React/TypeScript UI via `@wordpress/scripts`)
- **Composer** (for PHPCS / WordPress & WooCommerce stubs)
- **Docker** (optional, for the local `wp-env` environment)

### Setup & Build

```bash
npm install
composer install
npm run build
```

For interactive development with watch mode:

```bash
npm start
```

### Local WordPress Environment (`wp-env`)

[`.wp-env.json`](.wp-env.json) configures a local WordPress instance on port `8880` with **Elementor**, **WooCommerce**, and **Hello Elementor**:

```bash
npm run env:start
```

Other environment helpers:

```bash
npm run env:stop
npm run env:logs
npm run env:clean
```

### Linting & Checks

```bash
# TypeScript typecheck
npm run typecheck

# JavaScript / TypeScript linting
npx wp-scripts lint-js src/commands src/components admin/js/printah-admin.js

# PHP WordPress Coding Standards (WPCS)
./vendor/bin/phpcs admin/ includes/ printah.php
```

---

## Project Structure

```text
printah/
├── admin/
│   ├── css/
│   ├── img/
│   ├── js/
│   ├── partials/
│   │   └── printah-admin-display.php
│   ├── class-printah-admin.php
│   ├── class-printah-commands.php
│   └── class-printah-settings.php
├── includes/
│   ├── class-printah-activator.php
│   ├── class-printah-core.php
│   ├── class-printah-deactivator.php
│   ├── class-printah-loader.php
│   └── class-printah-search-controller.php
├── src/
│   ├── commands/
│   ├── components/
│   ├── styles/
│   ├── App.tsx
│   ├── config.ts
│   ├── index.tsx
│   ├── nativePalette.ts
│   └── toolbar.css
├── .wp-env.json
├── composer.json
├── package.json
├── phpcs.xml
├── printah.php
└── tsconfig.json
```

---

## License

GPL-2.0+ — see [printah.php](printah.php) for license details.
