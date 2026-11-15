import type { Command } from './commands/types';

export type Shortcut = 'mod+k' | 'mod+j' | 'mod+shift+k' | 'mod+shift+j';
export type ToolbarLink = { label: string; url: string; count?: number };
export type ToolbarData = {
	site: ToolbarLink;
	store?: ToolbarLink;
	comments?: ToolbarLink;
	new: ToolbarLink[];
	profile: ToolbarLink[];
};
export type PrintahContext = {
	screen?: 'admin' | 'block-editor' | 'site-editor' | 'elementor-editor';
	postType?: string;
	postId?: number;
};
export type PrintahConfig = {
	commands: Command[];
	searchUrl: string;
	restNonce: string;
	settings: {
		printah_shortcut: Shortcut;
		native_palette_enabled: boolean;
		native_shortcut: Shortcut;
		hide_toolbar: boolean;
		show_floating_pill?: boolean;
		content_search_enabled?: boolean;
		module_elementor_enabled?: boolean;
		module_woocommerce_enabled?: boolean;
	};
	toolbar: ToolbarData;
	context?: PrintahContext;
};

declare global {
	interface Window {
		printahConfig?: PrintahConfig;
		wp?: {
			data?: {
				select: ( store: string ) => {
					getShortcutKeyCombination?: ( name: string ) =>
						| {
								modifier: string;
								character: string;
						  }
						| undefined;
				};
				dispatch: ( store: string ) => {
					unregisterShortcut: ( name: string ) => void;
					registerShortcut: ( shortcut: object ) => void;
				};
				subscribe: ( listener: () => void ) => () => void;
			};
		};
	}
}

export function shortcutLabel( shortcut: Shortcut ): string {
	const mac = /Mac|iPhone|iPad/.test( navigator.userAgent );
	return `${ mac ? '⌘' : 'Ctrl' }${ shortcut.includes( 'shift' ) ? ' ⇧' : '' } ${ shortcut.slice( -1 ).toUpperCase() }`;
}

export function matchesShortcut(
	event: KeyboardEvent,
	shortcut: Shortcut
): boolean {
	const mac = /Mac|iPhone|iPad/.test( navigator.userAgent );
	return (
		( mac
			? event.metaKey && ! event.ctrlKey
			: event.ctrlKey && ! event.metaKey ) &&
		! event.altKey &&
		event.shiftKey === shortcut.includes( 'shift' ) &&
		event.code === `Key${ shortcut.slice( -1 ).toUpperCase() }`
	);
}
