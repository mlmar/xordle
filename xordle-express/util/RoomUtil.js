const WordUtil = require('./WordUtil.js');

const ROOMS = new Map();

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
    this.inProgress = false;
    this.word = '';
    this.reveal = false;
  }

  getData() {
    return {
      id: this.id,
      playerCount: this.users.size,
      turn: this.turn,
      current: this.current,
      keys: this.keys,
      history: this.history,
      inProgress: this.inProgress,
      word: this.reveal ? this.word : '',
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
  }

  removeUser(user) {
    this.users.delete(user);
    return this.users;
  }

  getUsers() {
    return Array.from(this.users);
  }

  setWord(word) {
    this.word = word;
  }

  enterWord() {
    const found = WordUtil.findWord(this.current.join(''));

    if(this.current.length < 5) {
      this.current = [];
      console.log("Too short");
      return true;
    } else if(!found) {
      this.current = [];
      console.log("Not a word");
      return true;
    }

    const getStatus = (l, i) => {
      if(this.word[i] === l) {
        return 1;
      } else if(this.word.includes(l)) {
        return 2;
      } else {
        return 0;
      }
    }

    const newWord = this.current.map((letter, i) => {
      const status = getStatus(letter, i);

      this.keys[letter] = Math.max((this.keys[letter] || 0), status);

      return {
        letter: letter.toUpperCase(),
        status: status,
      }
    });

    this.history.push(newWord);

    if(this.current.join('') === this.word) {
      this.turn = null;
      this.reveal = true;
    }
    this.current = [];

    return this.turn === null;
  }

  pressLetter(letter) {
    if((/^[a-zA-Z]$/.test(letter))) {
      this.current = this.current.length < 5 ? [...this.current, letter.toUpperCase()] : this.current;
    }
  }

  removeLetter() {
    this.current.pop();
  }

  nextTurn() {
    if(++this.turnIndex >= this.users.size) {
      this.turnIndex = 0;
    }
    this.turn = Array.from(this.users)[this.turnIndex];
    this.current = [];
  }

  startInterval(callback, time) {
    if(this.interval) return;
    this.interval = setInterval(() => {
      callback();
    }, time);
  }

  stopInterval() {
    if(!this.interval) return;
    clearInterval(this.interval);
  }

  start() {
    if(this.inProgress) return;
    this.turnIndex = Math.floor(Math.random() * this.users.size);
    this.turn = Array.from(this.users)[this.turnIndex];
    this.inProgress = true;
    this.word = WordUtil.getRandomWord();
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
  ROOMS.delete(room);
}



const get = (room) => {
  return ROOMS.get(room);
}

const print = () => {
  console.log(ROOMS);
}

module.exports = { create, remove, get, print };