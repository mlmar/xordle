import { v4 } from 'uuid';
import ws from 'ws';
import { Server } from 'http';
import * as roomUtil from '../util/RoomUtil';
import type { Settings } from '@xordle/common';

interface AppSocket extends ws.WebSocket {
    id: string;
    name: string;
    room: string;
}

type MessageListener = (socket: AppSocket, payload: any) => void;

const CLIENTS = new Map<string, AppSocket>();
const LISTENERS: Record<string, MessageListener> = {};
const DISCONNECTED_CLIENTS = new Map<string, string>();

const listen = (action: string, func: MessageListener): void => {
    LISTENERS[action] = func;
};

const broadcast = (sockets: string[], action: string, payload: unknown): void => {
    const message = JSON.stringify({ action, payload });
    sockets?.forEach((id) => {
        const client = CLIENTS.get(id);
        if (client) {
            client.send(message);
        } else {
            console.log('ERROR: Client', `[${id}]`, 'does not exist');
        }
    });
};

const to = (socket: AppSocket | undefined, action: string, payload: unknown): void => {
    if (!socket) return;
    const message = JSON.stringify({ action, payload });
    socket.send(message);
};

const handleConnection = (socket: AppSocket): void => {
    const id = v4();
    socket.id = id;
    CLIENTS.set(id, socket);
    to(socket, 'SET_ID', id);
    console.log('STATUS: Client', `[${socket.id}]`, 'connected to server');
};

const handleMessage = (socket: AppSocket, data: ws.RawData): void => {
    const message = JSON.parse(data.toString());
    const { action, payload } = message;
    console.log('MESSAGE:', `[${socket.id}]`, ':', message);
    if (LISTENERS[action]) LISTENERS[action](socket, payload);
};

const handleClose = (socket: AppSocket): void => {
    const { room, id } = socket;
    const roomObj = roomUtil.get(room);
    console.log('STATUS: Client', `[${id}]`, 'disconnected');
    if (roomObj) {
        handleLeave(socket);
        DISCONNECTED_CLIENTS.set(id, room);
    }
};

const handleJoin = (socket: AppSocket, payload: { room: string }): boolean => {
    const { room } = payload;
    const roomObj = roomUtil.get(room);
    if (!roomObj) {
        console.log('STATUS: Room', `[${room}]`, 'does not exist');
        return false;
    }
    socket.room = room;
    roomObj.addUser(socket.id, socket.name);
    roomUtil.print();
    console.log('STATUS: Client', `[${socket.id}]`, 'joined room', `[${payload.room}]`);
    to(socket, 'SETTINGS_UPDATE', roomObj.getSettings());
    broadcast([...roomObj.getActiveUsers()], 'JOIN', roomObj.getData());
    return true;
};

const handleLeave = (socket: AppSocket): void => {
    const { room, id } = socket;
    const roomObj = roomUtil.get(room);
    if (!roomObj) return;
    const users = roomObj.removeUser(id);
    if (users.size === 0) {
        roomObj.pauseInterval();
        roomUtil.remove(room);
        console.log('PROCESS: Starting room timeout for', `[${room}]`);
    } else {
        broadcast([...roomObj.getActiveUsers()], 'UPDATE', roomObj.getData());
    }
};

listen('SET_NAME', (socket, payload) => {
    socket.name = payload.name;
    console.log('NAME: Setting name for socket', `[${socket.id}]`, 'to', payload.name);
});

listen('RECONNECT', (socket, payload) => {
    const { previousID } = payload;
    console.log('RECONNECT: Socket', `[${previousID}]`, 'attempting to connect');
    const room = DISCONNECTED_CLIENTS.get(previousID);
    DISCONNECTED_CLIENTS.delete(previousID);

    const roomObj = roomUtil.get(room!);
    if (roomObj) {
        roomObj.refreshUser(previousID, socket.id);
    }

    to(socket, 'RECONNECT', room);
});

listen('CREATE', (socket) => {
    const room = roomUtil.create(socket.id, socket.name);
    socket.room = room;
    to(socket, 'CREATE', room);
    to(socket, 'SETTINGS_UPDATE', roomUtil.get(room)!.getSettings());
    console.log('PROCESS: Creating room', `[${room}]`);
});

listen('JOIN', handleJoin);

listen('LEAVE', (socket) => {
    handleLeave(socket);
});

listen('VERIFY', (socket, payload) => {
    const { room } = payload;
    if (!roomUtil.get(room)) {
        console.log('ERROR: Room', `[${room}]`, 'does not exist');
        to(socket, 'VERIFY', false);
    } else {
        to(socket, 'VERIFY', room);
    }
});

listen('START', (socket) => {
    const { room } = socket;
    const roomObj = roomUtil.get(room);
    if (!roomObj || socket.id !== roomObj?.host) return;
    roomObj.start();

    if (roomObj.getActiveUsers().length) {
        roomObj.startInterval(() => {
            roomObj.decrementCountdown();
            roomObj.getActiveUsers().forEach((id) => {
                to(CLIENTS.get(id), 'SERVER_UPDATE', {
                    player: roomObj.getPlayerData(id),
                    room: roomObj.getData(),
                });
            });
        }, 1000);
    }

    broadcast([...roomObj.getActiveUsers()], 'SETTINGS_UPDATE', roomObj.getSettings());
    roomObj.getActiveUsers().forEach((id) => {
        to(CLIENTS.get(id), 'SERVER_UPDATE', {
            player: roomObj.getPlayerData(id),
            room: roomObj.getData(),
        });
    });
});

listen('END', (socket) => {
    const { room } = socket;
    const roomObj = roomUtil.get(room);
    if (!roomObj || socket.id !== roomObj?.host) return;
    roomObj.end();
    roomObj.stopInterval();
    broadcast([...roomObj.getActiveUsers()], 'UPDATE', roomObj.getData());
});

listen('SETTINGS_UPDATE', (socket, payload: { settings?: Partial<Settings> }) => {
    const { room } = socket;
    const roomObj = roomUtil.get(room);
    if (!roomObj) return;
    const { settings } = payload;
    if (settings) {
        console.log('SETTINGS: Setting settings for room', `[${room}]`);
        const newSettings = roomObj.setSettings(socket.id, settings);
        broadcast([...roomObj.getActiveUsers()], 'SETTINGS_UPDATE', newSettings);
    }
});

listen('ENTER_WORD', (socket, payload) => {
    const { room } = socket;
    const roomObj = roomUtil.get(room);
    if (!roomObj) return;
    const correct = roomObj.enterWord(socket.id, payload.current);
    broadcast([...roomObj.getActiveUsers()], 'UPDATE', roomObj.getData());
    to(socket, 'PLAYER_UPDATE', { ...roomObj.getPlayerData(socket.id), correct });
});

const init = (server: Server): void => {
    console.log('SERVER: Initializing socket server');
    const wsServer = new ws.Server({ server });
    wsServer.on('connection', (socket) => {
        const appSocket = socket as AppSocket;
        handleConnection(appSocket);

        socket.on('message', (data) => {
            handleMessage(appSocket, data);
        });

        socket.on('close', () => {
            handleClose(appSocket);
        });
    });
};

export default init;
