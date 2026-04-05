import * as WordUtil from './WordUtil';
import type { LetterData, PlayerData } from '@xordle/common';

const TIME_LIMIT = 31;

class Player {
    id: string;
    name: string;
    keys: Record<string, number>;
    history: LetterData[][];
    historySet: Set<string>;
    inProgress: boolean;
    countdown: number;
    timeRemaining: number;
    attempts: number;

    constructor(id: string, name: string) {
        this.id = id;
        this.name = name;
        this.keys = {};
        this.history = [];
        this.historySet = new Set();
        this.inProgress = false;
        this.countdown = 0;
        this.timeRemaining = 0;
        this.attempts = 0;
    }

    setID(id: string): void {
        this.id = id;
    }

    getName(): string {
        return this.name;
    }

    getData(): PlayerData {
        return {
            id: this.id,
            name: this.name,
            keys: this.keys,
            history: this.history,
            inProgress: this.inProgress,
            timeRemaining: this.timeRemaining,
            attempts: this.attempts,
        };
    }

    getID(): string {
        return this.id;
    }

    setInProgress(inProgress: boolean): void {
        this.inProgress = inProgress;
    }

    // https://codereview.stackexchange.com/questions/274301/wordle-color-algorithm-in-javascript
    getWordStatus(index: number, currentWord: string[], correctWord: string): number {
        // correct (matched) index letter
        if (currentWord[index] === correctWord[index]) {
            return 1;
        }

        let wrongWord = 0;
        let wrongGuess = 0;
        for (let i = 0; i < correctWord.length; i++) {
            // count the wrong (unmatched) letters
            if (correctWord[i] === currentWord[index] && currentWord[i] !== currentWord[index]) {
                wrongWord++;
            }
            if (i <= index) {
                if (currentWord[i] === currentWord[index] && correctWord[i] !== currentWord[index]) {
                    wrongGuess++;
                }
            }

            // an unmatched guess letter is wrong if it pairs with
            // an unmatched word letter
            if (i >= index) {
                if (wrongGuess === 0) {
                    break;
                }
                if (wrongGuess <= wrongWord) {
                    return 2;
                }
            }
        }

        // otherwise not any
        return 6;
    }

    currentIsInHistory(currentWordString: string): boolean {
        return this.historySet.has(currentWordString);
    }

    enterWord(currentWord: string[], correctWord: string): boolean {
        const currentWordString = currentWord.join('');
        const found = WordUtil.findWord(currentWordString);

        if (currentWord.length < 5 || !found) {
            console.log('Invalid word', currentWord);
            return false;
        } else if (this.currentIsInHistory(currentWordString)) {
            return false;
        }

        this.attempts++;

        const currentWordStatus = currentWord.map((letter, i) => {
            const status = this.getWordStatus(i, currentWord, correctWord);
            this.keys[letter] = this.keys[letter] ? Math.min(this.keys[letter], status) : status;
            return {
                letter: letter.toUpperCase(),
                status: status,
            };
        });

        this.history.push(currentWordStatus);
        this.historySet.add(currentWordString);

        this.inProgress = currentWordString !== correctWord;
        this.resetCountdown();

        return !this.inProgress;
    }

    clean(val: string[]): string[] | undefined {
        if (val.length === 0) {
            return [];
        } else if (val.length <= 5 && /^[a-zA-Z]+$/.test(val.join(''))) {
            return val;
        }
    }

    removeOldest(): void {
        const word = this.history.shift();
        if (word) {
            this.historySet.delete(word.map(({ letter }) => letter).join(''));
        }
        this.keys = {};
        this.history.forEach((w) => {
            w.forEach(({ letter, status }) => {
                this.keys[letter] = this.keys[letter] ? Math.min(this.keys[letter], status) : status;
            });
        });
    }

    getAttempts(): number {
        return this.attempts;
    }

    calculateProgress(): number {
        this.timeRemaining = this.countdown / TIME_LIMIT;
        return this.timeRemaining;
    }

    resetCountdown(): void {
        this.countdown = TIME_LIMIT;
        this.calculateProgress();
    }

    setCountdown(numArg: number | ((n: number) => number)): void {
        if (!this.inProgress) {
            return;
        }

        if (typeof numArg === 'function') {
            const res = numArg(this.countdown);
            this.countdown = res > 0 ? res : 0;
        } else {
            this.countdown = numArg;
        }

        if (this.countdown === 0) {
            this.resetCountdown();
            this.removeOldest();
        }

        this.calculateProgress();
    }

    reset(): void {
        this.keys = {};
        this.history = [];
        this.historySet = new Set();
        this.inProgress = false;
        this.timeRemaining = 0;
        this.countdown = 0;
        this.attempts = 0;
    }

    start(): void {
        if (this.inProgress) return;
        this.reset();
        this.inProgress = true;
        this.timeRemaining = TIME_LIMIT;
        this.countdown = this.timeRemaining;
    }

    static getDefaultData(): Pick<PlayerData, 'keys' | 'history' | 'inProgress' | 'timeRemaining'> {
        return {
            keys: {},
            history: [],
            inProgress: true,
            timeRemaining: 1,
        };
    }
}

export default Player;
