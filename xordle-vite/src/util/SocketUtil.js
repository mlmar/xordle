import { SOCKET_URL, SERVER_URL } from './SystemUtil';
import CONSTANTS from './Constants.jsx';

export let client = null;

// function that listens for a specific action and performs a function on the payload
const LISTENERS = {};
const listen = (action, func) => action.split(' ').forEach(a => LISTENERS[a] = func);

const pingServer = () => {
  fetch(SERVER_URL + '/ping');
  client.emit('PING');
}

const init = () => {
  const id = client?.id;
  const room = client?.room;

  if(client) {
    console.warn('Client already iniitialized. Removing existing client...');
    client.close();
  }

  listen('PING PONG', () => {
    console.log('Received server ping');
  });

  listen('SET_ID', (id) => {
    if(client) client.id = id;
    console.log('Socket initialized')
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

  client.addEventListener('close', (event) => {
    console.warn('Client closed. Reconnecting...');
    setTimeout(() => {
      init();
    }, 1000);
  });

  setInterval(pingServer, CONSTANTS.PING_DELAY);

  return client;
}

const socketUtil = { init, listen }

export default socketUtil;