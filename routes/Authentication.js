const express = require("express")
const router = express.Router()
const bcrypt = require("bcrypt")
const User = require('../models/User')
const jwt = require('jsonwebtoken')
const { createClient } = require('redis')

// const redisClient=Redis.createClient()//({url:""}) for production ready or custom url
const DEFAULT_EXPIRATION = process.env.DEFAULT_EXPIRATION || 25920000

// redisClient.on('err',(err)=>console.log(err))
// redisClient.once('open',()=>console.log("Connected "))

const client = createClient({url:process.env.REDIS_URL||''});

(async () => {
    await client.connect()
        .then(() => console.log("Connected to Rdis"))
        .catch(err => { console.log('Redis Client Error', err.message) });
})()
// await client.disconnect();

//SignUp a New User
router.post('/signup', CheckUser, async (req, res) => {
    let hashedPwd = await bcrypt.hash(req.body.pwd, 10)
    let email = req.body.email;
    let idx = email.indexOf('@');
    let uname = email.substring(0, idx);
    let user = new User({
        name: req.body.name,
        email: email,
        password: hashedPwd,
        username: uname
    })
    try {
        await user.save();
        res.status(201).send('User has been Registered Successfully');
    }
    catch (er) {
        res.status(400).json({ message: er.message })
    }
})

//middleware for signup api
async function CheckUser(req, res, next) {
    try {
        let user = await User.findOne({ email: req.body.email });
        if (user !== null)
        return res.status(404).send("User Already Exists");
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
    next()
}

//Login
router.post('/login', async (req, res) => {
    try {
        const user = await User.findOne({ $or: [{ email: req.body.ue }, { username: req.body.ue }] })//fetch from database
        if (user == null)
            return res.status(400).send("Invalid")
        if (await bcrypt.compare(req.body.pwd, user.password)) {
            const accessToken = jwt.sign({
                username: user.username,
                email: user.email,
                role: user.role
            }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '15m' })
            const refreshToken = jwt.sign({
                username: user.username,
                email: user.email,
                role: user.role
            }, process.env.REFRESH_TOKEN_SECRET,{ expiresIn: '5d' })
            //Store it into database
            client.setEx('RefreshToken', DEFAULT_EXPIRATION, refreshToken)
            return res.json({ accessToken: accessToken, refreshtoken: refreshToken, role: user.role, username: user.username })
        }
        else
            return res.status(401).send("Username or Email/Password Invalid")
    }
    catch (err) {
        res.status(500).json({ message: err.message })
    }
})

//Re-Loging
router.post('/token', async (req, res) => {
    console.log("Inside /token")
    const refreshToken = req.body.token
    // console.log(refreshToken)
    if (refreshToken == null)
        return res.sendStatus(401)
    const x = await client.get('RefreshToken')
    if (x == null)//check for the refresh Token
        return res.sendStatus(403)
    jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, user) => {
        if (err)
            return res.sendStatus(403)
        const accessToken = jwt.sign({
            username: user.username,
            email: user.email,
            role: user.role
        }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '15m' })
        return res.json({ accessToken: accessToken, role: user.role, username: user.username })
    })
})

//Logout 
router.delete('/logout', (req, res) => {
    //delete refreshtoken from datbase
    client.del('RefreshToken')
    res.status(204).send('Logged Out Successfully');
})


module.exports = router