import {
	useCallback,
	useEffect,
	useLayoutEffect,
	useMemo,
	useRef,
	useState,
} from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { animate, createSpring } from 'animejs';
import {
	ArrowLeft,
	ArrowRight,
	BarChart3,
	BookOpen,
	ExternalLink,
	FilePlus2,
	FileText,
	Folder,
	House,
	Image,
	Layers,
	LayoutDashboard,
	Link2,
	List,
	LogOut,
	Menu,
	MessageSquare,
	Package,
	Paintbrush,
	Palette,
	PenTool,
	Plug,
	RefreshCw,
	Search,
	Settings,
	Shield,
	ShoppingBag,
	Sliders,
	Sparkles,
	Store,
	Tag,
	TicketPercent,
	User,
	Users,
	Wrench,
	type LucideIcon,
} from 'lucide-react';
import {
	loadRecentCommands,
	recordRecentCommand,
} from '../commands/recentCommands';
import { useContentSearch } from '../commands/useContentSearch';
import type { Category, Command } from '../commands/types';
import type { PrintahConfig } from '../config';
import { matchesShortcut } from '../config';
import { bindElementorPreviewEvents } from '../elementorPreview';
import CommandActions, {
	buildCommandActionItems,
	getPrimaryCommandAction,
	type DrilldownActionItem,
} from './CommandActions';
import FloatingToolbar from './FloatingToolbar';
import styles from './CommandPalette.module.css';

const categoryLabels: Record< Category, string > = {
	utama: __( 'Main Navigation', 'printah' ),
	konten: __( 'Content', 'printah' ),
	situs: __( 'Site Management', 'printah' ),
	pengaturan: __( 'Settings', 'printah' ),
	elementor: __( 'Elementor', 'printah' ),
	toko: __( 'WooCommerce', 'printah' ),
};
const icons: Record< string, LucideIcon > = {
	dashboard: LayoutDashboard,
	updates: RefreshCw,
	profile: User,
	posts: FileText,
	'new-post': FilePlus2,
	categories: Folder,
	tags: Tag,
	pages: House,
	'new-page': FilePlus2,
	media: Image,
	comments: MessageSquare,
	themes: Palette,
	'site-editor': Paintbrush,
	customize: Paintbrush,
	menus: Menu,
	plugins: Plug,
	'install-plugins': Plug,
	users: Users,
	tools: Wrench,
	'settings-general': Settings,
	'settings-writing': PenTool,
	'settings-reading': BookOpen,
	'settings-discussion': MessageSquare,
	'settings-media': Sliders,
	'settings-permalinks': Link2,
	'settings-privacy': Shield,
	'printah-settings': Sparkles,
	'elementor-view-live': ExternalLink,
	'elementor-exit-to-editor': FileText,
	'elementor-all-posts': List,
	'elementor-exit-dashboard': LogOut,
	'elementor-templates': Layers,
	'elementor-settings': Settings,
	'elementor-tools': Wrench,
	'elementor-theme-builder': Sparkles,
	'woocommerce-home': Store,
	'woocommerce-orders': ShoppingBag,
	'woocommerce-products': Package,
	'woocommerce-new-product': Package,
	'woocommerce-coupons': TicketPercent,
	'woocommerce-customers': Users,
	'woocommerce-analytics': BarChart3,
	'woocommerce-settings': Settings,
};
const contentIcons: Record< string, LucideIcon > = {
	post: FileText,
	page: House,
	product: Package,
	elementor_library: Layers,
};

const supportsScrollTimeline =
	typeof CSS !== 'undefined' &&
	typeof CSS.supports === 'function' &&
	CSS.supports( 'animation-timeline', 'scroll()' );

