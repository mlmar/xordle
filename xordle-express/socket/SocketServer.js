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
    CLIENTS.get(id).send(message);
  });
}

// broadcast to a specific socket
const to = (socket, action, payload) => {
  const message = JSON.stringify({ action, payload });
  socket.send(message);
}


const handleConnection = (socket) => {
  const id = v4();
  socket.id = id;
  CLIENTS.set(id, socket);
  console.log('Client',`[${socket.id}]`, 'connected to server');
}

const handleMessage = (socket, data) => {
  const message = JSON.parse(data);
  const { action, payload } = message;
  console.log('Message from client', `[${socket.id}]`, ':', message);
  if(LISTENERS[action]) LISTENERS[action](socket, payload);
}

const handleClose = (socket) => {
  const { room, id } = socket;
  console.log('Client', `[${id}]`, 'disconnected');
  if(roomUtil.get(room)) {
    const users = roomUtil.get(room).removeUser(id);
    if(users.size === 0) roomUtil.remove(room);
  console.log('Deleting empty room', `[${room}]`);
  }
}



/*** message listeners ***/

listen('CREATE', (socket) => {
  const room = roomUtil.create(socket.id);
  socket.room = room;
  to(socket, 'CREATE', room);
  console.log(`Creating room [${room}]`);
});

listen('JOIN', (socket, payload) => {
  const { room } = payload;
  const roomObj = roomUtil.get(room);
  if(!roomObj) return;
  socket.room = room;
  roomObj.addUser(socket.id);
  roomUtil.print();
  console.log("Client", `[${socket.id}]`, "joined room", `[${payload.room}]`)
  broadcast([...roomObj.getUsers()], 'JOIN', roomObj.getData());
});

/*
  socket event initialization function
    - {server}  : express server to attach to
    - reads all incoming connections, messages and closes connections
*/
const init = (server) => {
  console.log("Initializing socket server");
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