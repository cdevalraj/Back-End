const express = require("express")
const router = express.Router()
const bcrypt = require("bcrypt")
const User = require('../models/User')
const jwt = require('jsonwebtoken')
const client = require('../api/Redis')

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
    console.log(user)
    try {
        await user.save();
        res.status(201).send('User has been Registered Successfully');
    }
    catch (er) {
        console.log("Hi")
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
            }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: '5d' })
            //Store it into database
            client.lPush('RefreshToken', refreshToken)
            // res.cookie('jwt', refreshToken, { httpOnly: true, sameSite: 'None', secure: true, maxAge: 24 * 60 * 60 * 1000 });
            return res.cookie('RefreshToken', refreshToken, { httpOnly: true, secure: true, sameSite: "none", maxAge: 5 * 24 * 60 * 60 * 1000 }).send({ accessToken: accessToken })
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
    const cookies = req.cookies
    const refreshToken = cookies.RefreshToken
    if (refreshToken == null)
        return res.sendStatus(401)
    let x = await client.lRange('RefreshToken', 0, -1)
    if (!x.includes(refreshToken))//check for the refresh Token
        return res.sendStatus(403)
    jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, user) => {
        if (err)
            return res.sendStatus(403)
        const accessToken = jwt.sign({
            username: user.username,
            email: user.email,
            role: user.role
        }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '15m' })
        return res.json({ accessToken: accessToken })
    })
})

//Logout 
router.delete('/logout', (req, res) => {
    //delete refreshtoken from datbase
    client.LREM('RefreshToken', 1, req.cookies.RefreshToken).catch(er => {})
    res.clearCookie('RefreshToken', { httpOnly: true, sameSite: 'None', secure: true }).status(204).send('Logged Out Successfully');
})

module.exports = router