import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import path from 'path';
import './util/WordUtil';
import socketServer from './socket/SocketServer';

const app = express();

app.use(
    cors({
        origin: process.env.CORS_ORIGIN,
        credentials: true,
        optionsSuccessStatus: 200,
        allowedHeaders: ['Content-Type'],
    }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const port = process.env.PORT || 3300;
const server = app.listen(port, () => {
    console.log('Listening on', port);
});

socketServer(server);

if (!process.env.DEV) {
    console.log('Serving production directory');
    const REACT_DIRECTORY = '../xordle-vite/dist';

    app.use(express.static(path.join(__dirname, REACT_DIRECTORY)));
    app.get('/*', (req, res) => {
        res.sendFile(path.join(__dirname, REACT_DIRECTORY, 'index.html'));
    });
}
