import fetchGamesFromSheet from './fetchGamesFromSheet';

import type { IFinalEntry } from './fetchGamesFromSheet';

var browser = browser || chrome;

const DATA_STORAGE_KEY = 'gog-2nd-helper-data';
const LAST_FETCHED_STORAGE_KEY = 'gog-2nd-helper-last-fetched';

const ONE_SECOND = 1000;
const ONE_MINUTE = ONE_SECOND * 60;
const ONE_HOUR = ONE_MINUTE * 60;
const ONE_DAY = ONE_HOUR * 24;
const MAX_DATA_AGE = ONE_DAY;

const getStorageData = async () => {
	try {
		const lastFetchedObj = await browser.storage.local.get(
			LAST_FETCHED_STORAGE_KEY
		);

		const lastFetched = lastFetchedObj?.[LAST_FETCHED_STORAGE_KEY];

		if (
			typeof lastFetched !== 'number' ||
			Date.now() - lastFetched >= MAX_DATA_AGE
		) {
			return null;
		}

		const storageDataObj = await browser.storage.local.get(
			DATA_STORAGE_KEY
		);

		const storageData = storageDataObj[DATA_STORAGE_KEY];

		return storageData;
	} catch (error) {
		return null;
	}
};

const setStorageData = async (data) => {
	const dataToStore = {
		[LAST_FETCHED_STORAGE_KEY]: Date.now(),
		[DATA_STORAGE_KEY]: data,
	};

	await browser.storage.local.set(dataToStore);
};

const getData = async () => {
	const storedData = (await getStorageData()) as Record<string, IFinalEntry>;

	if (storedData) {
		const thousandXResist = storedData['1000xresist'];

		if (thousandXResist && thousandXResist.achievementsUrl) {
			return storedData;
		}
	}

	const newData = await fetchGamesFromSheet();

	if (newData) {
		await setStorageData(newData);
	}

	return newData;
};

export default getData;
