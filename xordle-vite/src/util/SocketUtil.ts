import { DEV, SOCKET_URL } from './SystemUtil';
import CONSTANTS from './Constants';

interface CustomWebSocket extends WebSocket {
    id: string,
    emit: <T>(action: string, payload?: T) => void, // Action dispatch method to server
    setName: (name: string) => void
}

export let client: CustomWebSocket | null = null;

let pingInterval: NodeJS.Timeout | null = null;

type ActionCallback = (payload: any) => void;

// function that listens for specific action(s) and performs a function on the payload
const listeners = new Map<string, ActionCallback[]>();

const listen = (action: string, func: ActionCallback) => {
    const actions = action.split(' ');
    actions.forEach((action) => {
        action = action.trim();
        if (!listeners.has(action)) {
            listeners.set(action, []);
        }
        listeners.get(action)!.push(func);
    });
};

// function that removes listeners for specific action(s)
const removeListener = (action: string, func: ActionCallback) => {
    const actions = action.split(' ');
    actions.forEach((action) => {
        action = action.trim();
        let functions = listeners.get(action);
        if (functions?.length) {
            functions = functions.filter((listenerFunc) => listenerFunc != func);
            if (functions.length === 0) {
                listeners.delete(action);
            } else {
                listeners.set(action, functions);
            }
        }
    });
};

const init = () => {
    if (client) {
        console.warn('Client already initialized. Removing existing client...');
        client.close();
        if (pingInterval) {
            clearInterval(pingInterval);
            pingInterval = null;
        }
    }

    const pingServer = () => {
        if (client) {
            client.emit('PING');
        }
    };

    listen('PING', () => {
        console.log('Received server ping');
    });

    listen('SET_ID', (id) => {
        if (!client) return;

        client.id = id;
        let previousID = localStorage.getItem('xordle_id');
        if (previousID) {
            console.log('Reconnecting...');
            client.emit('RECONNECT', { previousID });
        }

        let previousName = localStorage.getItem('xordle_name');
        if (previousName) {
            client.setName(previousName);
        }

        localStorage.setItem('xordle_id', id);
        console.log('Socket initialized');
    });

    client = new WebSocket(SOCKET_URL) as CustomWebSocket;

    client.emit = (action, payload) => {
        if (client) {
            client.send(JSON.stringify({ action, payload }));
        } else {
            console.warn('No client found');
        }
    };

    client.setName = (val) => {
        localStorage.setItem('xordle_name', val);
        if (client) {
            client.emit('SET_NAME', { name: val });
        }
    };

    client.addEventListener('message', (event) => {
        const { data } = event;
        const { action, payload } = JSON.parse(data);
        // console.log(action, payload);
        if (listeners.has(action)) {
            if (DEV) {
                console.log('Message from server:', { action, payload });
            }
            listeners.get(action)!.forEach((func) => func(payload));
        }
    });

    client.addEventListener('close', () => {
        console.warn('Client closed. Reconnecting...');
        init();
    });

    pingInterval = setInterval(pingServer, CONSTANTS.PING_DELAY);

    return client;
};

// Close websocket and remove listeners
const destroy = () => {
    if (client) {
        client.close();
        client = null;
        listeners.forEach((_value, key) => listeners.delete(key));
    }
}

const socketUtil = { init, destroy, listen, removeListener };

export default socketUtil;
