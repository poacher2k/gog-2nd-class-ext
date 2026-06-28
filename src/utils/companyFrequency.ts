import type { IGames } from './fetchGamesFromSheet';

export type ICompanyCounts = Record<string, number>;

export type ICompanyFrequency = {
	developerCounts: ICompanyCounts;
	publisherCounts: ICompanyCounts;
};

// Companies with this many games (or more) on the list start getting a warning
// tint. Developers warn earlier than publishers since they're more granular.
export const DEVELOPER_WARNING_THRESHOLD = 2;
export const PUBLISHER_WARNING_THRESHOLD = 5;

// Normalizes a company name so the GOG page text matches the spreadsheet field.
// Lowercases and strips everything that isn't alphanumeric, so
// "Devolver Digital" and "devolver-digital" both become "devolverdigital".
export const normalizeCompany = (name: string): string =>
	(name ?? '')
		.toLowerCase()
		.normalize('NFKD')
		.replace(/[^a-z0-9]+/g, '');

// Builds developer/publisher frequency maps from the games list, counting each
// game once per field. Matching is exact-normalized (compound fields like
// "X and Y" only count toward the full string, not the parts).
export const buildCompanyCounts = (games: IGames): ICompanyFrequency => {
	const developerCounts: ICompanyCounts = {};
	const publisherCounts: ICompanyCounts = {};

	Object.values(games).forEach((entry) => {
		const developerKey = normalizeCompany(entry.Developer);
		if (developerKey) {
			developerCounts[developerKey] =
				(developerCounts[developerKey] ?? 0) + 1;
		}

		const publisherKey = normalizeCompany(entry.Publisher);
		if (publisherKey) {
			publisherCounts[publisherKey] =
				(publisherCounts[publisherKey] ?? 0) + 1;
		}
	});

	return { developerCounts, publisherCounts };
};

export const getMaxCount = (counts: ICompanyCounts): number => {
	const values = Object.values(counts);

	return values.length ? Math.max(...values) : 0;
};

export type ICompanyWarningStyle = {
	background: string;
	color: string;
};

// Maps a count to a yellow->red tint. Returns null below the threshold so
// low-frequency companies are left untouched. `max` is the current worst
// offender, so the deepest red always tracks the busiest company in the list.
export const getCompanyWarningStyle = (
	count: number,
	max: number,
	threshold: number
): ICompanyWarningStyle | null => {
	if (count < threshold) {
		return null;
	}

	const span = Math.max(max - threshold, 1);
	const t = Math.min(Math.max((count - threshold) / span, 0), 1);

	const hue = 50 - 50 * t; // 50 (yellow) -> 0 (red)
	const lightness = 55 - 15 * t; // 55% (bright) -> 40% (deep)

	return {
		background: `hsl(${hue}, 95%, ${lightness}%)`,
		color: t < 0.6 ? '#1a1a1a' : '#ffffff',
	};
};
