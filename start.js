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
  socket.on('join-room', async (roomId) => {
    // console.log('User connected:', socket.id);
    connectedUsers[socket.id] = roomId;
    socket.join(roomId);
    setTimeout(() => {
      socket.emit('response', socket.id);
    }, 1000);
    socket.to(roomId).emit('New-User', socket.id);
  });

  socket.on('offer', ({ offer, fromUserId, toUserId }) => {
    setTimeout(() => {
      socket.to(toUserId).emit('Listen-Offer', { offer, fromUserId });
    }, 1000);
  });

  socket.on('ice-candidate', ({ candidate, fromUserId, toUserId }) => {
    socket.to(toUserId).emit('Listen-ICE', { candidate, fromUserId });
  });

  socket.on('answer', ({ answer, fromUserId, toUserId }) => {
    setTimeout(() => {
      socket.to(toUserId).emit('Listen-Answer', { answer, fromUserId });
    }, 1000);
  });

  socket.on('disconnect', async () => {
    // console.log('User disconnected:', socket.id);
    socket.to(connectedUsers[socket.id]).emit('user-disconnected', socket.id);
    delete connectedUsers[socket.id];
  });
});

//authentication api end-point
app.use('/auth', Authentication)

app.use('/notes', Note)

app.use('/room', Room)

httpServer.listen(process.env.PORT || 3001, '0.0.0.0', () => console.log("server started"))