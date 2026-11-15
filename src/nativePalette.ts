import type { PrintahConfig } from './config';

/** Keep WordPress's registered shortcut aligned after its palette mounts. */
export function syncNativePalette( settings: PrintahConfig['settings'] ): () => void {
	let unsubscribe: ( () => void ) | undefined;
	let timer: number | undefined;
	let syncing = false;
	const apply = () => {
		if ( syncing || ! window.wp?.data ) return;
		try {
			const data = window.wp.data;
			const current = data.select( 'core/keyboard-shortcuts' ).getShortcutKeyCombination?.( 'core/commands' );
			if ( ! current ) return;
			const target = {
				modifier: settings.native_shortcut.includes( 'shift' ) ? 'primaryShift' : 'primary',
				character: settings.native_shortcut.slice( -1 ),
			};
			if ( ! settings.native_palette_enabled || current.modifier !== target.modifier || current.character !== target.character ) {
				syncing = true;
				const actions = data.dispatch( 'core/keyboard-shortcuts' );
				actions.unregisterShortcut( 'core/commands' );
				if ( settings.native_palette_enabled ) {
					actions.registerShortcut( {
						name: 'core/commands',
						category: 'global',
						description: 'Open WordPress Command Palette',
						keyCombination: target,
					} );
				}
				syncing = false;
			}
		} catch {
			syncing = false;
		}
	};
	const connect = () => {
		if ( ! window.wp?.data ) return;
		if ( ! unsubscribe ) unsubscribe = window.wp.data.subscribe( apply );
		apply();
		window.clearInterval( timer );
	};
	timer = window.setInterval( connect, 200 );
	connect();
	return () => {
		window.clearInterval( timer );
		unsubscribe?.();
	};
}
