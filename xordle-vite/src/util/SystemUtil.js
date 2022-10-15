const DEV = false;

const LOCAL = 'localhost:3300';
// const LOCAL = '192.168.0.87:3300';
const DEPLOYED = 'xordle.herokuapp.com';

export const SERVER_URL = DEV ? 'http://' + LOCAL : 'https://' + DEPLOYED;
export const SOCKET_URL = DsEV ? 'ws://' + LOCAL : 'wss://' + DEPLOYED;