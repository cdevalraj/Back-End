const express = require("express")
const client = require("../api/Redis")
const authenticate = require("../MiddleWare/Authenticate")
const router = express.Router()
const Note = require('../models/Note')

const DEFAULT_EXPIRATION = process.env.DEFAULT_EXPIRATION || 3600000

async function getorsetCache(key, cb) {
    let val =await client.get(key)
    if (val!=null) {
        return JSON.parse(val);
    }
    let freshdata = await cb()
    client.setEx(key, DEFAULT_EXPIRATION, JSON.stringify(freshdata));
    return freshdata
}

//getting All the notes of a specific user
router.get('/', authenticate, async (req, res) => {
    let user = req.user
    try {
        const val = await getorsetCache(`notes?user=${user.username}`, async () => {
            let notes = await Note.find({ username: user.username })
            return notes
        })
        res.send(val)
    }
    catch (err) {
        res.status(500).json({ message: err.message })
    }
})

//getting a specific note of a specific user
router.get('/:id', authenticate, async (req, res) => {
    try {
        const val = await getorsetCache(`note:${req.params.id}`, async () => {
            let note = await Note.findOne({ _id: req.params.id })
            return note
        })
        res.send({title:val.title,content:val.content})
    }
    catch (err) {
        res.status(500).json({ message: err.message })
    }
})

//creating a new note
router.post('/save', authenticate, async (req, res) => {
    let user = req.user
    let note = new Note({
        username: user.username,
        title: req.body.title,
        content: req.body.con
    })
    try {
        await note.save();
        client.del(`notes?user=${user.username}`)
        res.status(201).send('Note Saved Successfully');
    }
    catch (err) {
        res.status(500).json({ message: er.message })
    }
})

//deleting a specific note
router.delete('/delete/:id', authenticate, async (req, res) => {
    try {
        await Note.deleteOne({ _id: req.params.id })
        client.del(`notes?user=${user.username}`)
        client.del(`note:${req.params.id}`)
        res.send('Note deleted Successfully');
    }
    catch (err) {
        res.status(500).json({ message: er.message })
    }
})

//update a note
router.patch('/update/:id', authenticate, async (req, res) => {
    try {
        await Note.updateOne({ _id: req.params.id }, {
            $set: {
                title: req.body.title,
                content: req.body.con,
                updatedAt: new Date()
            }
        })
        client.del(`notes?user=${user.username}`)
        client.del(`note:${req.params.id}`)
        res.send('Note Updated Successfully');
    }
    catch (err) {
        res.status(500).json({ message: err.message })
    }
})

module.exports = router