const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config();
require('./util/WordUtil.js');

app.use(cors({
  origin: "*",
  credentials: true,
  optionsSuccessStatus: 200,
  allowedHeaders: ['Content-Type']
}))

app.use(express.json());
app.use(express.urlencoded({ extended: true}))

respond = (status, message, data) => new Object({ status, message, data });

const port = process.env.PORT || 3300;
const server = app.listen(port, () => {
  console.log("Listening on", port);
});

const socketServer = require('./socket/SocketServer.js');
socketServer(server);

app.get('/ping', (req, res) => {
  res.send(respond(0, "pong", null));
});

// SERVER STATIC DIRECTORYT IF NOT IN DEVELOPMENT
if(!process.env.DEV) {
  const REACT_DIRECTORY = "../xordle-vite/dist";
  const path = require('path');

  app.use(express.static(path.join(__dirname, REACT_DIRECTORY)))
  app.get('/*', (req, res) => {
    res.sendFile(path.join(__dirname, REACT_DIRECTORY,'index.html'))
  });
}