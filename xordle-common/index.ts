// A single letter cell as stored in player history
export interface LetterData {
    letter: string;
    status: number;
}

// Player state sent from server to client
export interface PlayerData {
    id: string;
    name: string;
    keys: Record<string, number>;
    history: LetterData[][];
    inProgress: boolean;
    timeRemaining: number;
    attempts: number;
}

// A single entry in the win order list
export interface WinEntry {
    id: string;
    name: string;
    attempts: number;
}

// Base room state shared between lobby and game
export interface RoomData {
    host: string;
    id: string;
    playerCount: number;
    status: number;
    message: string;
}

// Full room state including game-specific fields
export interface XordleRoomData extends RoomData {
    word: string | null;
    winOrder: WinEntry[];
    timeRemaining: number;
}

// Key-value settings map
export type Settings = Record<string, boolean>;
