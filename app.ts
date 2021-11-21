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

const INFO_WRAPPER_ID = 'gog-2nd-class-ext-info-wrapper';

const addEntryInfo = (entry: Entry) => {
	const issuesCount = entry['Issue #'];

	const productActions =
		document.querySelector<HTMLDivElement>('.product-actions');

	const infoWrapper = document.createElement('div');
	infoWrapper.style.marginTop = '16px';
	infoWrapper.style.fontSize = '20px';
	infoWrapper.style.textAlign = 'center';
	infoWrapper.id = INFO_WRAPPER_ID;

	const warning = document.createElement('div');
	warning.innerText = `⚠ Warning, ${issuesCount} issues ⚠`;
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

	productActions.style.border = '5px solid #f25100';
};

const h1 = document.querySelector('h1');
const title = h1.innerText.toLowerCase();

const entry = data[title];

if (entry && !document.querySelector(`#${INFO_WRAPPER_ID}`)) {
	addEntryInfo(entry);
}
