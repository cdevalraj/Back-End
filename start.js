require('dotenv').config()
const express=require("express")
const cors=require('cors')
const mongoose=require('mongoose')
mongoose.set('strictQuery', true);
const Authentication=require('./routes/Authentication')
const Notes=require('./routes/Notes')

//Using mongodb library
// const mongodb=require("mongodb")
// const MongoClient=mongodb.MongoClient;

const app=express()
//Database Connection URL
const url=process.env.URL;

app.use(cors({origin:'http://localhost:3000'}))
app.use(express.json())

//establishing connection
mongoose.connect(url,{useNewUrlParser:true}).then(()=>console.log("Connected to MongoDB")).catch((err)=>console.log(err))

//authentication api end-point
app.use('/auth',Authentication)

app.use('/notes',Notes)

app.listen(process.env.PORT||3001,()=>console.log("server started"))