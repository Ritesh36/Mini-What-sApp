import express from "express";
import mongoose from 'mongoose';
import { createServer } from 'node:http';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import Message from './models/Message.js';

import { Server } from "socket.io";

const app = express();
const server = createServer(app);
const io = new Server(server);

const __dirname = dirname(fileURLToPath(import.meta.url));

main().catch(err => console.log(err));

async function main() {
  await mongoose.connect('mongodb://127.0.0.1:27017/test');
}

app.get('/', (req, res) => {
  res.sendFile(join(__dirname, 'index.html'));
});

app.get('/messages', async (req, res) => {
    const messages = await Message.find();
    res.json(messages);
});

const users = {};

io.on('connection', (socket) => {

    socket.on('new-user-joined', (name) => {
      console.log('a user connected', name);
      users[socket.id] = name;
      socket.broadcast.emit('user-joined', name);
    });

    socket.on('send', async (message) => {
        const msg = new Message({ name: users[socket.id], message });
        await msg.save();
        socket.broadcast.emit('receive', { message, name: users[socket.id] });
      });

    socket.on('disconnect', () => {
      console.log('user disconnected');
    });

});

server.listen(8080, () => {
    console.log("Server is running on port 8080");
})