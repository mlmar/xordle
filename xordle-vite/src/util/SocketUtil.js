import { SOCKET_URL } from './SystemUtil';

export let client = null;

// function that listens for a specific action and performs a function on the payload
const LISTENERS = {};
const listen = (action, func) => LISTENERS[action] = func;

const init = () => {
  if(client) {
    console.warn("Socket already iniitialized")
    return;
  }

  listen('SET_ID', (id) => {
    if(client) client.id = id;
    console.log("Socket Initialized")
  })
  

  client = new WebSocket(SOCKET_URL);
  
  client.emit = (action, payload) => {
    client.send(JSON.stringify({ action, payload }));
  }
  
  client.addEventListener('message', (event) => {
    const { data } = event;
    const { action, payload } = JSON.parse(data);
    // console.log(action, payload);
    if(LISTENERS[action]) LISTENERS[action](payload);
  });

  return client;
}


const socketUtil = { init, listen }

export default socketUtil;