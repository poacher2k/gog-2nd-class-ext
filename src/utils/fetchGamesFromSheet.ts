import Papa from 'papaparse';

export type Entry = {
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

const INDEX_OFFSET = 7; // to offset the "Stats"-section and headers of the sheet
const ACTUAL_HEADER_DELIMITER = `"Title","","Developer","Publisher","Missing Updates"`;
const DOC_ID = `1zjwUN1mtJdCkgtTDRB2IoFp7PP41fraY-oFNY00fEkI`;
const URL = `https://docs.google.com/spreadsheets/d/${DOC_ID}/gviz/tq?tqx=out:csv&headers=0`;

function parseCSV(csvString, config) {
	return new Promise((resolve, reject) => {
		Papa.parse(csvString, {
			...config,

			complete: ({ data }) => resolve(data),
			error: reject,
		});
	});
}

const getUrl = (index) => {
	const sheetIndex = index + INDEX_OFFSET;

	return `https://docs.google.com/spreadsheets/d/${DOC_ID}/edit#gid=0&range=${sheetIndex}:${sheetIndex}`;
};

const fetchGamesFromSheet = async () => {
	const res = await fetch(URL);
	const csv = await res.text();

	const actualHeaderStart = csv.indexOf(ACTUAL_HEADER_DELIMITER);

	if (actualHeaderStart === -1) {
		throw new Error(`Couldn't find actual header start`);
	}

	const actualCsv = csv
		.slice(actualHeaderStart)
		.replace(`"Title","",`, `"Title","Issue #",`);

	const rows = (await parseCSV(actualCsv, {
		header: true,
	})) as Entry[];

	const games: Record<string, Entry> = {};

	rows.filter(Boolean).forEach((value, index) => {
		value.url = getUrl(index);

		delete value[''];

		games[value.Title.toLowerCase()] = value;
	});

	return games;
};

export default fetchGamesFromSheet;
