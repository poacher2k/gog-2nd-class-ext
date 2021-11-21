# GOG 2nd Class Citizen Extension

## Description

A WebExtension that uses data from the [Games that treat GOG customers as 2nd Class v2](https://docs.google.com/spreadsheets/d/1zjwUN1mtJdCkgtTDRB2IoFp7PP41fraY-oFNY00fEkI/edit#gid=0) spreadsheet and displays it on the GOG store

## Dev setup

1. Download the CSV-file from [the spreadsheet](https://docs.google.com/spreadsheets/d/1zjwUN1mtJdCkgtTDRB2IoFp7PP41fraY-oFNY00fEkI/edit#gid=0)
2. Remove the "stats" rows, so that the first row is "Title,Issue #,Developer,Publisher" etc.
3. Save as `raw-data.csv` in the root folder of the project
4. Run `npm install` to install dependencies
5. Run `npm run parser` to convert the `raw-data.csv` to `JSON`
6. Run `npm run build` (or `npm run watch`) to build the extension
7. Run `npm start` or `npm run start:ffdev` to run the extension in FF or FF Developer Edition respectively
