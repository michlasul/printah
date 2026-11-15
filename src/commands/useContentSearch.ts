import { useEffect, useState } from '@wordpress/element';
import type { Command } from './types';

type SearchState = {
	query: string;
	commands: Command[];
	isLoading: boolean;
	hasError: boolean;
};

const emptyState: SearchState = {
	query: '',
	commands: [],
	isLoading: false,
	hasError: false,
};

export function useContentSearch(
	query: string,
	enabled: boolean,
	searchUrl?: string,
	restNonce?: string
) {
	const [ state, setState ] = useState< SearchState >( emptyState );
	const search = query.trim();
	const shouldSearch =
		enabled &&
		Boolean( searchUrl && restNonce ) &&
		Array.from( search ).length >= 3;

	useEffect( () => {
		if ( ! shouldSearch || ! searchUrl || ! restNonce ) {
			setState( emptyState );
			return;
		}

		const controller = new AbortController();
		setState( {
			query: search,
			commands: [],
			isLoading: true,
			hasError: false,
		} );

		const timer = window.setTimeout( async () => {
			try {
				const url = new URL( searchUrl, window.location.href );
				url.searchParams.set( 'q', search );

				const response = await fetch( url.href, {
					credentials: 'same-origin',
					headers: { 'X-WP-Nonce': restNonce },
					signal: controller.signal,
				} );

				if ( ! response.ok ) {
					throw new Error( 'Content search failed.' );
				}

				const data: unknown = await response.json();
				if ( ! Array.isArray( data ) ) {
					throw new Error( 'Invalid content search response.' );
				}

				setState( {
					query: search,
					commands: data as Command[],
					isLoading: false,
					hasError: false,
				} );
			} catch {
				if ( ! controller.signal.aborted ) {
					setState( {
						query: search,
						commands: [],
						isLoading: false,
						hasError: true,
					} );
				}
			}
		}, 225 );

		return () => {
			window.clearTimeout( timer );
			controller.abort();
		};
	}, [ search, shouldSearch, searchUrl, restNonce ] );

	if ( ! shouldSearch ) {
		return emptyState;
	}

	return state.query === search
		? state
		: { ...emptyState, query: search, isLoading: true };
}
