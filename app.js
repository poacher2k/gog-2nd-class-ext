import data from './data.json';

/*
Just draw a border round the document.body.
*/

const h1 = document.querySelector('h1');

const title = h1.innerText.toLowerCase();

const entry = data[title];

console.log(title, entry);
if (entry) {
	document.body.style.border = '10px solid red';
}
