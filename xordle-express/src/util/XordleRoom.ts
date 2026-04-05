import Room from './Room';
import * as WordUtil from './WordUtil';
import type { WinEntry, Settings } from '@xordle/common';

const SETTINGS_IDS = {
    STOP_AT_FIRST_WINNER: 'STOP AT FIRST WINNER',
    WIN_BY_LEAST_ATTEMPTS: 'WIN BY LEAST ATTEMPTS',
    GUESS_TIMER: 'GUESS TIMER',
    GAME_TIMER: 'GAME TIMER',
    SIX_ATTEMPTS: 'SIX ATTEMPTS',
    CHAIN: 'CHAIN',
} as const;

type SettingsKey = (typeof SETTINGS_IDS)[keyof typeof SETTINGS_IDS];

const SETTINGS: Record<SettingsKey, boolean> = {
    [SETTINGS_IDS.STOP_AT_FIRST_WINNER]: true,
    [SETTINGS_IDS.GUESS_TIMER]: false,
    [SETTINGS_IDS.GAME_TIMER]: true,
    [SETTINGS_IDS.WIN_BY_LEAST_ATTEMPTS]: false,
    [SETTINGS_IDS.SIX_ATTEMPTS]: false,
    [SETTINGS_IDS.CHAIN]: false,
};

const TIME_LIMIT = 120;
const MAX_ATTEMPTS = 6;

class XordleRoom extends Room {
    prevWord: string;
    word: string;
    winOrder: WinEntry[];
    countdown: number;
    maxAttempts: number;
    settings: Settings;

    constructor(
        id: string,
        host: string,
        hostName?: string,
        onClearTimeout: ((id: string) => boolean) | null = null,
    ) {
        super(id, host, hostName, onClearTimeout);
        this.prevWord = '';
        this.word = '';
        this.winOrder = [];
        this.countdown = TIME_LIMIT;
        this.maxAttempts = MAX_ATTEMPTS;
        this.settings = { ...SETTINGS };
    }

    getData() {
        return {
            ...super.getData(),
            word: this.status === 2 ? this.word : null,
            winOrder: this.winOrder,
            timeRemaining: this.countdown,
        };
    }

    getSettings(): Settings {
        return this.settings;
    }

    setSettings(id: string, settings: Partial<Settings>): Settings {
        if (this.host === id) {
            this.settings = { ...this.settings, ...settings } as Settings;
        }
        return this.settings;
    }

    setWord(word: string): void {
        this.word = word;
    }

    refreshUser(previousID: string, currentID: string): void {
        super.refreshUser(previousID, currentID);
        this.winOrder = this.winOrder.map((item) => ({
            ...item,
            id: item.id === previousID ? currentID : item.id,
        }));
    }

    enterWord(id: string, currentWord: string[]): boolean | undefined {
        const player = this.players.get(id);
        if (!player) {
            return;
        }

        const correct = player.enterWord(currentWord, this.word);
        if (correct) {
            this.winOrder.push({
                id: id,
                name: player.getName(),
                attempts: player.getAttempts(),
            });
            let rank = this.winOrder.length;
            if (this.settings[SETTINGS_IDS.WIN_BY_LEAST_ATTEMPTS]) {
                this.winOrder = this.winOrder.sort((a, b) => a.attempts - b.attempts);
                rank = this.winOrder.findIndex((p) => p.id === id) + 1;
            }
            this.message = '#' + rank + ' - ' + player.getName();
        } else {
            if (this.settings[SETTINGS_IDS.SIX_ATTEMPTS] && player.getAttempts() >= this.maxAttempts) {
                player.setInProgress(false);
            }
        }

        if (this.settings[SETTINGS_IDS.STOP_AT_FIRST_WINNER]) {
            if (correct) {
                this.status = 2;
            }
        } else if (this.settings[SETTINGS_IDS.SIX_ATTEMPTS]) {
            const inProgress = this.isPlayerInProgress();
            if (!inProgress) {
                this.status = 2;
            }
        } else {
            this.status = this.winOrder.length < this.players.size ? 1 : 2;
        }

        return correct;
    }

    isPlayerInProgress(): boolean {
        return Array.from(this.players.values()).some((player) => player.inProgress);
    }

    decrementCountdown(): void {
        if (this.status === 1) {
            if (this.settings[SETTINGS_IDS.GUESS_TIMER]) {
                this.players.forEach((player) => player.setCountdown((c) => c - 1));
            }
            if (this.settings[SETTINGS_IDS.GAME_TIMER]) {
                this.setCountdown((c) => c - 1);
                if (this.countdown === 0) {
                    this.status = 2;
                }
            }
        }
    }

    setCountdown(numArg: number | ((n: number) => number)): void {
        if (!this.inProgress) {
            return;
        }

        if (typeof numArg === 'function') {
            const res = numArg(this.countdown);
            this.countdown = res > 0 ? res : 0;
        } else {
            this.countdown = numArg;
        }
    }

    resetCountdown(): void {
        this.countdown = TIME_LIMIT;
    }

    start(): void {
        if (this.status > 0) return;
        this.inProgress = true;
        this.players.forEach((player) => {
            player?.start();
        });

        this.word = WordUtil.getRandomWord();
        this.status = 1;
        this.paused = false;
        this.winOrder = [];
        this.message = '';
        this.resetCountdown();

        if (this.settings[SETTINGS_IDS.CHAIN] && this.prevWord.length) {
            console.log('PREV:', this.prevWord);
            this.players.forEach((player) => {
                player?.enterWord(this.prevWord.split(''), this.word);
            });
        }

        console.log('WORD:', this.word);
    }

    end(): void {
        this.players.forEach((player) => player?.reset());
        this.inactivePlayers.forEach((player) => player?.reset());
        this.prevWord = this.word;
        this.word = '';
        this.status = 0;
        this.paused = false;
        this.winOrder = [];
        this.message = '';
        this.resetCountdown();
    }
}

export default XordleRoom;
