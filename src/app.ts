import whitelist from '../whitelist';
import getData from './utils/getData';
import {
	buildCompanyCounts,
	getCompanyRank,
	getCompanyWarningStyle,
	getMaxCount,
	normalizeCompany,
	DEVELOPER_WARNING_THRESHOLD,
	PUBLISHER_WARNING_THRESHOLD,
} from './utils/companyFrequency';

import type { IFinalEntry } from './utils/fetchGamesFromSheet';
import type { ICompanyFrequency } from './utils/companyFrequency';

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
const COMPANY_TINTED_ATTR = 'data-gog-2nd-class-company-tinted';
const RANK_TITLE_LIMIT = 20;
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

// Finds the company details row and tints the developer/publisher links based
// on how many games each company has on the list. Returns true once the company
// row is found (so a watcher can stop), regardless of whether anything was
// tinted.
//
// The row is located by the presence of developer/publisher links rather than
// the row label, since the label is translated on localized pages (e.g.
// /pl/game/...) while the link hrefs stay the same in every locale.
const COMPANY_LINK_SELECTOR =
	'a[href*="developers="], a[href*="publishers="]';

const addCompanyWarnings = (frequency: ICompanyFrequency): boolean => {
	const rows = document.querySelectorAll<HTMLDivElement>('.details__row');

	let companyContent: HTMLElement | null = null;

	rows.forEach((row) => {
		const content = row.querySelector<HTMLElement>('.details__content');

		if (content && content.querySelector(COMPANY_LINK_SELECTOR)) {
			companyContent = content;
		}
	});

	if (!companyContent) {
		return false;
	}

	const devMax = getMaxCount(frequency.developerCounts);
	const pubMax = getMaxCount(frequency.publisherCounts);

	const links = companyContent.querySelectorAll<HTMLAnchorElement>('a');

	links.forEach((link) => {
		if (link.hasAttribute(COMPANY_TINTED_ATTR)) {
			return;
		}

		const href = link.getAttribute('href') ?? '';

		let counts = null;
		let max = 0;
		let threshold = 0;
		let role = '';

		if (href.includes('developers=')) {
			counts = frequency.developerCounts;
			max = devMax;
			threshold = DEVELOPER_WARNING_THRESHOLD;
			role = 'developer';
		} else if (href.includes('publishers=')) {
			counts = frequency.publisherCounts;
			max = pubMax;
			threshold = PUBLISHER_WARNING_THRESHOLD;
			role = 'publisher';
		}

		if (!counts) {
			return;
		}

		const count = counts[normalizeCompany(link.innerText)] ?? 0;
		const style = getCompanyWarningStyle(count, max, threshold);

		link.setAttribute(COMPANY_TINTED_ATTR, 'true');

		if (!style) {
			return;
		}

		link.style.backgroundColor = style.background;
		link.style.color = style.color;
		link.style.padding = '2px 6px';
		link.style.borderRadius = '3px';

		const { rank, total } = getCompanyRank(count, counts);
		const baseTitle = `${count} game${
			count === 1 ? '' : 's'
		} on the 2nd-class list`;

		// Only the top-ranked companies get a rank in the tooltip; the rest
		// just note the role.
		if (rank <= RANK_TITLE_LIMIT) {
			link.title = `${baseTitle} — #${rank} of ${total} ${role}s`;
		} else {
			link.title = `${baseTitle} (${role})`;
		}
	});

	return true;
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

		const frequency = buildCompanyCounts(data);

		if (!addCompanyWarnings(frequency)) {
			const companyObserver = new MutationObserver(() => {
				if (addCompanyWarnings(frequency)) {
					companyObserver.disconnect();
				}
			});

			companyObserver.observe(document.body, {
				subtree: true,
				childList: true,
			});
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
