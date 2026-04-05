import { readFileSync } from 'fs';
import { join } from 'path';

const wordleAnswers = readFileSync(join(__dirname, '../data/wordle-answers.txt'), 'utf-8');
const wordlePossible = readFileSync(join(__dirname, '../data/wordle-possible.txt'), 'utf-8');

let answers: string[] = [];
let possible: string[] = [];


answers = wordleAnswers.split('\n');
console.log('Loaded', answers.length, 'answers');

possible = wordlePossible.split('\n');
possible = possible.map((w) => w.replace('\r', ''));
console.log('Loaded', possible.length, 'answers');

export const getRandomWord = (): string => {
    return answers[Math.floor(Math.random() * answers.length)].toUpperCase();
};

export const findWord = (word: string): boolean => {
    return possible.includes(word.toLowerCase());
};
