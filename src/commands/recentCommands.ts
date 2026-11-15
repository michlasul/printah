import type { Category, Command, CommandAction } from './types';

export const MAX_RECENT_COMMANDS = 6;
const RECENT_STORAGE_KEY = 'printah:recent-commands:v1';

const VALID_CATEGORIES = new Set< Category >( [
	'utama',
	'konten',
	'situs',
	'pengaturan',
	'elementor',
	'toko',
] );

function sanitizeAction( value: unknown ): CommandAction | null {
	if ( ! value || typeof value !== 'object' ) {
		return null;
	}
	const candidate = value as Record< string, unknown >;
	if (
		( candidate.id !== 'view' && candidate.id !== 'elementor' ) ||
		typeof candidate.label !== 'string' ||
		typeof candidate.url !== 'string'
	) {
		return null;
	}
	return {
		id: candidate.id,
		label: candidate.label,
		url: candidate.url,
	};
}

function sanitizeCommand( value: unknown ): Command | null {
	if ( ! value || typeof value !== 'object' ) {
		return null;
	}
	const candidate = value as Record< string, unknown >;
	if (
		typeof candidate.id !== 'string' ||
		typeof candidate.label !== 'string' ||
		typeof candidate.description !== 'string' ||
		typeof candidate.url !== 'string'
	) {
		return null;
	}
	const isString = ( item: unknown ): item is string =>
		typeof item === 'string';
	const keywords = Array.isArray( candidate.keywords )
		? candidate.keywords.filter( isString )
		: [];
	const actions = Array.isArray( candidate.actions )
		? candidate.actions
				.map( sanitizeAction )
				.filter( ( item ): item is CommandAction => item !== null )
		: undefined;

	return {
		id: candidate.id,
		label: candidate.label,
		description: candidate.description,
		keywords,
		url: candidate.url,
		category:
			typeof candidate.category === 'string' &&
			VALID_CATEGORIES.has( candidate.category as Category )
				? ( candidate.category as Category )
				: undefined,
		postType:
			typeof candidate.postType === 'string'
				? candidate.postType
				: undefined,
		actions: actions?.length ? actions : undefined,
	};
}

function writeStorage( commands: Command[] ) {
	try {
		window.localStorage.setItem(
			RECENT_STORAGE_KEY,
			JSON.stringify( commands )
		);
	} catch {
		// Ignore storage quota / privacy mode failures.
	}
}

/**
 * Loads recent commands from localStorage and refreshes static entries from live config.
 *
 * @param staticCommands Available static commands for the active WP screen.
 * @return Hydrated list of recent commands ordered from most recent.
 */
export function loadRecentCommands( staticCommands: Command[] ): Command[] {
	try {
		const raw = window.localStorage.getItem( RECENT_STORAGE_KEY );
		if ( ! raw ) {
			return [];
		}
		const parsed: unknown = JSON.parse( raw );
		if ( ! Array.isArray( parsed ) ) {
			return [];
		}
		const staticById = new Map(
			staticCommands.map( ( command ) => [ command.id, command ] )
		);
		const seen = new Set< string >();
		const hydrated: Command[] = [];

		for ( const entry of parsed ) {
			const sanitized = sanitizeCommand( entry );
			if ( ! sanitized || seen.has( sanitized.id ) ) {
				continue;
			}
			const liveStatic = staticById.get( sanitized.id );
			if ( liveStatic ) {
				seen.add( liveStatic.id );
				hydrated.push( liveStatic );
			} else if ( sanitized.postType ) {
				seen.add( sanitized.id );
				hydrated.push( sanitized );
			}
			if ( hydrated.length >= MAX_RECENT_COMMANDS ) {
				break;
			}
		}

		return hydrated;
	} catch {
		return [];
	}
}

/**
 * Prepends an executed command to the MRU recent commands list and persists it.
 *
 * @param current Current recent commands list.
 * @param command Executed command to record.
 * @return Updated recent commands list capped at MAX_RECENT_COMMANDS.
 */
export function recordRecentCommand(
	current: Command[],
	command: Command
): Command[] {
	const next = [
		command,
		...current.filter( ( item ) => item.id !== command.id ),
	].slice( 0, MAX_RECENT_COMMANDS );
	writeStorage( next );
	return next;
}
