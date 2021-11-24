import data from './data.json';

type Entry = {
	Title: string;
	'Issue #': string;
	Developer: string;
	Publisher: string;
	'Missing Updates': string;
	'Missing Languages': string;
	'Missing Free DLC': string;
	'Missing Paid DLC': string;
	'Missing Features': string;
	'Missing Soundtrack': string;
	Other: string;
	'Missing Builds': string;
	'Region Locking': string;
	'Source 1': string;
	'Source 2': string;
	url: string;
};

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
};

const BORDER_STYLE_ID = 'GOG_2ND_CLASS_EXT_BORDER_STYLE';
const BORDER_STYLE_CLASS = 'GOG_2ND_CLASS_EXT_BORDER';

if (!document.querySelector(`#${BORDER_STYLE_ID}`)) {
	const borderStyle = document.createElement('style');
	borderStyle.id = BORDER_STYLE_ID;
	borderStyle.textContent = `
	.${BORDER_STYLE_CLASS} {
		border: 5px solid #f25100;
	}
	.${BORDER_STYLE_CLASS} + .${BORDER_STYLE_CLASS} {
		border-top: none;
	}

	`;
	document.head.appendChild(borderStyle);
}

const INFO_WRAPPER_ID = 'gog-2nd-class-ext-info-wrapper';

const addEntryInfo = (entry: Entry) => {
	const issuesCount = entry['Issue #'];

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
	warning.innerText = `⚠ ${issuesCount} issues ⚠`;
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
			const span = document.createElement('span');
			span.innerText = icon;
			span.title = `${key}: ${entryField}`;
			span.style.cursor = 'help';
			span.style.verticalAlign = 'baseline';
			span.style.margin = '5px';

			fieldsWrapper.appendChild(span);
		}
	});

	const link = document.createElement('a');
	link.href = entry.url;
	link.innerText = '🔗';
	link.title = `Go to entry in spreadsheet`;
	link.target = '_blank';
	link.referrerPolicy = 'no-referrer';
	link.style.cursor = 'pointer';

	fieldsWrapper.appendChild(link);

	infoWrapper.appendChild(fieldsWrapper);

	productActions.appendChild(infoWrapper);

	productActions.classList.add(BORDER_STYLE_CLASS);
};

const addCheckoutBorders = () => {
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

const pathname = location.pathname;

if (pathname.startsWith('/game/')) {
	const h1 = document.querySelector('h1');
	const title = h1.innerText.toLowerCase();

	const entry = data[title];

	if (entry && !document.querySelector(`#${INFO_WRAPPER_ID}`)) {
		addEntryInfo(entry);
	}
} else if (pathname.startsWith('/checkout/')) {
	const checkoutOrder =
		document.querySelector<HTMLDivElement>('.order.container');

	const checkoutObserver = new MutationObserver(addCheckoutBorders);

	checkoutObserver.observe(checkoutOrder, { subtree: true, childList: true });

	addCheckoutBorders();
}

const cart = document.querySelector<HTMLDivElement>(
	'.menu-cart__products-list'
);

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

const cartObserver = new MutationObserver(addCartBorders);

cartObserver.observe(cart, { subtree: true, childList: true });
