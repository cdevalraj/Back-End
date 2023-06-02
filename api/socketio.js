const express=require("express")
const app=express()
app.use(express.json())
const { createServer } = require("http");
const { Server } = require("socket.io");
const httpServer = createServer(app);
const io = new Server(httpServer);

module.exports={app,httpServer,io}