import path from 'path';
import fs from 'fs';

let answers: string[] = [];
let possible: string[] = [];

fs.readFile(path.join(__dirname, '../data/wordle-answers.txt'), 'utf8', (err, data) => {
    if (err) {
        console.error(err);
        return;
    }
    answers = data.split('\n');
    console.log('Loaded', answers.length, 'answers');
});

fs.readFile(path.join(__dirname, '../data/wordle-possible.txt'), 'utf8', (err, data) => {
    if (err) {
        console.error(err);
        return;
    }
    possible = data.split('\n');
    possible = possible.map((w) => w.replace('\r', ''));
    console.log('Loaded', possible.length, 'answers');
});

export const getRandomWord = (): string => {
    return answers[Math.floor(Math.random() * answers.length)].toUpperCase();
};

export const findWord = (word: string): boolean => {
    return possible.includes(word.toLowerCase());
};
