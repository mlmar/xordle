const WordUtil = require('./WordUtil.js');

const ROOMS = new Map();
const ROOM_TIMEOUTS = new Map();

class Room {
  constructor(id, host) {
    this.id = id;
    this.host = host;
    this.users = new Set([host]);
    this.interval = null;
    this.turn = null;
    this.turnIndex = null;
    this.current = [];
    this.keys = {};
    this.history = [];
    this.historySet = new Set();
    this.inProgress = false;
    this.word = '';
    this.reveal = false;

    this.countdown = 0;
    this.timeLimit = 0;
    this.timeRemaining = 0;
    this.status = 0;
    this.paused = false;
  }

  getData() {
    return {
      host: this.host,
      id: this.id,
      playerCount: this.users.size,
      turn: this.turn,
      current: this.current,
      keys: this.keys,
      history: this.history,
      inProgress: this.inProgress,
      word: this.word,
      timeRemaining: this.timeRemaining,
      status: this.status,
    }
  }

  getID() {
    return this.id();
  }

  getHost() {
    return this.host;
  }

  addUser(user) {
    this.users.add(user);
    const roomTimeout = ROOM_TIMEOUTS.get(this.id);
    if(roomTimeout) {
      clearTimeout(roomTimeout);
      console.log('PROCESS: Clearing room timeout for', `[${this.id}]`);
      this.host = user;
      this.turn = user;
      this.unpauseInterval();
    }
  }

  removeUser(user) {
    this.users.delete(user);

    if(this.host === user && this.users.size > 0) {
      this.host = Array.from(this.users)[0];
      console.log('PROCESS: Picking', `[${this.host}]`, 'as new host for', `[${this.id}]`);
    }

    if(this.turn === user) {
      this.nextTurn();
    }

    return this.users;
  }

  getUsers() {
    return Array.from(this.users);
  }

  setWord(word) {
    this.word = word;
  }

  // https://codereview.stackexchange.com/questions/274301/wordle-color-algorithm-in-javascript
  getStatus(index) {
    // correct (matched) index letter
    if (this.current[index] === this.word[index]) {
      return 1;
    }

    let wrongWord = 0
    let wrongGuess = 0;
    for (let i = 0; i < this.word.length; i++) {
      // count the wrong (unmatched) letters
      if (this.word[i] === this.current[index] && this.current[i] !== this.current[index] ) {
        wrongWord++;
      }
      if (i <= index) {
        if (this.current[i] === this.current[index] && this.word[i] !== this.current[index]) {
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

  currentIsInHistory() {
    return this.historySet.has(this.current.join(''));
  }

  enterWord() {
    const found = WordUtil.findWord(this.current.join(''));
    this.status = 1;

    if(this.current.length < 5) {
      this.current = [];
      return true;
    } else if(!found || this.currentIsInHistory()) {
      this.current = [];
      return true;
    }

    const newWord = this.current.map((letter, i) => {
      const status = this.getStatus(i);
      this.keys[letter] = this.keys[letter] ? Math.min(this.keys[letter], status) : status;
      return {
        letter: letter.toUpperCase(),
        status: status,
      }
    });

    this.history.push(newWord);
    this.historySet.add(this.current.join(''));

    if(this.current.join('') === this.word) {
      this.turn = null;
      this.reveal = true;
      this.stopInterval();
    }
    this.current = [];

    return this.turn === null;
  }

  setCurrent(val) {
    if(val.length === 0) {
      this.current = [];
    } else if(val.length <= 5 && (/^[a-zA-Z]+$/.test(val.join('')))) {
      this.current = val;
    }
    this.status = 0;
  }

  nextTurn() {
    if(++this.turnIndex >= this.users.size) {
      this.turnIndex = 0;
    }
    this.turn = Array.from(this.users)[this.turnIndex];
    this.current = [];
    this.status = 1;
  }

  removeOldest() {
    const word = this.history.shift();
    this.historySet.delete(word);
    this.keys = {};
    this.history.forEach((word) => {
      word.forEach(({ letter, status })  => {
        this.keys[letter] = this.keys[letter] ? Math.min(this.keys[letter], status) : status;
      });
    });
  }

  setStatus(status) {
    this.status = status;
  }

  setCountdown(numArg) {
    if(typeof numArg === 'function') {
      const res = numArg(this.countdown);
      this.countdown = res > 0 ? res : 0;
    } else {
      this.countdown = numArg;
    }
    this.calculateProgress();
    return this.countdown;
  }

  resetCountdown() {
    this.countdown = this.timeLimit;
    this.calculateProgress();
  }

  calculateProgress() {
    this.timeRemaining = this.countdown / this.timeLimit;
    return this.timeRemaining;
  }

  startInterval(callback, time) {
    if(this.interval) return;
    this.interval = setInterval(() => {
      if(!this.paused) callback();
    }, time);
  }

  stopInterval() {
    if(!this.interval) return;
    clearInterval(this.interval);
    this.interval = null;
  }

  pauseInterval() {
    this.paused = true;
    console.log('PROCESS: Pausing interval for',`[${this.id}]`)
  }

  unpauseInterval() {
    this.paused = false;
    console.log('PROCESS: Unpausing interval for',`[${this.id}]`)
  }

  start() {
    if(this.inProgress) return;
    this.turnIndex = Math.floor(Math.random() * this.users.size);
    this.turn = Array.from(this.users)[this.turnIndex];
    this.inProgress = true;
    this.keys = {};
    this.history = [];
    this.historySet = new Set();
    this.word = WordUtil.getRandomWord();
    this.timeLimit = 30;
    this.countdown = this.timeLimit;
    this.timeRemaining = this.countdown / this.timeLimit;
    this.status = 0;
    this.paused = false;
    // this.word = 'SPACE';
    console.log('WORD:', this.word);
  }
  
  end() {
    this.turn = null;
    this.inProgress = false;
    this.word = [];
    this.keys = {};
    this.history = [];
    this.word = '';
    this.reveal = false;
    this.countdown = 0;
    this.timeLimit = 0;
    this.timeRemaining = 0;
    this.status = 0;
    this.paused = false;
  }

}

// random 5 letter id
const randomID = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let result = '';
  for(var i = 0; i < 5; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

const create = (host) => {
  const id = randomID();
  ROOMS.set(id, new Room(id, host));
  return id;
}

const remove = (room) => {
  ROOM_TIMEOUTS.set(room, setTimeout(() => {
    ROOMS.get(room).stopInterval();
    ROOMS.delete(room);
    ROOM_TIMEOUTS.delete(room);
    console.log('PROCESS: Deleting room', `[${room}]`);
  }, 30000));
}

const get = (room) => {
  return ROOMS.get(room);
}

const print = () => {
  console.log(ROOMS);
}

module.exports = { create, remove, get, print };