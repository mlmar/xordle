import { SOCKET_URL } from './SystemUtil';

type ActionCallback = (payload: any) => void;

export class SocketClient {
    id: string | null = null;
    name: string | null = null;
    room: string | null = null;

    private ws: WebSocket | null = null;
    private listeners = new Map<string, ActionCallback[]>();

    private handleSetId = (id: string) => {
        this.id = id;
        const previousID = localStorage.getItem('xordle_id');
        if (previousID) {
            console.log('Reconnecting...');
            this.emit('RECONNECT', { previousID });
        }
        const previousName = localStorage.getItem('xordle_name');
        if (previousName) {
            this.setName(previousName);
        }
        localStorage.setItem('xordle_id', id);
        console.log('Socket initialized');
    };

    listen(action: string, func: ActionCallback): void {
        const actions = action.split(' ');
        actions.forEach((a) => {
            a = a.trim();
            if (!this.listeners.has(a)) {
                this.listeners.set(a, []);
            }
            this.listeners.get(a)!.push(func);
        });
    }

    removeListener(action: string, func: ActionCallback): void {
        const actions = action.split(' ');
        actions.forEach((a) => {
            a = a.trim();
            let functions = this.listeners.get(a);
            if (functions?.length) {
                functions = functions.filter((listenerFunc) => listenerFunc !== func);
                if (functions.length === 0) {
                    this.listeners.delete(a);
                } else {
                    this.listeners.set(a, functions);
                }
            }
        });
    }

    emit<T>(action: string, payload?: T): void {
        if (this.ws) {
            this.ws.send(JSON.stringify({ action, payload }));
        } else {
            console.warn('No client found');
        }
    }

    setName(val: string): void {
        localStorage.setItem('xordle_name', val);
        this.emit('SET_NAME', { name: val });
    }

    setRoom(val: string | null): void {
        this.room = val;
    }

    init(): void {
        if (this.ws) {
            console.warn('Client already initialized. Removing existing client...');
            this.ws.close();
        }

        this.removeListener('SET_ID', this.handleSetId);
        this.listen('SET_ID', this.handleSetId);

        this.ws = new WebSocket(SOCKET_URL);

        this.ws.addEventListener('message', (event) => {
            const { data } = event;
            const { action, payload } = JSON.parse(data);
            if (this.listeners.has(action)) {
                if (import.meta.env.DEV) {
                    console.log('Message from server:', { action, payload });
                }
                this.listeners.get(action)!.forEach((func) => func(payload));
            }
        });

        this.ws.addEventListener('close', () => {
            console.warn('Client closed.');
        });
    }

    destroy(): void {
        if (this.ws) {
            this.ws.close();
            this.ws = null;
            this.listeners.forEach((_value, key) => this.listeners.delete(key));
        }
    }
}
