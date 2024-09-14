import Papa from 'papaparse';

export type IGameEntry = {
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

export type IAchivementsEntry = {
	Title: string;
	ID?: string;
	Developer: string;
	Publisher: string;
	'Missing All Achievements'?: string;
	'Missing Some Achievements'?: string;
	'Broken Achievements'?: string;
	achievementsUrl?: string;
};

export type IFinalEntry = IGameEntry & IAchivementsEntry;

export type IGames = Record<string, IFinalEntry>;

const GAMES_INDEX_OFFSET = 7; // to offset the "Stats"-section and headers of the sheet
const GAMES_ACTUAL_HEADER_DELIMITER = `"Title","","Developer","Publisher","Missing Updates"`;
const GAMES_DOC_ID = `1zjwUN1mtJdCkgtTDRB2IoFp7PP41fraY-oFNY00fEkI`;
const GAMES_SHEET_URL = `https://docs.google.com/spreadsheets/d/${GAMES_DOC_ID}/gviz/tq?tqx=out:csv&headers=0`;

const ACHIVEMENTS_INDEX_OFFSET = 4; // to offset the "Stats"-section and headers of the sheet
const ACVHIEMENTS_ACTUAL_HEADER_DELIMITER = `"Title"`;
const ACHIEVEMENTS_DOC_ID = `1pDO6WTHLHyrrtidQ1MAxW6u8j3BxUaGcFaJsVyWj2QY`;
const ACHIEVEMENTS_SHEET_URL = `https://docs.google.com/spreadsheets/d/${ACHIEVEMENTS_DOC_ID}/gviz/tq?tqx=out:csv&headers=0`;

function parseCSV(csvString, config) {
	return new Promise((resolve, reject) => {
		Papa.parse(csvString, {
			...config,

			complete: ({ data }) => resolve(data),
			error: reject,
		});
	});
}

const getUrl = (docId, index, offset) => {
	const sheetIndex = index + offset;

	return `https://docs.google.com/spreadsheets/d/${docId}/edit#gid=0&range=${sheetIndex}:${sheetIndex}`;
};

const fetchAchievementsFromSheet = async (games: IGames) => {
	const res = await fetch(ACHIEVEMENTS_SHEET_URL);
	const csv = await res.text();

	const actualHeaderStart = csv.indexOf(ACVHIEMENTS_ACTUAL_HEADER_DELIMITER);

	if (actualHeaderStart === -1) {
		throw new Error(`Couldn't find actual header start`);
	}

	const actualCsv = csv
		.slice(actualHeaderStart)
		.replace(`"Title","",`, `"Title","ID",`);

	const rows = (await parseCSV(actualCsv, {
		header: true,
	})) as IAchivementsEntry[];

	rows.filter(Boolean).forEach((value, index) => {
		value.achievementsUrl = getUrl(
			ACHIEVEMENTS_DOC_ID,
			index,
			ACHIVEMENTS_INDEX_OFFSET
		);

		delete value[''];

		const gameTitleKey = value.Title.toLowerCase();

		const existingGame = games[gameTitleKey] ?? ({} as IGameEntry);
		const issuesCount = parseInt(existingGame['Issue #'] ?? '0', 10);

		games[gameTitleKey] = {
			...existingGame,
			...value,
		};

		games[gameTitleKey]['Issue #'] = String(issuesCount + 1);
	});

	return games;
};

const fetchGamesFromSheet = async () => {
	const res = await fetch(GAMES_SHEET_URL);
	const csv = await res.text();

	const actualHeaderStart = csv.indexOf(GAMES_ACTUAL_HEADER_DELIMITER);

	if (actualHeaderStart === -1) {
		throw new Error(`Couldn't find actual header start`);
	}

	const actualCsv = csv
		.slice(actualHeaderStart)
		.replace(`"Title","",`, `"Title","Issue #",`);

	const rows = (await parseCSV(actualCsv, {
		header: true,
	})) as IGameEntry[];

	const games: IGames = {};

	rows.filter(Boolean).forEach((value, index) => {
		value.url = getUrl(GAMES_DOC_ID, index, GAMES_INDEX_OFFSET);

		delete value[''];

		games[value.Title.toLowerCase()] = value;
	});

	await fetchAchievementsFromSheet(games);

	return games;
};

export default fetchGamesFromSheet;
