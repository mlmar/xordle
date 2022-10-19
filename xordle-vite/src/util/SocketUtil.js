import { DEV, SOCKET_URL } from './SystemUtil';
import CONSTANTS from './Constants.jsx';

export let client = null;

let pingInterval = null;

// function that listens for a specific action and performs a function on the payload
const LISTENERS = {};
const listen = (action, func) => action.split(' ').forEach(a => LISTENERS[a] = ((payload) => {
  if(DEV) {
    console.log({ action, payload });
  }
  func(payload);
}));

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
    let previousID = localStorage.getItem('xordle_id');
    if(previousID) {
      console.log('Reconnecting...');
      client.emit('RECONNECT', { previousID });
    }
    
    let previousName = localStorage.getItem('xordle_name');
    if(previousName) {
      client.setName(previousName);
    }

    localStorage.setItem('xordle_id', id);
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

  client.setName = (val) => {
    localStorage.setItem('xordle_name', val);
    client.emit('SET_NAME', { name: val });
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