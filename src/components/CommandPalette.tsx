import {
	useCallback,
	useEffect,
	useLayoutEffect,
	useMemo,
	useRef,
	useState,
} from '@wordpress/element';
import {
	ArrowLeft,
	ArrowRight,
	BarChart3,
	BookOpen,
	FilePlus2,
	FileText,
	Folder,
	House,
	Image,
	Layers,
	LayoutDashboard,
	Link2,
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
import { useContentSearch } from '../commands/useContentSearch';
import type { Category, Command } from '../commands/types';
import type { PrintahConfig } from '../config';
import { matchesShortcut } from '../config';
import CommandActions, {
	buildCommandActionItems,
	type DrilldownActionItem,
} from './CommandActions';
import FloatingToolbar from './FloatingToolbar';
import styles from './CommandPalette.module.css';

const categoryLabels: Record< Category, string > = {
	utama: 'Main Navigation',
	konten: 'Content',
	situs: 'Site Management',
	pengaturan: 'Settings',
	elementor: 'Elementor',
	toko: 'WooCommerce',
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

function CommandPalette( {
	commands,
	searchUrl,
	restNonce,
	settings,
	toolbar,
}: {
	commands: Command[];
	searchUrl?: string;
	restNonce?: string;
	settings: PrintahConfig[ 'settings' ];
	toolbar?: PrintahConfig[ 'toolbar' ];
} ) {
	const [ isOpen, setIsOpen ] = useState( false );
	const [ query, setQuery ] = useState( '' );
	const [ selectedIndex, setSelectedIndex ] = useState( 0 );
	const [ activeCommand, setActiveCommand ] = useState< Command | null >(
		null
	);
	const [ actionQuery, setActionQuery ] = useState( '' );
	const [ actionIndex, setActionIndex ] = useState( 0 );
	const inputRef = useRef< HTMLInputElement >( null );
	const triggerRef = useRef< HTMLButtonElement >( null );
	const paletteRef = useRef< HTMLElement >( null );
	const resultsRef = useRef< HTMLDivElement >( null );

	const staticResults = useMemo( () => {
		const search = query.trim().toLocaleLowerCase();
		return commands.filter( ( command ) => {
			return (
				! search ||
				[ command.label, command.description, ...command.keywords ]
					.join( ' ' )
					.toLocaleLowerCase()
					.includes( search )
			);
		} );
	}, [ commands, query ] );

	const {
		commands: contentResults,
		isLoading,
		hasError,
	} = useContentSearch( query, isOpen, searchUrl, restNonce );

	const results = useMemo(
		() => [ ...staticResults, ...contentResults ],
		[ staticResults, contentResults ]
	);

	const reversedGroups = useMemo( () => {
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
		return Array.from(
			grouped,
			( [ category, items ] ) =>
				[ category, [ ...items ].reverse() ] as const
		).reverse();
	}, [ results ] );

	const drilldownActions = useMemo( () => {
		if ( ! activeCommand ) {
			return [];
		}
		const allActions = buildCommandActionItems( activeCommand );
		const search = actionQuery.trim().toLocaleLowerCase();
		if ( ! search ) {
			return allActions;
		}
		return allActions.filter( ( action ) =>
			`${ action.label } ${ action.description }`
				.toLocaleLowerCase()
				.includes( search )
		);
	}, [ activeCommand, actionQuery ] );

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
	const selectedUrl = selectedCommand
		? new URL( selectedCommand.url, window.location.href )
		: null;
	const selectedPath = selectedUrl
		? selectedUrl.pathname.replace( /^.*\/wp-admin\/|\.php$/g, '' ) ||
			'dashboard'
		: 'Printah';

	const enterActions = useCallback( ( command: Command, index: number ) => {
		if ( ! command.actions?.length ) {
			return;
		}
		setSelectedIndex( index );
		setActiveCommand( command );
		setActionQuery( '' );
		setActionIndex( 0 );
		requestAnimationFrame( () =>
			inputRef.current?.focus( { preventScroll: true } )
		);
	}, [] );

	const exitActions = useCallback( () => {
		setActiveCommand( null );
		setActionQuery( '' );
		setActionIndex( 0 );
		requestAnimationFrame( () =>
			inputRef.current?.focus( { preventScroll: true } )
		);
	}, [] );

	const moveSelection = useCallback(
		( delta: 1 | -1 ) => {
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
		window.addEventListener( 'keydown', onKeyDown, true );
		return () => window.removeEventListener( 'keydown', onKeyDown, true );
	}, [
		isOpen,
		activeCommand,
		exitActions,
		moveSelection,
		settings.printah_shortcut,
	] );

	useEffect( () => {
		if ( ! isOpen ) {
			return;
		}
		setQuery( '' );
		setSelectedIndex( 0 );
		setActiveCommand( null );
		setActionQuery( '' );
		setActionIndex( 0 );
		inputRef.current?.focus( { preventScroll: true } );
		const rafId = requestAnimationFrame( () => {
			inputRef.current?.focus( { preventScroll: true } );
		} );
		return () => cancelAnimationFrame( rafId );
	}, [ isOpen ] );

	const updateFadeState = useCallback( () => {
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
		if ( activeSelection === 0 ) {
			scroller.scrollTop = scroller.scrollHeight;
		} else {
			scroller
				.querySelector( '[data-selected="true"]' )
				?.scrollIntoView( { block: 'nearest' } );
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

	function openUrl( url?: string ) {
		if ( url ) {
			window.location.assign( url );
		}
	}

	function onInputKeyDown( event: React.KeyboardEvent< HTMLInputElement > ) {
		if ( event.key === 'Enter' ) {
			event.preventDefault();
			if ( activeCommand ) {
				openUrl( selectedAction?.url );
			} else {
				openUrl( selectedCommand?.url );
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

	const paletteContent = (
		<section
			ref={ paletteRef }
			className={ styles[ 'printah-palette' ] }
			role="dialog"
			aria-label="Printah Command Palette"
		>
			<div
				className={ styles[ 'printah-ambient' ] }
				data-open={ isOpen }
				aria-hidden="true"
			/>
			<header className={ styles[ 'printah-topbar' ] } data-panel-fade>
				<div className={ styles[ 'printah-topbar__left' ] }>
					{ activeCommand ? (
						<>
							<button
								type="button"
								className={ styles[ 'printah-back' ] }
								onClick={ exitActions }
							>
								<ArrowLeft size={ 13 } aria-hidden="true" />
								Back
							</button>
							<span
								className={ styles[ 'printah-topbar__path' ] }
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
								onClick={ () => openUrl( selectedAction?.url ) }
								disabled={ ! selectedAction }
							>
								Select{ ' ' }
								<kbd className={ styles[ 'printah-kbd' ] }>
									↵
								</kbd>
							</button>
							<span
								className={ styles[ 'printah-topbar__sep' ] }
								aria-hidden="true"
							/>
							<button type="button" onClick={ exitActions }>
								Back{ ' ' }
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
									openUrl( selectedCommand?.url )
								}
								disabled={ ! selectedCommand }
							>
								{ selectedCommand?.postType
									? 'Edit Content'
									: 'Open Page' }{ ' ' }
								<kbd className={ styles[ 'printah-kbd' ] }>
									↵
								</kbd>
							</button>
							<span
								className={ styles[ 'printah-topbar__sep' ] }
								aria-hidden="true"
							/>
							<button
								type="button"
								onClick={ () => setIsOpen( false ) }
							>
								Close{ ' ' }
								<kbd className={ styles[ 'printah-kbd' ] }>
									Esc
								</kbd>
							</button>
						</>
					) }
				</div>
			</header>

			<div
				ref={ resultsRef }
				className={ styles[ 'printah-results' ] }
				onScroll={ updateFadeState }
				data-panel-fade
			>
				{ activeCommand ? (
					<CommandActions
						commandLabel={ activeCommand.label }
						actions={ drilldownActions }
						selectedIndex={ actionIndex }
						onHover={ setActionIndex }
						onSelect={ ( action: DrilldownActionItem ) =>
							openUrl( action.url )
						}
					/>
				) : (
					<>
						{ reversedGroups.map( ( [ category, items ] ) => (
							<section
								key={ category }
								aria-label={
									categoryLabels[ category ] ?? category
								}
							>
								<h2
									className={
										styles[ 'printah-group-title' ]
									}
								>
									{ categoryLabels[ category ] ?? category }
								</h2>
								<ul>
									{ items.map( ( { command, index } ) => {
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
											<li key={ command.id }>
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
													data-selected={ isSelected }
												>
													<button
														className={
															styles[
																'printah-result'
															]
														}
														type="button"
														onMouseEnter={ () =>
															setSelectedIndex(
																index
															)
														}
														onClick={ () =>
															openUrl(
																command.url
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
																size={ 16 }
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
																category
															] ?? category }
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
															aria-label={ `More actions for ${ command.label }` }
															onMouseEnter={ () =>
																setSelectedIndex(
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
															Actions
															<ArrowRight
																size={ 13 }
																aria-hidden="true"
															/>
														</button>
													) }
												</div>
											</li>
										);
									} ) }
								</ul>
							</section>
						) ) }
						{ ! results.length && ! isLoading && ! hasError && (
							<div className={ styles[ 'printah-empty' ] }>
								<strong>No matching commands</strong>
								<span>Try another keyword.</span>
							</div>
						) }
						{ isLoading && (
							<p
								className={ styles[ 'printah-search-status' ] }
								role="status"
							>
								Searching content…
							</p>
						) }
						{ hasError && (
							<p
								className={ styles[ 'printah-search-status' ] }
								role="status"
							>
								Content search failed. Try again.
							</p>
						) }
					</>
				) }
			</div>

			<div className={ styles[ 'printah-searchbar' ] } data-panel-fade>
				<Search size={ 17 } strokeWidth={ 2 } aria-hidden="true" />
				<input
					ref={ inputRef }
					type="search"
					value={ activeCommand ? actionQuery : query }
					onChange={ ( event ) => {
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
							? `Search actions for ${ activeCommand.label }...`
							: 'Search WordPress pages or commands...'
					}
					aria-label={
						activeCommand
							? `Search actions for ${ activeCommand.label }`
							: 'Search Printah commands'
					}
					autoComplete="off"
				/>
			</div>
		</section>
	);

	return (
		<div className={ styles[ 'printah-app' ] }>
			<FloatingToolbar
				toolbar={ toolbar }
				shortcut={ settings.printah_shortcut }
				paletteOpen={ isOpen }
				onOpenPalette={ () => setIsOpen( true ) }
				onClosePalette={ () => setIsOpen( false ) }
				triggerRef={ triggerRef }
				paletteContent={ paletteContent }
			/>
		</div>
	);
}

export default CommandPalette;
