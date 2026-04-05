import XordleRoom from './XordleRoom';

const ROOMS = new Map<string, XordleRoom>();
const ROOM_TIMEOUTS = new Map<string, ReturnType<typeof setTimeout>>();
const TIME_TO_REMOVE_ROOM = 60000;

const clearRoomTimeout = (roomId: string): boolean => {
    const roomTimeout = ROOM_TIMEOUTS.get(roomId);
    if (roomTimeout) {
        clearTimeout(roomTimeout);
        console.log('PROCESS: Clearing room timeout for', `[${roomId}]`);
        return true;
    }
    return false;
};

const randomID = (): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let result = '';
    for (let i = 0; i < 5; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
};

export const create = (host: string, hostName?: string): string => {
    const id = randomID();
    ROOMS.set(id, new XordleRoom(id, host, hostName, clearRoomTimeout));
    return id;
};

export const remove = (room: string): void => {
    ROOM_TIMEOUTS.set(
        room,
        setTimeout(() => {
            if (!ROOMS.get(room)) return;
            ROOMS.get(room)!.stopInterval();
            ROOMS.delete(room);
            ROOM_TIMEOUTS.delete(room);
            console.log('PROCESS: Deleting room', `[${room}]`);
        }, TIME_TO_REMOVE_ROOM),
    );
};

export const get = (room: string): XordleRoom | undefined => {
    return ROOMS.get(room);
};

export const print = (): void => {
    console.log(ROOMS);
};
