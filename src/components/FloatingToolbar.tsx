import {
	useEffect,
	useLayoutEffect,
	useMemo,
	useRef,
	useState,
} from '@wordpress/element';
import { __, _n, sprintf } from '@wordpress/i18n';
import { animate, createSpring } from 'animejs';
import { House, MessageSquare, Plus, Search, UserRound } from 'lucide-react';
import type { Shortcut, ToolbarData, ToolbarLink } from '../config';
import { shortcutLabel } from '../config';
import { bindElementorPreviewEvents } from '../elementorPreview';
import MorphShell from './MorphShell';
import PopupMenu from './PopupMenu';
import styles from './FloatingToolbar.module.css';

type Menu = 'home' | 'new' | 'profile';
type FocusTarget = Menu | 'palette';

function FloatingToolbar( {
	toolbar,
	shortcut,
	paletteOpen,
	isElementorEditor,
	showFloatingPill = true,
	onOpenPalette,
	onClosePalette,
	onPaletteCollapsed,
	triggerRef,
	paletteContent,
}: {
	toolbar?: ToolbarData;
	shortcut: Shortcut;
	paletteOpen: boolean;
	isElementorEditor?: boolean;
	showFloatingPill?: boolean;
	onOpenPalette: () => void;
	onClosePalette: () => void;
	onPaletteCollapsed?: () => void;
	triggerRef: React.RefObject< HTMLButtonElement | null >;
	paletteContent: React.ReactNode;
} ) {
	const [ menu, setMenu ] = useState< Menu | null >( null );
	const [ displayedMenu, setDisplayedMenu ] = useState< Menu >( 'home' );
	const [ displayedPanel, setDisplayedPanel ] = useState<
		'menu' | 'palette'
	>( 'menu' );
	const [ isCovered, setIsCovered ] = useState( false );
	const rootRef = useRef< HTMLDivElement >( null );
	const clusterRef = useRef< HTMLDivElement >( null );
	const pillRef = useRef< HTMLDivElement >( null );
	const iconAnimationsRef = useRef< ReturnType< typeof animate >[] >( [] );
	const wasActiveRef = useRef< Menu | 'palette' | null >( null );
	const restoreFocusRef = useRef< FocusTarget | null >( null );
	const glintRafRef = useRef< number | null >( null );
	const glintPointRef = useRef< { x: number; y: number } | null >( null );

	const activePanel = paletteOpen ? 'palette' : menu;
	let effectivePanel: 'menu' | 'palette' = displayedPanel;
	if ( paletteOpen ) {
		effectivePanel = 'palette';
	} else if ( menu ) {
		effectivePanel = 'menu';
	}

	useLayoutEffect( () => {
		if ( paletteOpen ) {
			setMenu( null );
			setDisplayedPanel( 'palette' );
			setIsCovered( true );
		}
	}, [ paletteOpen ] );

	useLayoutEffect( () => {
		const previousPanel = wasActiveRef.current;
		wasActiveRef.current = activePanel;
		const icons = Array.from(
			pillRef.current?.querySelectorAll< HTMLElement >( 'button, a' ) ??
				[]
		);
		const reducedMotion = window.matchMedia(
			'(prefers-reduced-motion: reduce)'
		).matches;

		const clearIconEffects = () => {
			icons.forEach( ( icon ) => {
				icon.style.removeProperty( 'filter' );
				icon.style.removeProperty( 'transform' );
				icon.style.removeProperty( 'will-change' );
			} );
		};

		if ( activePanel ) {
			restoreFocusRef.current = null;
			iconAnimationsRef.current.forEach( ( animation ) =>
				animation.cancel()
			);
			iconAnimationsRef.current = [];
			if ( reducedMotion ) {
				icons.forEach( ( icon ) => {
					icon.style.opacity = '0';
				} );
				clearIconEffects();
			} else {
				icons.forEach( ( icon ) => {
					icon.style.willChange = 'filter, opacity, transform';
				} );
				iconAnimationsRef.current = [
					animate( icons, {
						opacity: 0,
						filter: 'blur(6px)',
						scale: 0.82,
						delay: ( _icon?: unknown, index = 0 ) => index * 6,
						duration: 110,
						ease: 'out(3)',
						onComplete: clearIconEffects,
					} ),
				];
			}
		} else if ( previousPanel ) {
			iconAnimationsRef.current.forEach( ( animation ) =>
				animation.cancel()
			);
			iconAnimationsRef.current = [];
			if ( reducedMotion ) {
				icons.forEach( ( icon ) => {
					icon.style.opacity = '1';
				} );
				clearIconEffects();
			} else {
				icons.forEach( ( icon ) => {
					icon.style.willChange = 'filter, opacity, transform';
					icon.style.opacity = '0';
					icon.style.filter = 'blur(6px)';
					icon.style.transform = 'scale(0.84)';
				} );
				const revealDelay = ( _icon?: unknown, index = 0 ) =>
					110 + index * 10;
				iconAnimationsRef.current = [
					animate( icons, {
						opacity: 1,
						filter: 'blur(0px)',
						delay: revealDelay,
						duration: 185,
						ease: 'out(3)',
						onComplete: () => {
							icons.forEach( ( icon ) => {
								icon.style.removeProperty( 'filter' );
								icon.style.removeProperty( 'will-change' );
							} );
						},
					} ),
					animate( icons, {
						scale: 1,
						delay: revealDelay,
						ease: createSpring( {
							bounce: 0.24,
							duration: 300,
						} ),
						onComplete: () => {
							icons.forEach( ( icon ) => {
								icon.style.removeProperty( 'transform' );
								icon.style.removeProperty( 'will-change' );
							} );
						},
					} ),
				];
			}
		}

		return () => {
			iconAnimationsRef.current.forEach( ( animation ) =>
				animation.cancel()
			);
			iconAnimationsRef.current = [];
		};
	}, [ activePanel ] );

	useEffect( () => {
		const close = ( event: MouseEvent | KeyboardEvent ) => {
			if (
				event instanceof KeyboardEvent &&
				event.key === 'Escape' &&
				menu &&
				! paletteOpen
			) {
				restoreFocusRef.current = menu;
				setMenu( null );
			} else if (
				event instanceof MouseEvent &&
				! rootRef.current?.contains( event.target as Node )
			) {
				if ( paletteOpen ) {
					restoreFocusRef.current = null;
					onClosePalette();
				} else if ( menu ) {
					restoreFocusRef.current = null;
					setMenu( null );
				}
			}
		};
		document.addEventListener( 'keydown', close );
		document.addEventListener( 'pointerdown', close );
		const unbindPreview = bindElementorPreviewEvents(
			!! isElementorEditor,
			undefined,
			() => {
				if ( paletteOpen ) {
					restoreFocusRef.current = null;
					onClosePalette();
				} else if ( menu ) {
					restoreFocusRef.current = null;
					setMenu( null );
				}
			}
		);
		return () => {
			document.removeEventListener( 'keydown', close );
			document.removeEventListener( 'pointerdown', close );
			unbindPreview();
		};
	}, [ isElementorEditor, menu, paletteOpen, onClosePalette ] );

	const items = useMemo( () => {
		if ( ! toolbar ) {
			return [];
		}
		if ( displayedMenu === 'home' ) {
			return [ toolbar.site, toolbar.store ].filter(
				( link ): link is ToolbarLink => !! link
			);
		}
		return displayedMenu === 'new' ? toolbar.new : toolbar.profile;
	}, [ displayedMenu, toolbar ] );
	const menuTitles: Record< Menu, string > = {
		home: __( 'Visit', 'printah' ),
		new: __( 'Create New', 'printah' ),
		profile: __( 'Account', 'printah' ),
	};
	const title = menuTitles[ displayedMenu ];

	const toggleMenu = ( target: Menu ) => {
		setDisplayedMenu( target );
		setDisplayedPanel( 'menu' );
		if ( paletteOpen ) {
			onClosePalette();
		}
		if ( menu !== target ) {
			setIsCovered( true );
		}
		setMenu( ( current ) => ( current === target ? null : target ) );
	};

	const restorePill = () => {
		const focusTarget = restoreFocusRef.current;
		restoreFocusRef.current = null;
		setIsCovered( false );
		if ( ! paletteOpen ) {
			onPaletteCollapsed?.();
		}
		if ( focusTarget && focusTarget !== 'palette' ) {
			requestAnimationFrame( () =>
				rootRef.current
					?.querySelector< HTMLButtonElement >(
						`[data-menu="${ focusTarget }"]`
					)
					?.focus()
			);
		} else {
			triggerRef.current?.blur();
			const activeEl = rootRef.current?.ownerDocument.activeElement;
			if (
				activeEl instanceof HTMLElement &&
				rootRef.current?.contains( activeEl )
			) {
				activeEl.blur();
			}
		}
	};

	const closeMenu = () => {
		restoreFocusRef.current = displayedMenu;
		setMenu( null );
	};

	const openPalette = () => {
		triggerRef.current?.blur();
		setMenu( null );
		setDisplayedPanel( 'palette' );
		setIsCovered( true );
		onOpenPalette();
	};

	const onMenuKeyDown = (
		event: React.KeyboardEvent< HTMLButtonElement >,
		target: Menu
	) => {
		if ( event.key === 'ArrowDown' ) {
			event.preventDefault();
			setDisplayedMenu( target );
			setDisplayedPanel( 'menu' );
			setIsCovered( true );
			setMenu( target );
			requestAnimationFrame( () =>
				rootRef.current
					?.querySelector< HTMLAnchorElement >( '[role="menuitem"]' )
					?.focus()
			);
		}
	};

	const menuWidth = displayedMenu === 'home' ? 190 : 230;
	const panelWidth = effectivePanel === 'palette' ? 580 : menuWidth;
	const modeKey = effectivePanel === 'palette' ? 'palette' : displayedMenu;

	useEffect( () => {
		return () => {
			if ( glintRafRef.current !== null ) {
				cancelAnimationFrame( glintRafRef.current );
			}
		};
	}, [] );

	const flushGlint = () => {
		glintRafRef.current = null;
		const point = glintPointRef.current;
		const cluster = clusterRef.current;
		if ( ! point || ! cluster ) {
			return;
		}
		const activeSurface = activePanel
			? cluster.querySelector< HTMLElement >( '[data-printah-popup]' )
			: pillRef.current;
		const rect = ( activeSurface ?? cluster ).getBoundingClientRect();
		if ( ! rect.width || ! rect.height ) {
			return;
		}
		const x = Math.min(
			100,
			Math.max( 0, ( ( point.x - rect.left ) / rect.width ) * 100 )
		);
		const y = Math.min(
			100,
			Math.max( 0, ( ( point.y - rect.top ) / rect.height ) * 100 )
		);
		cluster.style.setProperty(
			'--printah-glint-x',
			`${ x.toFixed( 1 ) }%`
		);
		cluster.style.setProperty(
			'--printah-glint-y',
			`${ y.toFixed( 1 ) }%`
		);
	};

	const updateGlint = ( event: React.PointerEvent< HTMLDivElement > ) => {
		glintPointRef.current = { x: event.clientX, y: event.clientY };
		if ( glintRafRef.current === null ) {
			glintRafRef.current = requestAnimationFrame( flushGlint );
		}
	};

	const resetGlint = () => {
		if ( glintRafRef.current !== null ) {
			cancelAnimationFrame( glintRafRef.current );
			glintRafRef.current = null;
		}
		glintPointRef.current = null;
		const cluster = clusterRef.current;
		if ( ! cluster ) {
			return;
		}
		cluster.style.setProperty( '--printah-glint-x', '28%' );
		cluster.style.setProperty( '--printah-glint-y', '0%' );
	};

	const commentsCount = toolbar?.comments?.count ?? 0;
	let commentsAriaLabel: string | undefined;
	if ( toolbar?.comments ) {
		commentsAriaLabel =
			commentsCount > 0
				? sprintf(
						/* translators: 1: Comments label, 2: pending count. */
						_n(
							'%1$s (%2$d pending)',
							'%1$s (%2$d pending)',
							commentsCount,
							'printah'
						),
						toolbar.comments.label,
						commentsCount
					)
				: toolbar.comments.label;
	}

	return (
		<div
			className={ styles.root }
			ref={ rootRef }
			data-open={ !! activePanel }
			aria-label={ __( 'Printah quick actions', 'printah' ) }
		>
			<div
				ref={ clusterRef }
				className={ styles.cluster }
				onPointerMove={ updateGlint }
				onPointerLeave={ resetGlint }
			>
				<div
					ref={ pillRef }
					className={ `${ styles.pill }${
						isCovered ? ` ${ styles.pillCovered }` : ''
					}` }
					data-printah-pill
					data-active={ !! activePanel }
					data-hidden={ ! showFloatingPill }
					aria-hidden={ ! showFloatingPill }
					inert={ !! activePanel || ! showFloatingPill }
				>
					{ toolbar && (
						<>
							<button
								type="button"
								className={ styles.icon }
								data-menu="home"
								aria-label={ __(
									'View site or store',
									'printah'
								) }
								aria-haspopup="menu"
								aria-expanded={ menu === 'home' }
								onClick={ () => toggleMenu( 'home' ) }
								onKeyDown={ ( event ) =>
									onMenuKeyDown( event, 'home' )
								}
							>
								<House size={ 17 } aria-hidden="true" />
							</button>
							{ toolbar.comments && (
								<a
									href={ toolbar.comments.url }
									className={ styles.icon }
									aria-label={ commentsAriaLabel }
									title={ commentsAriaLabel }
								>
									<MessageSquare
										size={ 17 }
										aria-hidden="true"
									/>
									{ commentsCount > 0 ? (
										<span
											className={ styles.badge }
											aria-hidden="true"
										>
											{ commentsCount }
										</span>
									) : null }
								</a>
							) }
							{ toolbar.new.length > 0 && (
								<button
									type="button"
									className={ styles.icon }
									data-menu="new"
									aria-label={ __( 'Create new', 'printah' ) }
									aria-haspopup="menu"
									aria-expanded={ menu === 'new' }
									onClick={ () => toggleMenu( 'new' ) }
									onKeyDown={ ( event ) =>
										onMenuKeyDown( event, 'new' )
									}
								>
									<Plus size={ 18 } aria-hidden="true" />
								</button>
							) }
							<button
								type="button"
								className={ styles.icon }
								data-menu="profile"
								aria-label={ __( 'Profile', 'printah' ) }
								aria-haspopup="menu"
								aria-expanded={ menu === 'profile' }
								onClick={ () => toggleMenu( 'profile' ) }
								onKeyDown={ ( event ) =>
									onMenuKeyDown( event, 'profile' )
								}
							>
								<UserRound size={ 17 } aria-hidden="true" />
							</button>
						</>
					) }
					<button
						ref={ triggerRef }
						type="button"
						className={ styles.search }
						onClick={ openPalette }
						aria-label={ sprintf(
							/* translators: %s: keyboard shortcut label. */
							__( 'Open Printah (%s)', 'printah' ),
							shortcutLabel( shortcut )
						) }
						aria-haspopup="dialog"
						aria-expanded={ paletteOpen }
					>
						<Search size={ 16 } aria-hidden="true" />
					</button>
				</div>
				<MorphShell
					open={ !! activePanel }
					modeKey={ modeKey }
					width={ panelWidth }
					radius={ effectivePanel === 'palette' ? 24 : 18 }
					anchorRef={ pillRef }
					onCollapsed={ restorePill }
					dynamicHeight={ effectivePanel === 'palette' }
				>
					{ effectivePanel === 'palette'
						? paletteContent
						: !! ( toolbar && ( activePanel || isCovered ) ) && (
								<PopupMenu
									title={ title }
									items={ items }
									onClose={ closeMenu }
								/>
							) }
				</MorphShell>
			</div>
		</div>
	);
}

export default FloatingToolbar;
