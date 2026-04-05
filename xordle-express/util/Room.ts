import Player from './Player';
import type { RoomData, PlayerData } from '@xordle/common';

const generateName = (users: Set<string>, name?: string): string =>
    name || 'PLAYER ' + users.size;

export type { RoomData };

class Room {
    id: string;
    host: string;
    users: Set<string>;
    players: Map<string, Player>;
    inactivePlayers: Map<string, Player>;
    interval: ReturnType<typeof setInterval> | null;
    paused: boolean;
    protected inProgress: boolean;
    status: number;
    message: string;
    protected _onClearTimeout: ((id: string) => boolean) | null;

    constructor(
        id: string,
        host: string,
        hostName?: string,
        onClearTimeout: ((id: string) => boolean) | null = null,
    ) {
        this.id = id;
        this.host = host;
        this.users = new Set([host]);
        this.players = new Map<string, Player>().set(
            host,
            new Player(host, generateName(this.users, hostName)),
        );
        this.inactivePlayers = new Map<string, Player>();
        this.interval = null;
        this.paused = false;
        this.inProgress = false;
        this.status = 0;
        this.message = '';
        this._onClearTimeout = onClearTimeout;
    }

    getData(): RoomData {
        return {
            host: this.host,
            id: this.id,
            playerCount: this.users.size,
            status: this.status,
            message: this.message,
        };
    }

    getPlayerData(id: string): ReturnType<Player['getData']> | undefined {
        return this.players.get(id)?.getData();
    }

    getDefaultPlayerData(): ReturnType<typeof Player.getDefaultData> {
        return Player.getDefaultData();
    }

    getID(): string {
        return this.id;
    }

    getHost(): string {
        return this.host;
    }

    addUser(user: string, name?: string): void {
        this.users.add(user);
        this.players.set(
            user,
            this.inactivePlayers.get(user) || new Player(user, generateName(this.users, name)),
        );
        this.inactivePlayers.delete(user);
        if (this.inProgress) {
            this.players.get(user)!.start();
        }
        if (this._onClearTimeout?.(this.id)) {
            this.host = user;
            this.unpauseInterval();
        }
    }

    removeUser(user: string): Set<string> {
        this.users.delete(user);
        this.inactivePlayers.set(user, this.players.get(user)!);
        this.players.delete(user);

        if (this.host === user && this.users.size > 0) {
            this.host = Array.from(this.users)[0];
            console.log('PROCESS: Picking', `[${this.host}]`, 'as new host for', `[${this.id}]`);
        }

        return this.users;
    }

    refreshUser(previousID: string, currentID: string): void {
        const player = this.inactivePlayers.get(previousID);
        if (player) {
            player.setID(currentID);
            this.inactivePlayers.set(currentID, player);
            this.inactivePlayers.delete(previousID);
        }
    }

    getUsers(): string[] {
        return Array.from(this.users);
    }

    getActiveUsers(): string[] {
        return Array.from(this.users).filter((user) => this.players.get(user));
    }

    startInterval(callback: () => void, time: number): void {
        if (this.interval) return;
        this.interval = setInterval(() => {
            if (!this.paused) callback();
        }, time);
    }

    stopInterval(): void {
        if (!this.interval) return;
        clearInterval(this.interval);
        this.interval = null;
    }

    pauseInterval(): void {
        this.paused = true;
        console.log('PROCESS: Pausing interval for', `[${this.id}]`);
    }

    unpauseInterval(): void {
        this.paused = false;
        console.log('PROCESS: Unpausing interval for', `[${this.id}]`);
    }
}

export default Room;
