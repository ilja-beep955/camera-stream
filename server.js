const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));

// Простая комната: sender + viewer
io.on('connection', (socket) => {
  console.log('connected:', socket.id);

  socket.on('join-as-sender', (roomId) => {
    socket.join(roomId);
    socket.roomId = roomId;
    socket.role = 'sender';
    socket.to(roomId).emit('sender-ready', socket.id);
  });

  socket.on('join-as-viewer', (roomId) => {
    socket.join(roomId);
    socket.roomId = roomId;
    socket.role = 'viewer';
    // Сообщаем sender'у, что пришёл зритель
    socket.to(roomId).emit('viewer-joined', socket.id);
  });

  // Пересылка offer/answer/ICE
  socket.on('signal', ({ to, data }) => {
    io.to(to).emit('signal', { from: socket.id, data });
  });

  socket.on('stop-stream', () => {
    if (socket.roomId) socket.to(socket.roomId).emit('stream-stopped');
  });

  socket.on('disconnect', () => {
    if (socket.roomId) socket.to(socket.roomId).emit('peer-left', socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
