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

app.get('/', (req, res) => {
  res.send(respond(0, "HOME ROOT", null))
});