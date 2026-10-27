const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  maxHttpBufferSize: 1e7 // Увеличиваем лимит до 10 МБ для передачи картинок
});

app.use(express.static('public'));

io.on('connection', (socket) => {
  socket.on('join-room', (roomId) => {
    socket.join(roomId);
    socket.roomId = roomId;
    socket.to(roomId).emit('user-connected', socket.id);
  });

  // Получаем картинку от отправителя и шлем её всем в комнате (кроме него)
  socket.on('video-frame', (base64Image) => {
    if (socket.roomId) {
      socket.to(socket.roomId).emit('video-frame', base64Image);
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
