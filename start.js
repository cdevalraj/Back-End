require('dotenv').config()
const mongoose = require('mongoose')
const Authentication = require('./routes/Authentication')
const Note = require('./routes/Note')
const Room = require('./routes/Room')
const cookieParser = require('cookie-parser');
const cors = require('cors')
const jwt = require('jsonwebtoken')
const client = require("./api/Redis")
const { app, httpServer, io } = require('./api/socketio');
//Database Connection URL
const url = process.env.URL;

//Using mongodb library
// const mongodb=require("mongodb")
// const MongoClient=mongodb.MongoClient;

// Setting server to use cors origin policy and cookie parsing
app.use(cors({ origin: [process.env.ORIGIN_URL, 'http://localhost:3000'], credentials: true }))
app.use(cookieParser());

//establishing connection
mongoose.set('strictQuery', true);
mongoose.connect(url, { useNewUrlParser: true }).then(() => console.log("Connected to MongoDB")).catch((err) => console.log(err))

const connectedUsers = {};
const ListUsers = {};

io.use((socket, next) => {
  const authtoken = socket.handshake.auth.token
  const token = authtoken && authtoken.split(' ')[1]
  if (token == null)
    return res.sendStatus(401)
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
    if (err)
      return;
    socket.user = user
    next();
  })
}).on('connection', (socket) => {
  /* For WEB-RTC */
  socket.on('join-room', async (roomId) => {
    // console.log('User connected:', socket.id);
    connectedUsers[socket.id] = roomId;
    if (ListUsers[roomId] === undefined) {
      ListUsers[roomId] = new Set();
    }
    ListUsers[roomId].add(socket.id);
    socket.join(roomId);
    setTimeout(() => {
      socket.emit('response', socket.id);
    }, 100);
    socket.to(roomId).emit('New-User', socket.id);
  });

  socket.on('offer', ({ offer, fromUserId, toUserId }) => {
    setTimeout(() => {
      socket.to(toUserId).emit('Listen-Offer', { offer, fromUserId });
    }, 500);
  });

  socket.on('ice-candidate', ({ candidate, fromUserId, toUserId }) => {
    socket.to(toUserId).emit('Listen-ICE', { candidate, fromUserId });
  });

  socket.on('answer', ({ answer, fromUserId, toUserId }) => {
    setTimeout(() => {
      socket.to(toUserId).emit('Listen-Answer', { answer, fromUserId });
    }, 500);
  });

  socket.on('Re-Connection', (fromUserId) => {
    let roomId = connectedUsers[fromUserId];
    socket.to(roomId).emit('user-disconnected', fromUserId);
    setTimeout(() => {
      socket.emit('Create-Offers', [...ListUsers[roomId]]);
    }, 500);
  });

  socket.on('Screen-Id', ({ fromUserId, sId }) => {
    socket.to(connectedUsers[fromUserId]).emit('ScreenID', sId);
  });

  socket.on('Stop-Screen-Share', ({ fromUserId }) => {
    socket.to(connectedUsers[fromUserId]).emit('Screen-Share-Ended');
  });

  socket.on('disconnect', async () => {
    // console.log('User disconnected:', socket.id);
    socket.to(connectedUsers[socket.id]).emit('user-disconnected', socket.id);
    if (ListUsers[connectedUsers[socket.id]] !== undefined) {
      ListUsers[connectedUsers[socket.id]].delete(socket.id);
      if (ListUsers[connectedUsers[socket.id]].size == 0)
        delete ListUsers[connectedUsers[socket.id]];
    }
    delete connectedUsers[socket.id];
  });
});

//authentication api end-point
app.use('/auth', Authentication)

app.use('/notes', Note)

app.use('/room', Room)

httpServer.listen(process.env.PORT || 3001, '0.0.0.0', () => console.log("server started"))