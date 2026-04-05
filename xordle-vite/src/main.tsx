import React from 'react';
import './index.css';
import App from './App';
import { createRoot } from 'react-dom/client';
import { SocketClient } from './util/SocketClient';
import { SocketProvider } from '@/providers/SocketProvider';

const client = new SocketClient();

const root = createRoot(document.getElementById('root') as HTMLElement);
root.render(
    <React.StrictMode>
        <SocketProvider client={client}>
            <App />
        </SocketProvider>
    </React.StrictMode>,
);
