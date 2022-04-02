const path = require('path')
const fs = require('fs')

let answers = [];
let possible = [];

fs.readFile(path.join(__dirname, './wordle-answers.txt'), 'utf8' , (err, data) => {
  if (err) {
    console.error(err)
    return
  }
  answers = data.split('\n');
  console.log('Loaded', answers.length, 'answers');
})

fs.readFile(path.join(__dirname, './wordle-possible.txt'), 'utf8' , (err, data) => {
  if (err) {
    console.error(err)
    return
  }
  possible = data.split('\n');
  possible = possible.map(w => w.replace('\r', ''));
  console.log('Loaded', possible.length, 'answers');
})

const getRandomWord = () => {
  return answers[Math.floor(Math.random() * answers.length)].toUpperCase();
}

const findWord = (word) => {
  return possible.includes(word.toLowerCase());
}

module.exports = { getRandomWord, findWord };