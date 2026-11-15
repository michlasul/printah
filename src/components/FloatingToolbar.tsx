import {
	useEffect,
	useLayoutEffect,
	useMemo,
	useRef,
	useState,
} from '@wordpress/element';
import { animate } from 'animejs';
import { House, MessageSquare, Plus, Search, UserRound } from 'lucide-react';
import type { Shortcut, ToolbarData, ToolbarLink } from '../config';
import { shortcutLabel } from '../config';
import MorphShell from './MorphShell';
import PopupMenu from './PopupMenu';
import styles from './FloatingToolbar.module.css';

type Menu = 'home' | 'new' | 'profile';
type FocusTarget = Menu | 'palette';

function FloatingToolbar( {
	toolbar,
	shortcut,
	paletteOpen,
	onOpenPalette,
	onClosePalette,
	triggerRef,
	paletteContent,
}: {
	toolbar?: ToolbarData;
	shortcut: Shortcut;
	paletteOpen: boolean;
	onOpenPalette: () => void;
	onClosePalette: () => void;
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
	const pillRef = useRef< HTMLDivElement >( null );
	const iconAnimationRef = useRef< ReturnType< typeof animate > | null >(
		null
	);
	const restoreFocusRef = useRef< FocusTarget | null >( null );

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
		if ( ! activePanel ) {
			return;
		}
		restoreFocusRef.current = null;
		const icons = Array.from(
			pillRef.current?.querySelectorAll< HTMLElement >( 'button, a' ) ??
				[]
		);
		iconAnimationRef.current?.cancel();
		iconAnimationRef.current = null;
		if ( window.matchMedia( '(prefers-reduced-motion: reduce)' ).matches ) {
			icons.forEach( ( icon ) => {
				icon.style.opacity = '0';
			} );
		} else {
			iconAnimationRef.current = animate( icons, {
				opacity: 0,
				y: 8,
				scale: 0.94,
				delay: ( _icon?: unknown, index = 0 ) => index * 8,
				duration: 85,
				ease: 'out(3)',
			} );
		}
		return () => {
			iconAnimationRef.current?.cancel();
			iconAnimationRef.current = null;
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
		return () => {
			document.removeEventListener( 'keydown', close );
			document.removeEventListener( 'pointerdown', close );
		};
	}, [ menu, paletteOpen, onClosePalette ] );

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
		home: 'Visit',
		new: 'Create New',
		profile: 'Account',
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
		const icons = Array.from(
			pillRef.current?.querySelectorAll< HTMLElement >( 'button, a' ) ??
				[]
		);
		const focusTarget = restoreFocusRef.current;
		restoreFocusRef.current = null;
		iconAnimationRef.current?.cancel();
		iconAnimationRef.current = null;
		setIsCovered( false );
		if ( window.matchMedia( '(prefers-reduced-motion: reduce)' ).matches ) {
			icons.forEach( ( icon ) => {
				icon.style.removeProperty( 'transform' );
				icon.style.opacity = '1';
			} );
		} else {
			icons.forEach( ( icon ) => {
				icon.style.opacity = '0';
				icon.style.transform = 'translateY(6px) scale(0.94)';
			} );
			iconAnimationRef.current = animate( icons, {
				opacity: 1,
				y: 0,
				scale: 1,
				delay: ( _icon?: unknown, index = 0 ) => index * 8,
				duration: 120,
				ease: 'out(3)',
				onComplete: () => {
					icons.forEach( ( icon ) => {
						icon.style.removeProperty( 'transform' );
					} );
				},
			} );
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

	return (
		<div
			className={ styles.root }
			ref={ rootRef }
			data-open={ !! activePanel }
			aria-label="Printah quick actions"
		>
			<div className={ styles.cluster }>
				<div
					ref={ pillRef }
					className={ `${ styles.pill }${
						isCovered ? ` ${ styles.pillCovered }` : ''
					}` }
					data-printah-pill
					inert={ isCovered }
				>
					{ toolbar && (
						<>
							<button
								type="button"
								className={ styles.icon }
								data-menu="home"
								aria-label="View site or store"
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
									aria-label={ toolbar.comments.label }
									title={ toolbar.comments.label }
								>
									<MessageSquare size={ 17 } />
									{ toolbar.comments.count ? (
										<span className={ styles.badge }>
											{ toolbar.comments.count }
										</span>
									) : null }
								</a>
							) }
							{ toolbar.new.length > 0 && (
								<button
									type="button"
									className={ styles.icon }
									data-menu="new"
									aria-label="Create new"
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
								aria-label="Profile"
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
						aria-label={ `Open Printah (${ shortcutLabel(
							shortcut
						) })` }
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
					radius={ effectivePanel === 'palette' ? 24 : 13 }
					anchorRef={ pillRef }
					onCollapsed={ restorePill }
					dynamicHeight={ effectivePanel === 'palette' }
				>
					{ effectivePanel === 'palette'
						? paletteContent
						: toolbar && (
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