function CommandPalette( {
	commands,
	searchUrl,
	restNonce,
	settings,
	toolbar,
	context,
}: {
	commands: Command[];
	searchUrl?: string;
	restNonce?: string;
	settings: PrintahConfig[ 'settings' ];
	toolbar?: PrintahConfig[ 'toolbar' ];
	context?: PrintahConfig[ 'context' ];
} ) {
	const isElementorEditor = context?.screen === 'elementor-editor';
	const [ isOpen, setIsOpen ] = useState( false );
	const [ isPaletteMounted, setIsPaletteMounted ] = useState( false );
	const shouldRenderPalette = isOpen || isPaletteMounted;
	const [ query, setQuery ] = useState( '' );
	const [ selectedIndex, setSelectedIndex ] = useState( 0 );
	const [ activeCommand, setActiveCommand ] = useState< Command | null >(
		null
	);
	const [ recentCommands, setRecentCommands ] = useState< Command[] >( () =>
		loadRecentCommands( commands )
	);
	const [ actionQuery, setActionQuery ] = useState( '' );
	const [ actionIndex, setActionIndex ] = useState( 0 );
	const inputRef = useRef< HTMLInputElement >( null );
	const triggerRef = useRef< HTMLButtonElement >( null );
	const previousFocusRef = useRef< HTMLElement | null >( null );
	const paletteRef = useRef< HTMLElement >( null );
	const topbarRef = useRef< HTMLElement >( null );
	const resultsRef = useRef< HTMLDivElement >( null );
	const selectionSourceRef = useRef< 'keyboard' | 'pointer' >( 'keyboard' );
	const prevIsOpenRef = useRef( false );

	const indexedCommands = useMemo(
		() =>
			commands.map( ( command ) => ( {
				command,
				searchText: [
					command.label,
					command.description,
					...command.keywords,
				]
					.join( ' ' )
					.toLocaleLowerCase(),
			} ) ),
		[ commands ]
	);

	const trimmedQuery = query.trim();
	const queryLength = Array.from( trimmedQuery ).length;
	const showRecent = queryLength === 0 && recentCommands.length > 0;
	const hasResultsView =
		Boolean( activeCommand ) || showRecent || queryLength >= 3;

	const staticResults = useMemo( () => {
		if ( ! shouldRenderPalette ) {
			return [];
		}
		if ( showRecent ) {
			return recentCommands;
		}
		if ( queryLength < 3 ) {
			return [];
		}
		const search = trimmedQuery.toLocaleLowerCase();
		return indexedCommands
			.filter( ( entry ) => entry.searchText.includes( search ) )
			.map( ( entry ) => entry.command );
	}, [
		indexedCommands,
		queryLength,
		recentCommands,
		shouldRenderPalette,
		showRecent,
		trimmedQuery,
	] );

	const {
		commands: contentResults,
		isLoading,
		hasError,
	} = useContentSearch(
		query,
		isOpen && settings.content_search_enabled !== false,
		searchUrl,
		restNonce
	);

	const results = useMemo(
		() => [ ...staticResults, ...contentResults ],
		[ staticResults, contentResults ]
	);

	const reversedGroups = useMemo( () => {
		if ( showRecent ) {
			return [
				{
					key: 'recent',
					title: __( 'Recent Commands', 'printah' ),
					items: results
						.map( ( command, index ) => ( { command, index } ) )
						.reverse(),
				},
			];
		}

		const grouped = new Map<
			Category,
			{ command: Command; index: number }[]
		>();
		results.forEach( ( command, index ) => {
			const category = command.category ?? 'utama';
			const items = grouped.get( category ) ?? [];
			items.push( { command, index } );
			grouped.set( category, items );
		} );
		return Array.from( grouped, ( [ category, items ] ) => ( {
			key: category,
			title: categoryLabels[ category ] ?? category,
			items: [ ...items ].reverse(),
		} ) ).reverse();
	}, [ results, showRecent ] );

	const drilldownActions = useMemo( () => {
		if ( ! activeCommand ) {
			return [];
		}
		const allActions = buildCommandActionItems(
			activeCommand,
			isElementorEditor
		);
		const search = actionQuery.trim().toLocaleLowerCase();
		if ( ! search ) {
			return allActions;
		}
		return allActions.filter( ( action ) =>
			`${ action.label } ${ action.description }`
				.toLocaleLowerCase()
				.includes( search )
		);
	}, [ activeCommand, actionQuery, isElementorEditor ] );

	useEffect( () => {
		if ( selectedIndex >= results.length ) {
			setSelectedIndex( Math.max( 0, results.length - 1 ) );
		}
	}, [ results.length, selectedIndex ] );

	useEffect( () => {
		if ( actionIndex >= drilldownActions.length ) {
			setActionIndex( Math.max( 0, drilldownActions.length - 1 ) );
		}
	}, [ drilldownActions.length, actionIndex ] );

	const selectedCommand = results[ selectedIndex ];
	const selectedAction = drilldownActions[ actionIndex ];
	const primaryAction = getPrimaryCommandAction(
		selectedCommand,
		isElementorEditor
	);
	const selectedUrl = selectedCommand
		? new URL(
				primaryAction.url ?? selectedCommand.url,
				window.location.href
			)
		: null;
	const selectedPath = selectedUrl
		? selectedUrl.pathname.replace( /^.*\/wp-admin\/|\.php$/g, '' ) ||
			'dashboard'
		: 'Printah';

	const activeOptionId = useMemo( () => {
		if ( ! hasResultsView ) {
			return undefined;
		}
		if ( activeCommand ) {
			return selectedAction
				? `printah-action-option-${ selectedAction.id }`
				: undefined;
		}
		return selectedCommand
			? `printah-command-option-${ selectedCommand.id }`
			: undefined;
	}, [ activeCommand, hasResultsView, selectedAction, selectedCommand ] );

	const enterActions = useCallback( ( command: Command, index: number ) => {
		if ( ! command.actions?.length ) {
			return;
		}
		selectionSourceRef.current = 'keyboard';
		setSelectedIndex( index );
		setActiveCommand( command );
		setActionQuery( '' );
		setActionIndex( 0 );
		requestAnimationFrame( () =>
			inputRef.current?.focus( { preventScroll: true } )
		);
	}, [] );

	const exitActions = useCallback( () => {
		selectionSourceRef.current = 'keyboard';
		setActiveCommand( null );
		setActionQuery( '' );
		setActionIndex( 0 );
		requestAnimationFrame( () =>
			inputRef.current?.focus( { preventScroll: true } )
		);
	}, [] );

	const moveSelection = useCallback(
		( delta: 1 | -1 ) => {
			selectionSourceRef.current = 'keyboard';
			if ( activeCommand ) {
				if ( ! drilldownActions.length ) {
					return;
				}
				setActionIndex(
					( index ) =>
						( index + delta + drilldownActions.length ) %
						drilldownActions.length
				);
				return;
			}
			if ( ! results.length ) {
				return;
			}
			setSelectedIndex(
				( index ) => ( index + delta + results.length ) % results.length
			);
		},
		[ activeCommand, drilldownActions.length, results.length ]
	);

	const keyDownHandlerRef = useRef< ( event: KeyboardEvent ) => void >(
		() => {}
	);

	useEffect( () => {
		const onKeyDown = ( event: KeyboardEvent ) => {
			if (
				! event.repeat &&
				! event.isComposing &&
				matchesShortcut( event, settings.printah_shortcut )
			) {
				event.preventDefault();
				event.stopImmediatePropagation();
				setIsOpen( ( open ) => ! open );
			} else if ( isOpen && event.key === 'ArrowUp' ) {
				event.preventDefault();
				moveSelection( 1 );
			} else if ( isOpen && event.key === 'ArrowDown' ) {
				event.preventDefault();
				moveSelection( -1 );
			} else if ( isOpen && event.key === 'Escape' ) {
				event.preventDefault();
				if ( activeCommand ) {
					exitActions();
				} else {
					setIsOpen( false );
				}
			} else if ( isOpen && event.key === 'Tab' && paletteRef.current ) {
				const focusable =
					paletteRef.current.querySelectorAll< HTMLElement >(
						'input, button:not(:disabled)'
					);
				const first = focusable[ 0 ];
				const last = focusable[ focusable.length - 1 ];
				const active = paletteRef.current.ownerDocument.activeElement;
				if ( event.shiftKey && active === first ) {
					event.preventDefault();
					last?.focus();
				} else if ( ! event.shiftKey && active === last ) {
					event.preventDefault();
					first?.focus();
				}
			}
		};
		keyDownHandlerRef.current = onKeyDown;
		window.addEventListener( 'keydown', onKeyDown, true );
		return () => window.removeEventListener( 'keydown', onKeyDown, true );
	}, [
		isOpen,
		activeCommand,
		exitActions,
		moveSelection,
		settings.printah_shortcut,
	] );

	useEffect(
		() =>
			bindElementorPreviewEvents( isElementorEditor, ( event ) =>
				keyDownHandlerRef.current( event )
			),
		[ isElementorEditor ]
	);

	useEffect( () => {
		const ownerDocument =
			triggerRef.current?.ownerDocument ??
			paletteRef.current?.ownerDocument;

		if ( isOpen ) {
			const active = ownerDocument?.activeElement;
			if (
				active instanceof HTMLElement &&
				! paletteRef.current?.contains( active )
			) {
				previousFocusRef.current = active;
			}
			inputRef.current?.focus( { preventScroll: true } );
			const rafId = requestAnimationFrame( () => {
				inputRef.current?.focus( { preventScroll: true } );
			} );
			return () => cancelAnimationFrame( rafId );
		}

		const target = previousFocusRef.current;
		previousFocusRef.current = null;
		const active = ownerDocument?.activeElement ?? null;
		const shouldRestore =
			active === null ||
			active === ownerDocument?.body ||
			Boolean( paletteRef.current?.contains( active ) );

		if ( shouldRestore && target && target.isConnected ) {
			requestAnimationFrame( () =>
				target.focus( { preventScroll: true } )
			);
		}
		return undefined;
	}, [ isOpen ] );

	useLayoutEffect( () => {
		if ( isOpen ) {
			setIsPaletteMounted( true );
			setQuery( '' );
			setSelectedIndex( 0 );
			setActiveCommand( null );
			setActionQuery( '' );
			setActionIndex( 0 );
			selectionSourceRef.current = 'keyboard';
		}
	}, [ isOpen ] );

	useLayoutEffect( () => {
		const wasOpen = prevIsOpenRef.current;
		prevIsOpenRef.current = isOpen;
		if ( ! isOpen || ! hasResultsView || ! wasOpen ) {
			return;
		}
		const targets = [ resultsRef.current, topbarRef.current ].filter(
			( node ): node is HTMLDivElement | HTMLElement => node !== null
		);
		if ( ! targets.length ) {
			return;
		}
		if ( window.matchMedia( '(prefers-reduced-motion: reduce)' ).matches ) {
			targets.forEach( ( target ) => {
				target.style.opacity = '1';
				target.style.removeProperty( 'filter' );
				target.style.removeProperty( 'transform' );
				target.style.removeProperty( 'will-change' );
			} );
			return;
		}
		const revealSpring = createSpring( {
			bounce: 0.16,
			duration: 280,
		} );
		const animations = targets.flatMap( ( target, index ) => {
			const delay = 40 + index * 30;
			target.style.willChange = 'filter, opacity, transform';
			target.style.opacity = '0';
			target.style.filter = 'blur(7px)';
			target.style.transform = 'translateY(4px) scale(0.97)';
			return [
				animate( target, {
					opacity: 1,
					filter: 'blur(0px)',
					delay,
					duration: 200,
					ease: 'out(3)',
					onComplete: () => {
						target.style.removeProperty( 'filter' );
						target.style.removeProperty( 'will-change' );
					},
				} ),
				animate( target, {
					y: 0,
					scale: 1,
					delay,
					ease: revealSpring,
					onComplete: () => {
						target.style.removeProperty( 'transform' );
						target.style.removeProperty( 'will-change' );
					},
				} ),
			];
		} );
		return () => {
			animations.forEach( ( animation ) => animation.cancel() );
		};
	}, [ isOpen, hasResultsView ] );

	const updateFadeState = useCallback( () => {
		if ( supportsScrollTimeline ) {
			return;
		}
		const scroller = resultsRef.current;
		if ( ! scroller ) {
			return;
		}
		const hasTop = scroller.scrollTop > 2;
		const hasBottom =
			scroller.scrollTop + scroller.clientHeight <
			scroller.scrollHeight - 2;
		scroller.dataset.fadeTop = hasTop ? 'true' : 'false';
		scroller.dataset.fadeBottom = hasBottom ? 'true' : 'false';
	}, [] );

	const activeSelection = activeCommand ? actionIndex : selectedIndex;
	const activeViewKey = activeCommand ? activeCommand.id : 'main';

	useLayoutEffect( () => {
		const scroller = resultsRef.current;
		if ( ! isOpen || ! scroller ) {
			return;
		}
		const isPointerHover = selectionSourceRef.current === 'pointer';
		selectionSourceRef.current = 'keyboard';
		if ( ! isPointerHover ) {
			if ( activeSelection === 0 ) {
				scroller.scrollTop = scroller.scrollHeight;
			} else {
				scroller
					.querySelector( '[data-selected="true"]' )
					?.scrollIntoView( { block: 'nearest' } );
			}
		}
		updateFadeState();
	}, [
		isOpen,
		activeSelection,
		activeViewKey,
		results.length,
		drilldownActions.length,
		isLoading,
		hasError,
		updateFadeState,
	] );

	function executeCommand( command?: Command, url?: string ) {
		if ( ! url ) {
			return;
		}
		if ( command ) {
			setRecentCommands( ( current ) =>
				recordRecentCommand( current, command )
			);
		}
		window.location.assign( url );
	}

	function onInputKeyDown( event: React.KeyboardEvent< HTMLInputElement > ) {
		if ( event.key === 'Enter' ) {
			event.preventDefault();
			if ( activeCommand ) {
				executeCommand( activeCommand, selectedAction?.url );
			} else {
				executeCommand( selectedCommand, primaryAction.url );
			}
		} else if (
			! activeCommand &&
			event.key === 'ArrowRight' &&
			selectedCommand?.actions?.length &&
			event.currentTarget.selectionStart ===
				event.currentTarget.value.length &&
			event.currentTarget.selectionEnd ===
				event.currentTarget.value.length
		) {
			event.preventDefault();
			enterActions( selectedCommand, selectedIndex );
		} else if (
			activeCommand &&
			event.key === 'ArrowLeft' &&
			event.currentTarget.selectionStart === 0 &&
			event.currentTarget.selectionEnd === 0
		) {
			event.preventDefault();
			exitActions();
		}
	}

	const hoverSelectedIndex = ( index: number ) => {
		selectionSourceRef.current = 'pointer';
		setSelectedIndex( index );
	};

	const hoverActionIndex = ( index: number ) => {
		selectionSourceRef.current = 'pointer';
		setActionIndex( index );
	};

	const paletteContent = shouldRenderPalette ? (
		<section
			ref={ paletteRef }
			className={ styles[ 'printah-palette' ] }
			data-compact={ ! hasResultsView }
			role="dialog"
			aria-modal="true"
			aria-label={ __( 'Printah Command Palette', 'printah' ) }
		>
			<div
				className={ styles[ 'printah-ambient' ] }
				data-open={ isOpen }
				aria-hidden="true"
			/>
			{ hasResultsView && (
				<header
					ref={ topbarRef }
					className={ styles[ 'printah-topbar' ] }
					data-panel-fade
				>
					<div className={ styles[ 'printah-topbar__left' ] }>
						{ activeCommand ? (
							<>
								<button
									type="button"
									className={ styles[ 'printah-back' ] }
									onClick={ exitActions }
								>
									<ArrowLeft size={ 13 } aria-hidden="true" />
									{ __( 'Back', 'printah' ) }
								</button>
								<span
									className={
										styles[ 'printah-topbar__path' ]
									}
									title={ activeCommand.label }
								>
									{ activeCommand.label }
								</span>
							</>
						) : (
							<span
								className={ styles[ 'printah-topbar__path' ] }
								title={ selectedPath }
							>
								{ selectedPath }
							</span>
						) }
					</div>
					<div className={ styles[ 'printah-topbar__actions' ] }>
						{ activeCommand ? (
							<>
								<button
									type="button"
									onClick={ () =>
										executeCommand(
											activeCommand,
											selectedAction?.url
										)
									}
									disabled={ ! selectedAction }
								>
									{ __( 'Select', 'printah' ) }{ ' ' }
									<kbd className={ styles[ 'printah-kbd' ] }>
										↵
									</kbd>
								</button>
								<span
									className={
										styles[ 'printah-topbar__sep' ]
									}
									aria-hidden="true"
								/>
								<button type="button" onClick={ exitActions }>
									{ __( 'Back', 'printah' ) }{ ' ' }
									<kbd className={ styles[ 'printah-kbd' ] }>
										Esc
									</kbd>
								</button>
							</>
						) : (
							<>
								<button
									type="button"
									onClick={ () =>
										executeCommand(
											selectedCommand,
											primaryAction.url
										)
									}
									disabled={ ! selectedCommand }
								>
									{ primaryAction.label }{ ' ' }
									<kbd className={ styles[ 'printah-kbd' ] }>
										↵
									</kbd>
								</button>
								<span
									className={
										styles[ 'printah-topbar__sep' ]
									}
									aria-hidden="true"
								/>
								<button
									type="button"
									onClick={ () => setIsOpen( false ) }
								>
									{ __( 'Close', 'printah' ) }{ ' ' }
									<kbd className={ styles[ 'printah-kbd' ] }>
										Esc
									</kbd>
								</button>
							</>
						) }
					</div>
				</header>
			) }

			{ hasResultsView && (
				<div
					ref={ resultsRef }
					className={ styles[ 'printah-results' ] }
					onScroll={
						supportsScrollTimeline ? undefined : updateFadeState
					}
					data-panel-fade
				>
					{ activeCommand ? (
						<CommandActions
							commandLabel={ activeCommand.label }
							actions={ drilldownActions }
							selectedIndex={ actionIndex }
							onHover={ hoverActionIndex }
							onSelect={ ( action: DrilldownActionItem ) =>
								executeCommand( activeCommand, action.url )
							}
						/>
					) : (
						<div
							id="printah-results-listbox"
							role="listbox"
							aria-label={
								showRecent
									? __( 'Recent Commands', 'printah' )
									: __( 'Search Results', 'printah' )
							}
						>
							{ reversedGroups.map( ( group ) => (
								<section
									key={ group.key }
									role="group"
									aria-labelledby={ `printah-group-${ group.key }` }
								>
									<h2
										id={ `printah-group-${ group.key }` }
										className={
											styles[ 'printah-group-title' ]
										}
									>
										{ group.title }
									</h2>
									<ul role="presentation">
										{ group.items.map(
											( { command, index } ) => {
												const itemCategory =
													command.category ?? 'utama';
												const Icon =
													icons[ command.id ] ??
													contentIcons[
														command.postType ?? ''
													] ??
													( command.postType
														? FileText
														: Search );
												const isSelected =
													index === selectedIndex;
												return (
													<li
														key={ command.id }
														role="presentation"
													>
														<div
															className={ `${
																styles[
																	'printah-result-row'
																]
															}${
																isSelected
																	? ` ${ styles[ 'is-selected' ] }`
																	: ''
															}` }
															data-selected={
																isSelected
															}
														>
															<button
																id={ `printah-command-option-${ command.id }` }
																role="option"
																aria-selected={
																	isSelected
																}
																className={
																	styles[
																		'printah-result'
																	]
																}
																type="button"
																onMouseEnter={ () =>
																	hoverSelectedIndex(
																		index
																	)
																}
																onClick={ () =>
																	executeCommand(
																		command,
																		getPrimaryCommandAction(
																			command,
																			isElementorEditor
																		).url
																	)
																}
															>
																<span
																	className={
																		styles[
																			'printah-result__icon'
																		]
																	}
																	aria-hidden="true"
																>
																	<Icon
																		size={
																			16
																		}
																		strokeWidth={
																			1.9
																		}
																	/>
																</span>
																<span
																	className={
																		styles[
																			'printah-result__content'
																		]
																	}
																>
																	<strong>
																		{
																			command.label
																		}
																	</strong>
																	<small>
																		{
																			command.description
																		}
																	</small>
																</span>
																<span
																	className={
																		styles[
																			'printah-result__type'
																		]
																	}
																>
																	{ categoryLabels[
																		itemCategory
																	] ??
																		itemCategory }
																</span>
															</button>
															{ !! command.actions
																?.length && (
																<button
																	type="button"
																	className={
																		styles[
																			'printah-result-action-btn'
																		]
																	}
																	aria-label={ sprintf(
																		/* translators: %s: command label. */
																		__(
																			'More actions for %s',
																			'printah'
																		),
																		command.label
																	) }
																	onMouseEnter={ () =>
																		hoverSelectedIndex(
																			index
																		)
																	}
																	onClick={ () =>
																		enterActions(
																			command,
																			index
																		)
																	}
																>
																	{ __(
																		'Actions',
																		'printah'
																	) }
																	<ArrowRight
																		size={
																			13
																		}
																		aria-hidden="true"
																	/>
																</button>
															) }
														</div>
													</li>
												);
											}
										) }
									</ul>
								</section>
							) ) }
							{ ! results.length && ! isLoading && ! hasError && (
								<div className={ styles[ 'printah-empty' ] }>
									<strong>
										{ __(
											'No matching commands',
											'printah'
										) }
									</strong>
									<span>
										{ __(
											'Try another keyword.',
											'printah'
										) }
									</span>
								</div>
							) }
							{ isLoading && (
								<p
									className={
										styles[ 'printah-search-status' ]
									}
									role="status"
								>
									{ __( 'Searching content…', 'printah' ) }
								</p>
							) }
							{ hasError && (
								<p
									className={
										styles[ 'printah-search-status' ]
									}
									role="status"
								>
									{ __(
										'Content search failed. Try again.',
										'printah'
									) }
								</p>
							) }
						</div>
					) }
				</div>
			) }

			<div className={ styles[ 'printah-searchbar' ] } data-panel-fade>
				<Search size={ 17 } strokeWidth={ 2 } aria-hidden="true" />
				<input
					ref={ inputRef }
					type="search"
					role="combobox"
					aria-autocomplete="list"
					aria-expanded={ hasResultsView }
					aria-controls={
						hasResultsView ? 'printah-results-listbox' : undefined
					}
					aria-activedescendant={ activeOptionId }
					value={ activeCommand ? actionQuery : query }
					onChange={ ( event ) => {
						selectionSourceRef.current = 'keyboard';
						if ( activeCommand ) {
							setActionQuery( event.target.value );
							setActionIndex( 0 );
						} else {
							setQuery( event.target.value );
							setSelectedIndex( 0 );
						}
					} }
					onKeyDown={ onInputKeyDown }
					placeholder={
						activeCommand
							? sprintf(
									/* translators: %s: command label. */
									__( 'Search actions for %s…', 'printah' ),
									activeCommand.label
								)
							: __(
									'Search WordPress pages or commands…',
									'printah'
								)
					}
					aria-label={
						activeCommand
							? sprintf(
									/* translators: %s: command label. */
									__( 'Search actions for %s', 'printah' ),
									activeCommand.label
								)
							: __( 'Search Printah commands', 'printah' )
					}
					autoComplete="off"
				/>
				{ ! hasResultsView && queryLength > 0 && (
					<span className={ styles[ 'printah-searchbar__hint' ] }>
						{ __( 'Min 3 chars', 'printah' ) }
					</span>
				) }
			</div>
		</section>
	) : null;

	return (
		<div className={ styles[ 'printah-app' ] }>
			<FloatingToolbar
				toolbar={ toolbar }
				shortcut={ settings.printah_shortcut }
				paletteOpen={ isOpen }
				isElementorEditor={ isElementorEditor }
				showFloatingPill={ settings.show_floating_pill !== false }
				onOpenPalette={ () => setIsOpen( true ) }
				onClosePalette={ () => setIsOpen( false ) }
				onPaletteCollapsed={ () => setIsPaletteMounted( false ) }
				triggerRef={ triggerRef }
				paletteContent={ paletteContent }
			/>
		</div>
	);
}

export default CommandPalette;
