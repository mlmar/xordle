const WordUtil = require('./WordUtil.js');
const Player = require('./Player.js');

const ROOMS = new Map();
const ROOM_TIMEOUTS = new Map();
const SETTINGS = {
  'STOP AT FIRST WINNER': false,
  'GUESS TIMER': true,
  'GAME TIMER': true,
}

const TIME_LIMIT = 120;

class Room {
  constructor(id, host, hostName) {
    this.id = id;
    this.host = host;
    this.users = new Set([host]);
    this.players = new Map().set(host, new Player(host, generateName(this.users, hostName)));
    this.inactivePlayers = new Map();

    this.interval = null;
    this.word = '';
    this.winOrder = [];

    this.status = 0;
    this.paused = false;
    this.message = '';
    
    this.countdown = TIME_LIMIT;

    this.settings = SETTINGS;
  }

  getData() {
    return {
      host: this.host,
      id: this.id,
      playerCount: this.users.size,
      status: this.status,
      word: this.status === 2 ? this.word : null,
      winOrder: this.winOrder,
      message: this.message,
      timeRemaining: this.countdown
    }
  }
  
  getSettings() {
    return this.settings;
  }

  setSettings(id, settings) {
    if(this.host === id) {
      this.settings = { ...this.settings, ...settings };
    }
    return this.settings;
  }

  getPlayerData(id) {
    return this.players.get(id)?.getData();
  }

  getDefaultPlayerData() {
    return Player.getDefaultData();
  }

  getID() {
    return this.id();
  }

  getHost() {
    return this.host;
  }

  addUser(user, name) {
    this.users.add(user);
    this.players.set(user, this.inactivePlayers.get(user) || new Player(user, generateName(this.users, name)));
    this.inactivePlayers.delete(user);
    if(this.inProgress) {
      this.players.get(user).start();
    }
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

    this.inactivePlayers.set(user, this.players.get(user));
    this.players.delete(user);

    if(this.host === user && this.users.size > 0) {
      this.host = Array.from(this.users)[0];
      console.log('PROCESS: Picking', `[${this.host}]`, 'as new host for', `[${this.id}]`);
    }

    return this.users;
  }

  refreshUser(previousID, currentID) {
    const player = this.inactivePlayers.get(previousID);
    if(player) {
      player.setID(currentID);
      this.inactivePlayers.set(currentID, player);
      this.inactivePlayers.delete(previousID);

      this.winOrder = this.winOrder.map((item) => {
        return {
          id: item.id.replace(previousID, currentID),
          ...item
        }
      })
    }
  }

  getUsers() {
    return Array.from(this.users);
  }

  getActiveUsers() {
    return Array.from(this.users).filter((user) => this.players.get(user));
  }

  setWord(word) {
    this.word = word;
  }

  enterWord(id, currentWord) {
    const correct = this.players.get(id)?.enterWord(currentWord, this.word);
    if(correct) {
      this.winOrder.push({
        id: id,
        name: this.players.get(id).getName()
      });
      this.message = '#' + this.winOrder.length + ' - ' + this.players.get(id)?.getName();
    }

    if(this.settings['STOP AT FIRST WINNER'] && correct) {
      this.status = 2;
    } else {
      if(this.winOrder.length < this.players.size) {
        this.status = 1;
      } else {
        this.status = 2;
      }
    }

    return correct;
  }

  decrementCountdown() {
    if(this.status === 1) {
      if(this.settings['GUESS TIMER']) {
        this.players.forEach(player => player.setCountdown(c => c - 1));
      }
      if(this.settings['GAME TIMER']) {
        this.setCountdown(c => c - 1);
      }
    }
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
      this.status = 2;
    }
  }

  resetCountdown() {
    this.countdown = TIME_LIMIT;
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
    if(this.status > 0) return;
    this.inProgress = true;
    this.players.forEach(player => player?.start());
    this.word = WordUtil.getRandomWord();
    this.status = 1;
    this.paused = false;
    this.winOrder = [];
    this.message = '';
    this.resetCountdown();
    // this.word = 'SPACE';
    console.log('WORD:', this.word);
  }
  
  end() {
    this.turn = null;
    this.word = [];
    this.players.forEach(player => player?.reset());
    this.inactivePlayers.forEach(player => player?.reset());
    this.word = '';
    this.status = 0;
    this.paused = false;
    this.winOrder = [];
    this.message = '';
    this.resetCountdown();
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

const create = (host, hostName) => {
  const id = randomID();
  ROOMS.set(id, new Room(id, host, hostName));
  return id;
}

const remove = (room) => {
  ROOM_TIMEOUTS.set(room, setTimeout(() => {
    if(!ROOMS.get(room)) return;
    ROOMS.get(room).stopInterval();
    ROOMS.delete(room);
    ROOM_TIMEOUTS.delete(room);
    console.log('PROCESS: Deleting room', `[${room}]`);
  }, 60000));
}

const get = (room) => {
  return ROOMS.get(room);
}

const print = () => {
  console.log(ROOMS);
}

const generateName = (users, name) => {
  return (name || 'PLAYER ' + (users.size));
}

module.exports = { create, remove, get, print };