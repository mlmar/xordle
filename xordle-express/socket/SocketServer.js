const { v4 } = require('uuid');
const ws = require('ws');
const roomUtil = require('../util/RoomUtil.js');



/*** socket management ***/

const CLIENTS = new Map();
const LISTENERS = {};
const listen = (action, func) => LISTENERS[action] = func;
const DISCONNECTED_CLIENTS = new Map();


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
    handleLeave(socket)
    DISCONNECTED_CLIENTS.set(id, room);
  }
}




/*** specific message handlers  ***/

const handleJoin = (socket, payload) => {
  const { room } = payload;
  const roomObj = roomUtil.get(room);
  if(!roomObj) {
    console.log('STATUS: Room',`[${room}]`,'does not exist');
    return false;
  }
  socket.room = room;
  roomObj.addUser(socket.id, socket.name);
  roomUtil.print();
  console.log('STATUS: Client', `[${socket.id}]`, 'joined room', `[${payload.room}]`)
  broadcast([...roomObj.getUsers()], 'JOIN', roomObj.getData());
  return true;
}

const handleLeave = (socket) => {
  const { room, id } = socket;
  const roomObj = roomUtil.get(room);
  if(!roomObj) return;
  const users = roomObj.removeUser(id);
  if(users.size === 0) {
    roomObj.pauseInterval();
    roomUtil.remove(room);
    console.log('PROCESS: Starting room timeout for', `[${room}]`);
  } else {
    broadcast([...roomObj.getUsers()], 'UPDATE', roomObj.getData());
  }
}



/*** message listeners ***/

listen('PING', (socket) => {
  to(socket, 'PING');
});

listen('NAME', (socket, payload) => {
  socket.name = payload.name;
  console.log('NAME: Setting name for socket',`[${socket.id}]`, 'to', payload.name);
});

listen('RECONNECT', (socket, payload) => {
  const { previousID } = payload;
  console.log('RECONNECT: Socket',`[${previousID}]`,'attempting to connect');
  const room = DISCONNECTED_CLIENTS.get(previousID);
  const success = handleJoin(socket, { room })
  DISCONNECTED_CLIENTS.delete(previousID);
  
  to(socket, 'RECONNECT', success);
});

listen('CREATE', (socket) => {
  const room = roomUtil.create(socket.id, socket.name);
  socket.room = room;
  to(socket, 'CREATE', room);
  console.log('PROCESS: Creating room',`[${room}]`);
});

listen('JOIN', handleJoin);

listen('LEAVE', (socket) => {
  handleLeave(socket)
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

  if(roomObj.getUsers().length) { // delegate this code to util later on
    roomObj.startInterval(() => {
      roomObj.decrementCountdown();
      roomObj.getUsers().forEach(id => {
        to(CLIENTS.get(id), 'PLAYER_UPDATE', roomObj.getPlayerData(id));
      })
      broadcast([...roomObj.getUsers()], 'UPDATE', roomObj.getData());
    }, 1000);
  }

  broadcast([...roomObj.getUsers()], 'UPDATE', roomObj.getData());
  broadcast([...roomObj.getUsers()], 'PLAYER_UPDATE', roomObj.getDefaultPlayerData());
});

listen('END', (socket) => {
  const { room } = socket;
  const roomObj = roomUtil.get(room);
  if(!roomObj || socket.id !== roomObj?.host) return;
  roomObj.end();
  roomObj.stopInterval();
  broadcast([...roomObj.getUsers()], 'UPDATE', roomObj.getData());
})

listen('ENTER_WORD', (socket, payload) => {
  const { room } = socket;
  const roomObj = roomUtil.get(room);
  if(!roomObj) return;
  roomObj.enterWord(socket.id, payload.current);
  broadcast([...roomObj.getUsers()], 'UPDATE', roomObj.getData());
  to(socket, 'PLAYER_UPDATE', roomObj.getPlayerData(socket.id));
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