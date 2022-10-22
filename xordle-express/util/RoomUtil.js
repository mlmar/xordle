const WordUtil = require('./WordUtil.js');
const Player = require('./Player.js');

// ROOM CONSTANTS
const ROOMS = new Map();
const ROOM_TIMEOUTS = new Map();
const TIME_TO_REMOVE_ROOM = 60000;

// SETTINGS CONSTANTS
const SETTINGS_IDS = {
  STOP_AT_FIRST_WINNER: 'STOP AT FIRST WINNER',
  WIN_BY_LEAST_ATTEMPTS: 'WIN BY LEAST ATTEMPTS',
  GUESS_TIMER: 'GUESS TIMER',
  GAME_TIMER: 'GAME TIMER',
  SIX_ATTEMPTS: 'SIX ATTEMPTS',
  CHAIN: 'CHAIN',
}
const SETTINGS = {
  [SETTINGS_IDS.STOP_AT_FIRST_WINNER]: false,
  [SETTINGS_IDS.WIN_BY_LEAST_ATTEMPTS]: false,
  [SETTINGS_IDS.GUESS_TIMER]: true,
  [SETTINGS_IDS.GAME_TIMER]: true,
  [SETTINGS_IDS.SIX_ATTEMPTS]: false,
  [SETTINGS_IDS.CHAIN]: false,
}

// NUMBER CONSTANTS
const TIME_LIMIT = 120;
const MAX_ATTEMPTS = 6;

class Room {
  constructor(id, host, hostName) {
    this.id = id; // room id
    this.host = host; // host id
    this.users = new Set([host]); // user ids set
    this.players = new Map().set(host, new Player(host, generateName(this.users, hostName))); // players set
    this.inactivePlayers = new Map(); // disconnected players moved here

    this.interval = null; // room interval
    this.paused = false; // interval will not run when game is paused
    
    this.prevWord = ''; // previous word
    this.word = ''; // current word
    
    this.winOrder = []; // player win order { id, name, attempts }
    this.status = 0; // 0 = lobby, 1 = in progress, 2 = finished
    this.message = ''; // generic text message
    
    this.countdown = TIME_LIMIT; // if setting is on -- seconds per guess before removing oldest word
    this.maxAttempts = MAX_ATTEMPTS; // if setting is on -- attempts per guess before stopping user

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

  /**
   * @param {String} id
   * @param {Object} settings 
   * @returns 
   */
  setSettings(id, settings) {
    if(this.host === id) {
      this.settings = { ...this.settings, ...settings };
    }
    return this.settings;
  }

  // Returns active player by player id
  getPlayerData(id) {
    return this.players.get(id)?.getData();
  }

  // Generic player data
  getDefaultPlayerData() {
    return Player.getDefaultData();
  }

  // Returns room id
  getID() {
    return this.id();
  }

  // Returns host id
  getHost() {
    return this.host;
  }

  /**
   * Adds a user to the room
   *  - If user was an inactive player then reuse previous player object
   *  - Otherwise create nwe player
   * @param {String} user -- id
   * @param {String} name -- name
   */
  addUser(user, name) {
    this.users.add(user);
    this.players.set(user, this.inactivePlayers.get(user) || new Player(user, generateName(this.users, name)));
    this.inactivePlayers.delete(user);
    if(this.inProgress) { // if game is in progress, attempt to start the player
      this.players.get(user).start();
    }
    const roomTimeout = ROOM_TIMEOUTS.get(this.id);
    if(roomTimeout) { // if room is being timed out, reactivate it 
      clearTimeout(roomTimeout);
      console.log('PROCESS: Clearing room timeout for', `[${this.id}]`);
      this.host = user; // set only user as host
      this.unpauseInterval();
    }
  }

  /**
   * Removes a user from the room
   *  - If user is the host, set a new host
   * @param {String} user 
   * @returns new set of users
   */
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

  /**
   * If user is reconnecting to room
   *  - Get inactive player object
   *  - Set player id to current id
   * @param {*} previousID 
   * @param {*} currentID 
   */
  refreshUser(previousID, currentID) {
    const player = this.inactivePlayers.get(previousID);
    if(player) {
      player.setID(currentID);
      this.inactivePlayers.set(currentID, player);
      this.inactivePlayers.delete(previousID);

      // Replace old id in win order with new id
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

  /**
   * 
   * @param {String} id -- socket id
   * @param {Array} currentWord -- user's input word in array form
   * @returns 
   */
  enterWord(id, currentWord) {
    const player = this.players.get(id);
    if(!player) {
      return;
    }

    const correct = player.enterWord(currentWord, this.word);
    if(correct) {
      // If word is correct, add user to winners
      this.winOrder.push({
        id: id,
        name: player.getName(),
        attempts: player.getAttempts()
      });
      let rank = this.winOrder.length;
      if(this.settings[SETTINGS_IDS.WIN_BY_LEAST_ATTEMPTS]) {
        this.winOrder = this.winOrder.sort((a, b) => a.attempts - b.attempts);
        rank = this.winOrder.findIndex(p => p.id === id) + 1;
      }
      this.message = '#' + rank + ' - ' + player.getName();
    } else {
      if(this.settings[SETTINGS_IDS.SIX_ATTEMPTS] && player.getAttempts() >= this.maxAttempts) {
        // If setting is enabled -- user only gets 6 attempts before they're stopped
        player.setInProgress(false);
      }
    }

    if(this.settings[SETTINGS_IDS.STOP_AT_FIRST_WINNER]) {
      // If setting is enabled -- only one winner is allowed
      if(correct) {
        this.status = 2;
      }
    } else if(this.settings[SETTINGS_IDS.SIX_ATTEMPTS]) {
      // if all players have finished or used their attempts then stop the game
      const inProgress = this.checkIfPlayersInProgress();
      if(!inProgress) { 
        this.status = 2;
      }
    }else {
      // Otherwise check if there are less winners than players
      if(this.winOrder.length < this.players.size) {
        this.status = 1;
      } else {
        this.status = 2;
      }
    }

    return correct;
  }

  checkIfPlayersInProgress() {
    let inProgress = false;
    this.players.forEach(player => {
      if(player.inProgress) {
        inProgress = true;
      }
    })
    return inProgress;
  }

  decrementCountdown() {
    if(this.status === 1) { // while game is in progress
      if(this.settings[SETTINGS_IDS.GUESS_TIMER]) {
        // if setting is enabled -- decrement user's guess timer by 1 (removes oldest word)
        this.players.forEach(player => player.setCountdown(c => c - 1));
      }
      if(this.settings[SETTINGS_IDS.GAME_TIMER]) {
        // if setting is enabled -- decrement game countdown by 1
        this.setCountdown(c => c - 1);

        // End game when countdown is equal to 0
        if(this.countdown === 0) {
          this.status = 2;
        }
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
    this.players.forEach(player => {
      player?.start();
    });

    this.word = WordUtil.getRandomWord();
    this.status = 1;
    this.paused = false;
    this.winOrder = [];
    this.message = '';
    this.resetCountdown();

    if(this.settings[SETTINGS_IDS.CHAIN] && this.prevWord.length) {
      console.log('PREV:',this.prevWord);
      this.players.forEach(player => {
        player?.enterWord(this.prevWord.split(''), this.word);
      });
    }

    // this.word = 'SPACE';
    console.log('WORD:', this.word);
  }
  
  end() {
    this.turn = null;
    this.players.forEach(player => player?.reset());
    this.inactivePlayers.forEach(player => player?.reset());
    this.prevWord = this.word;
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
  }, TIME_TO_REMOVE_ROOM));
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