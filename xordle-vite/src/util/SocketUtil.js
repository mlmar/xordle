import { SOCKET_URL } from './SystemUtil';
import CONSTANTS from './Constants.jsx';

export let client = null;
let previousID = null;

let pingInterval = null;

// function that listens for a specific action and performs a function on the payload
const LISTENERS = {};
const listen = (action, func) => action.split(' ').forEach(a => LISTENERS[a] = func);

const init = () => {
  if(client) {
    console.warn('Client already initialized. Removing existing client...');
    client.close();
    clearInterval(pingInterval);
    pingInterval = null;
  }

  const pingServer = () => {
    client.emit('PING');
  }

  listen('PING', () => {
    console.log('Received server ping');
  });

  listen('SET_ID', (id) => {
    if(!client) return;

    client.id = id;

    if(previousID) {
      console.log('Reconnecting...');
      client.emit('RECONNECT', { previousID });
    }
      
    previousID = id;

    console.log('Socket initialized');

  });

  client = new WebSocket(SOCKET_URL);

  client.emit = (action, payload) => {
    if(client) {
      client.send(JSON.stringify({ action, payload }));
    } else {
      console.warn('No client found');
    }
  }
  
  client.addEventListener('message', (event) => {
    const { data } = event;
    const { action, payload } = JSON.parse(data);
    // console.log(action, payload);
    if(LISTENERS[action]) LISTENERS[action](payload);
  });

  client.addEventListener('close', () => {
    console.warn('Client closed. Reconnecting...');
    init();
  });

  pingInterval = setInterval(pingServer, CONSTANTS.PING_DELAY);

  return client;
}

const socketUtil = { init, listen }

export default socketUtil;