import whitelist from '../whitelist';
import getData from './utils/getData';

import type { IFinalEntry } from './utils/fetchGamesFromSheet';

const fieldIconMap = {
	'Missing Updates': '🔃',
	'Missing Languages': '🌍',
	'Missing Free DLC': '🆓',
	'Missing Paid DLC': '💳',
	'Missing Features': '🧰',
	'Missing Soundtrack': '🎼',
	Other: '➕',
	'Missing Builds': '🧱',
	'Region Locking': '🔒',
	'Missing All Achievements': '🥇',
	'Missing Some Achievements': '🥈',
	'Broken Achievements': '🥉',
};

const BORDER_STYLE_ID = 'GOG_2ND_CLASS_EXT_BORDER_STYLE';
const BORDER_STYLE_CLASS = 'GOG_2ND_CLASS_EXT_BORDER';
const INFO_WRAPPER_ID = 'gog-2nd-class-ext-info-wrapper';
const PATHNAME_GAME_REGEX = /^(?:\/\w\w)?\/game\//;
const PATHNAME_CHECKOUT_REGEX = /^(?:\/\w\w)?\/checkout\//;

const addBorderStyleTag = () => {
	if (!document.querySelector(`#${BORDER_STYLE_ID}`)) {
		const borderStyle = document.createElement('style');
		borderStyle.id = BORDER_STYLE_ID;
		borderStyle.textContent = `
	.${BORDER_STYLE_CLASS} {
		border: 5px solid #f25100 !important;
	}
	.${BORDER_STYLE_CLASS} + .${BORDER_STYLE_CLASS} {
		border-top: none !important;
	}
		`;
		document.head.appendChild(borderStyle);
	}
};

const cart = document.querySelector<HTMLDivElement>(
	'.menu-cart__products-list'
);

const addEntryInfo = (entry: IFinalEntry) => {
	const issuesCount = entry['Issue #'];
	const hasSingleIssue = issuesCount === '1';

	const productActions =
		document.querySelector<HTMLDivElement>('.product-actions');

	if (!productActions) {
		return;
	}

	const infoWrapper = document.createElement('div');
	infoWrapper.style.marginTop = '16px';
	infoWrapper.style.fontSize = '20px';
	infoWrapper.style.textAlign = 'center';
	infoWrapper.id = INFO_WRAPPER_ID;

	const warning = document.createElement('div');
	warning.innerText = `⚠ ${issuesCount} issue${hasSingleIssue ? '' : 's'} ⚠`;
	warning.style.textTransform = 'uppercase';
	warning.style.marginBottom = '10px';

	infoWrapper.appendChild(warning);

	const fieldsWrapper = document.createElement('div');
	fieldsWrapper.style.display = 'flex';
	fieldsWrapper.style.alignItems = 'center';
	fieldsWrapper.style.justifyContent = 'center';

	Object.entries(fieldIconMap).map(([key, icon]) => {
		const entryField = entry[key];

		if (entryField) {
			const initialNewLine = entryField.includes('\n') ? '\n' : ' ';
			const span = document.createElement('span');
			span.innerText = icon;
			span.title = `${key}:${initialNewLine}${entryField}`;
			span.style.cursor = 'help';
			span.style.verticalAlign = 'baseline';
			span.style.margin = '5px';

			fieldsWrapper.appendChild(span);
		}
	});

	const separator = document.createElement('span');
	separator.innerText = '|';
	separator.style.margin = '5px';

	fieldsWrapper.appendChild(separator);

	if (entry.url) {
		const link = document.createElement('a');
		link.href = entry.url;
		link.innerText = '🔗';
		link.title = `Go to entry in spreadsheet`;
		link.target = '_blank';
		link.referrerPolicy = 'no-referrer';
		link.style.margin = '5px';
		link.style.cursor = 'pointer';

		fieldsWrapper.appendChild(link);
	}

	if (entry.achievementsUrl) {
		const link = document.createElement('a');
		link.href = entry.achievementsUrl;
		link.innerText = '🏆';
		link.title = `Go to entry in achievements spreadsheet`;
		link.target = '_blank';
		link.referrerPolicy = 'no-referrer';
		link.style.margin = '5px';
		link.style.cursor = 'pointer';

		fieldsWrapper.appendChild(link);
	}

	infoWrapper.appendChild(fieldsWrapper);

	productActions.appendChild(infoWrapper);

	productActions.classList.add(BORDER_STYLE_CLASS);
};

const addCheckoutBorders = (data) => {
	const items = document.querySelectorAll<HTMLDivElement>(
		'.form.order__games .product-row.is-in-cart'
	);

	items.forEach((item) => {
		const titleEl = item.querySelector<HTMLSpanElement>(
			'.product-title__text'
		);
		const title = titleEl.innerText.toLowerCase();

		const entry = data[title];

		if (entry) {
			item.classList.add(BORDER_STYLE_CLASS);
		}
	});
};

const init = async () => {
	addBorderStyleTag();

	const data = await getData();

	const addCartBorders = () => {
		const items = cart.querySelectorAll<HTMLDivElement>(
			'.menu-cart__products-list .menu-cart-item.is-in-cart'
		);

		items.forEach((item) => {
			const titleEl = item.querySelector<HTMLDivElement>(
				'.menu-cart-item__title'
			);

			const title = titleEl.innerText.toLowerCase();

			const entry = data[title];

			if (entry) {
				item.classList.add(BORDER_STYLE_CLASS);
				const img = item.querySelector<HTMLImageElement>(
					'img.menu-cart-item__image'
				);
				img.style.height = 'calc(100% - 10px)';
			}
		});
	};

	const pathname = location.pathname;

	const isGamePath = PATHNAME_GAME_REGEX.test(pathname);
	const isCheckoutPath = PATHNAME_CHECKOUT_REGEX.test(pathname);

	if (isGamePath) {
		const h1 = document.querySelector('h1');
		const title = h1.innerText.toLowerCase();

		const entry = data[title];

		console.info('2nd Class Helper Entry?', entry);

		if (entry && !document.querySelector(`#${INFO_WRAPPER_ID}`)) {
			addEntryInfo(entry);
		}
	} else if (isCheckoutPath) {
		const checkoutOrder =
			document.querySelector<HTMLDivElement>('.order.container');

		const checkoutObserver = new MutationObserver(addCheckoutBorders);

		checkoutObserver.observe(checkoutOrder, {
			subtree: true,
			childList: true,
		});

		addCheckoutBorders(data);
	}

	const cartObserver = new MutationObserver(addCartBorders);

	cartObserver.observe(cart, { subtree: true, childList: true });
};

init();
