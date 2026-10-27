const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const ss = require('socket.io-stream');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  maxHttpBufferSize: 1e8 // Увеличиваем лимит для видео-чанков
});

app.use(express.static('public'));

io.on('connection', (socket) => {
  console.log('Подключен:', socket.id);

  socket.on('join-room', (roomId) => {
    socket.join(roomId);
    socket.roomId = roomId;
    socket.to(roomId).emit('user-connected', socket.id);
  });

  // Принимаем видео-чанк от отправителя и шлем его в комнату
  ss(socket).on('stream-video', (stream) => {
    if (socket.roomId) {
      stream.pipe(ss(socket).to(socket.roomId).emit('stream-video'));
    }
  });

  socket.on('disconnect', () => {
    if (socket.roomId) {
      socket.to(socket.roomId).emit('user-disconnected', socket.id);
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
