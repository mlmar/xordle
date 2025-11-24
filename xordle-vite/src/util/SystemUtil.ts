export const DEV = import.meta.env.DEV;

const LOCAL = 'localhost:3300';
// const LOCAL = '192.168.0.87:3300';
const DEPLOYED = 'xordle-wwnx.onrender.com';

export const SERVER_URL = DEV ? 'http://' + LOCAL : 'https://' + DEPLOYED;
export const SOCKET_URL = DEV ? 'ws://' + LOCAL : 'wss://' + DEPLOYED;