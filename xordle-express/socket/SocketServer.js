const { v4 } = require('uuid');
const ws = require('ws');
const roomUtil = require('../util/RoomUtil.js');



/*** socket management ***/

const CLIENTS = new Map();
const LISTENERS = {};
const listen = (action, func) => LISTENERS[action] = func;

// broadcasts to all users in an array
const broadcast = (sockets, action, payload) => {
  const message = JSON.stringify({ action, payload });
  sockets?.forEach((id) => {
    const client = CLIENTS.get(id);
    if(client) {
      client.send(message);
    } else {
      console.log('ERROR: Client',`[${id}]`, 'does not exist');
    }
  });
}

// broadcast to a specific socket
const to = (socket, action, payload) => {
  const message = JSON.stringify({ action, payload });
  socket.send(message);
}


// assign socket id and return it
const handleConnection = (socket) => {
  const id = v4();
  socket.id = id;
  CLIENTS.set(id, socket);
  to(socket, 'SET_ID', id);
  console.log('STATUS: Client',`[${socket.id}]`, 'connected to server');
}

// redirects all socket messages to listeners
const handleMessage = (socket, data) => {
  const message = JSON.parse(data);
  const { action, payload } = message;
  console.log('MESSAGE:', `[${socket.id}]`, ':', message);
  if(LISTENERS[action]) LISTENERS[action](socket, payload);
}

// clears any empty rooms on disconnect  on disconnect
const handleClose = (socket) => {
  const { room, id } = socket;
  const roomObj = roomUtil.get(room);
  console.log('STATUS: Client', `[${id}]`, 'disconnected');
  if(roomObj) {
    const users = roomObj.removeUser(id);
    if(users.size === 0) {
      roomObj.stopInterval();
      roomUtil.remove(room);
      console.log('PROCESS: Deleting empty room', `[${room}]`);
    }
    broadcast([...roomObj.getUsers()], 'UPDATE', roomObj.getData());
  }
}



/*** message listeners ***/

listen('PING', (socket) => {
  to(socket, 'PING');
});

listen('CREATE', (socket) => {
  const room = roomUtil.create(socket.id);
  socket.room = room;
  to(socket, 'CREATE', room);
  console.log('PROCESS: Creating room',`[${room}]`);
});


listen('JOIN', (socket, payload) => {
  const { room } = payload;
  const roomObj = roomUtil.get(room);
  if(!roomObj) {
    console.log('ERROR',`[${room}]`,'does not exist');
    return;
  }
  socket.room = room;
  roomObj.addUser(socket.id);
  roomUtil.print();
  console.log('STATUS: Client', `[${socket.id}]`, 'joined room', `[${payload.room}]`)
  broadcast([...roomObj.getUsers()], 'JOIN', roomObj.getData());
});

listen('VERIFY', (socket, payload) => {
  const { room } = payload;
  if(!roomUtil.get(room)) {
    console.log('ERROR: Room', `[${room}]`, 'does not exist');
    to(socket, 'VERIFY', false);
  } else {
    to(socket, 'VERIFY', room);
  }
});

listen('START', (socket) => {
  const { room } = socket;
  const roomObj = roomUtil.get(room);
  if(!roomObj || socket.id !== roomObj?.host) return;
  roomObj.start()

  if(roomObj.getUsers().length > 1) {
    roomObj.startInterval(() => {
    const countdownRes = roomObj.setCountdown(countdown => countdown - 1);
    if(countdownRes === 0) {
      roomObj.resetCountdown();
      roomObj.nextTurn();
    }
    broadcast([...roomObj.getUsers()], 'UPDATE', roomObj.getData());
  }, 1000);
  }

  broadcast([...roomObj.getUsers()], 'UPDATE', roomObj.getData());
});

listen('END', (socket) => {
  const { room } = socket;
  const roomObj = roomUtil.get(room);
  if(!roomObj || socket.id !== roomObj?.host) return;
  roomObj.end();
  roomObj.stopInterval();
  broadcast([...roomObj.getUsers()], 'UPDATE', roomObj.getData());
})

listen('SET_CURRENT', (socket, payload) => {
  const { room } = socket;
  const roomObj = roomUtil.get(room);
  if(!roomObj || socket.id !== roomObj?.turn) return;
  roomObj.setCurrent(payload.current);
  broadcast([...roomObj.getUsers()], 'UPDATE', roomObj.getData());
});

listen('ENTER_WORD', (socket) => {
  const { room } = socket;
  const roomObj = roomUtil.get(room);
  if(!roomObj || socket.id !== roomObj?.turn) return;
  if(!roomObj.enterWord()) {
    roomObj.nextTurn();
    roomObj.resetCountdown();
  }
  broadcast([...roomObj.getUsers()], 'UPDATE', roomObj.getData());
  roomObj.setStatus(0);
});

/*
  socket event initialization function
    - {server}  : express server to attach to
    - reads all incoming connections, messages and closes connections
*/
const init = (server) => {
  console.log('SERVER: Initializing socket server');
  const wsServer = new ws.Server({ server });
  wsServer.on('connection', (socket) => {
    handleConnection(socket);
    
    socket.on('message', (data) => {
      handleMessage(socket, data);
    });
    
    socket.on('close', () => {
      handleClose(socket);
    });
  });
}


module.exports = init;