const WordUtil = require('./WordUtil.js');

const TIME_LIMIT = 31;

class Player {
  constructor(id, name) {
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

  setID(id) {
    this.id = id;
  }

  getName() {
    return this.name
  }

  getData() {
    return {
      id: this.id,
      name: this.name,
      keys: this.keys,
      history: this.history,
      inProgress: this.inProgress,
      timeRemaining: this.timeRemaining,
      attempts: this.attempts
    }
  }

  getID() {
    return this.id;
  }

  setInProgress(inProgress) {
    this.inProgress = inProgress;
  }

  // https://codereview.stackexchange.com/questions/274301/wordle-color-algorithm-in-javascript
  getWordStatus(index, currentWord, correctWord) {
    // correct (matched) index letter
    if (currentWord[index] === correctWord[index]) {
      return 1;
    }

    let wrongWord = 0
    let wrongGuess = 0;
    for (let i = 0; i < correctWord.length; i++) {
      // count the wrong (unmatched) letters
      if (correctWord[i] === currentWord[index] && currentWord[i] !== currentWord[index] ) {
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

  currentIsInHistory(currentWordString) {
    return this.historySet.has(currentWordString);
  }

  enterWord(currentWord, correctWord) {
    const currentWordString = currentWord.join('');
    const found = WordUtil.findWord(currentWordString);

    if(currentWord.length < 5 || !found) {
      console.log('Invalid word', currentWord);
      return false;
    } else if(this.currentIsInHistory(currentWordString)) {
      return false;
    }

    this.attempts++;

    const currentWordStatus = currentWord.map((letter, i) => {
      const status = this.getWordStatus(i, currentWord, correctWord);
      this.keys[letter] = this.keys[letter] ? Math.min(this.keys[letter], status) : status;
      return {
        letter: letter.toUpperCase(),
        status: status,
      }
    });

    this.history.push(currentWordStatus);
    this.historySet.add(currentWordString);

    this.inProgress = currentWordString !== correctWord;
    this.resetCountdown()
    
    return !this.inProgress;
  }

  clean(val) {
    if(val.length === 0) {
      return [];
    } else if(val.length <= 5 && (/^[a-zA-Z]+$/.test(val.join('')))) {
      return val;
    }
  }

  removeOldest() {
    const word = this.history.shift();
    if(word) {
      this.historySet.delete(word.map(({ letter }) => letter).join(''));
    }
    this.keys = {};
    this.history.forEach((word) => {
      word.forEach(({ letter, status })  => {
        this.keys[letter] = this.keys[letter] ? Math.min(this.keys[letter], status) : status;
      });
    });
  }

  getAttempts() {
    return this.attempts;
  }

  calculateProgress() {
    this.timeRemaining = this.countdown / TIME_LIMIT;
    return this.timeRemaining;
  }

  resetCountdown() {
    this.countdown = TIME_LIMIT;
    this.calculateProgress();
  }

  setCountdown(numArg) {
    if(!this.inProgress) {
      return;
    }

    if(typeof numArg === 'function') {
      const res = numArg(this.countdown)
      this.countdown = res > 0 ? res : 0;
    } else {
      this.countdown = numArg;
    }

    if(this.countdown === 0) {
      this.resetCountdown();
      this.removeOldest();
    }
    
    this.calculateProgress();
  }

  reset() {
    this.keys = {};
    this.history = [];
    this.historySet = new Set();
    this.inProgress = false;
    this.timeRemaining = 0;
    this.countdown = 0;
    this.attempts = 0;
  }

  start() {
    if(this.inProgress) return;
    this.reset();
    this.inProgress = true;
    this.timeRemaining = TIME_LIMIT;
    this.countdown = this.timeRemaining;
  }
}

Player.getDefaultData = () => {
  return {
    keys: {},
    history: [],
    inProgress: true,
    timeRemaining: 1
  }
}

module.exports = Player;