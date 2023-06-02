require('dotenv').config()
const mongoose = require('mongoose')
const Authentication = require('./routes/Authentication')
const Note = require('./routes/Note')
const Room = require('./routes/Room')
const cookieParser = require('cookie-parser');
const cors = require('cors')
const jwt = require('jsonwebtoken')
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
}).on("connection", (socket) => {
    console.log(socket.id, socket.user);
    socket.on("disconnect", (reason) => {
        console.log(reason);
    });
    socket.on('peer',(pc)=>{
        console.log(pc)
    })
});

//authentication api end-point
app.use('/auth', Authentication)

app.use('/notes', Note)

app.use('/room', Room)

httpServer.listen(process.env.PORT || 3001, () => console.log("server started"))