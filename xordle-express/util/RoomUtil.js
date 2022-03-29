const ROOMS = new Map();

class Room {
  constructor(id, host) {
    this.id = id;
    this.host = host;
    this.users = new Set([host]);
    this.interval = null;
  }

  getData() {
    return {
      id: this.id,
      playerCount: this.users.size,
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

}

// random 5 letter id
const randomID = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
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