require('dotenv').config()
const express=require("express")
const cors=require('cors')
const mongoose=require('mongoose')
const Authentication=require('./routes/Authentication')
const Notes=require('./routes/Notes')
const cookieParser = require('cookie-parser');

//Using mongodb library
// const mongodb=require("mongodb")
// const MongoClient=mongodb.MongoClient;

const app=express()
//Database Connection URL
const url=process.env.URL;

app.use(cors({origin:process.env.ORIGIN_URL||'http://localhost:3000',credentials:true}))
app.use(express.json())

app.use(cookieParser());

//establishing connection
mongoose.set('strictQuery', true);
mongoose.connect(url,{useNewUrlParser:true}).then(()=>console.log("Connected to MongoDB")).catch((err)=>console.log(err))

//authentication api end-point
app.use('/auth',Authentication)

app.use('/notes',Notes)

app.listen(process.env.PORT||3001,()=>console.log("server started"))