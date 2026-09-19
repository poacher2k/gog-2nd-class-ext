import { IGames } from './fetchGamesFromSheet';

export const getEntryFromData = (data: IGames, titleEl: HTMLElement | null) => {
	if (!titleEl) {
		return;
	}

	const title = titleEl.innerText.trim();
	const entryKey = title.toLowerCase();

	const entry = data[entryKey];

	if (!entry) {
		return;
	}

	if (entryKey === 'metamorphosis' && title !== 'Metamorphosis') {
		return;
	}

	return entry;
};
