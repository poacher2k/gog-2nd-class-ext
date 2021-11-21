const Papa = require('papaparse');
const fs = require('fs');

const readStream = fs.createReadStream('./raw-data.csv');

const INDEX_OFFSET = 7; // to offset the "Stats"-section and headers of the sheet

const getUrl = (index) => {
	const sheetIndex = index + INDEX_OFFSET;

	return `https://docs.google.com/spreadsheets/d/1zjwUN1mtJdCkgtTDRB2IoFp7PP41fraY-oFNY00fEkI/edit#gid=0&range=${sheetIndex}:${sheetIndex}`;
};

const parser = Papa.parse(readStream, {
	header: true,
	complete: function (results, file) {
		const data = {};

		results.data.forEach((value, index) => {
			value.url = getUrl(index);

			data[value.Title.toLowerCase()] = value;
		});

		fs.writeFileSync('./data.json', JSON.stringify(data, null, 2));
	},
});
