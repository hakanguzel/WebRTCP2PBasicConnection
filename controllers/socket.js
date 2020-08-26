/**
 * Websocket Yakalayıcı
 * @param http
 */
module.exports = (http) => {
  const io = require('socket.io')(http);
  let rooms = {};
  let roomId = null;
  let socketIds = {};

  /**
   * SocketId ile oda bulmak için.
   * @param value
   * @returns {*}
   */
  function findRoomBySocketId(value) {
    const arr = Object.keys(rooms);
    let result = null;

    for (let i = 0; i < arr.length; i++) {
      if (rooms[arr[i]][value]) {
        result = arr[i];
        break;
      }
    }

    return result;
  }

  /**
   * Soket bağlantısı
   */
  io.on('connection', (socket) => {
    // Oda erişimi
    socket.on('enter', (roomName, userId) => {
      roomId = roomName;
      socket.join(roomId); // Soketi belirli bir odaya bağlayın.

      // Zaten bir oda varsa, bir odaya kullanıcı bilgisi ekleyin
      if (rooms[roomId]) {
        console.log('Zaten bir odanız varsa');
        rooms[roomId][socket.id] = userId;
        // Bir oda oluşturduktan sonra kullanıcı ekleyin
      } else {
        console.log('Oda Ekle');
        rooms[roomId] = {};
        rooms[roomId][socket.id] = userId;
      }
      thisRoom = rooms[roomId];
      console.log('thisRoom', thisRoom);

      // Kullanıcı bilgilerini ekleyin
      io.sockets.in(roomId).emit('join', roomId, thisRoom);
      //console.log('ODA LİSTESİ', io.sockets.adapter.rooms);
      console.log('ODA LİSTESİ', rooms);
    });

    /**
     * Mesaj işleme
     */
    socket.on('message', (data) => {
      //console.log('İleti: ' + data);

      if (data.to === 'all') {
        // bensiz yayın yapmak için
        socket.broadcast.to(data.roomId).emit('message', data);
      } else {
        // hedef kullanıcı için
        const targetSocketId = socketIds[data.to];
        if (targetSocketId) {
          io.to(targetSocketId).emit('message', data);
        }
      }
    });

    /**
     * Bağlantı kesme işlemi
     */
    socket.on('disconnect', () => {
      console.log('bir kullanıcının bağlantısı kesildi', socket.id);

      const roomId = findRoomBySocketId(socket.id);
      if (roomId) {
        socket.broadcast.to(roomId).emit('leave', rooms[roomId][socket.id]); // Kullanıcı kimliklerini sizin dışınızdaki odalara iletmek
        delete rooms[roomId][socket.id]; // Kullanıcıyı kaldır
      }
    });
  });
};
