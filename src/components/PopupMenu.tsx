import { ExternalLink, X } from 'lucide-react';
import type { ToolbarLink } from '../config';
import styles from './FloatingToolbar.module.css';

function PopupMenu( {
	title,
	items,
	onClose,
}: {
	title: string;
	items: ToolbarLink[];
	onClose: () => void;
} ) {
	return (
		<div className={ styles.popupInner } role="menu" aria-label={ title }>
			<div className={ styles.popupHeader } data-panel-header>
				<span>{ title }</span>
				<button
					type="button"
					onClick={ onClose }
					aria-label="Close menu"
				>
					<X size={ 14 } aria-hidden="true" />
				</button>
			</div>
			{ items.map( ( link ) => (
				<a
					key={ link.url }
					className={ styles.item }
					href={ link.url }
					role="menuitem"
				>
					<span>{ link.label }</span>
					<ExternalLink size={ 14 } aria-hidden="true" />
				</a>
			) ) }
		</div>
	);
}

export default PopupMenu;
