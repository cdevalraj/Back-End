const express = require('express');
const crypto = require('crypto');
const authenticate = require('../MiddleWare/Authenticate');
const router = express.Router()
const client = require('../api/Redis')
const schedule = require('../api/SimpleSchedular');

router.post('/generate', authenticate, async (req, res) => {
    const id = (crypto.randomBytes(64).toString('hex')).slice(0, 16);
    await client.LPUSH('roomId', id);
    schedule(async () => { await client.LREM('roomId', 1, id); }, 60 * 60 * 1000);
    return res.send({ "roomid": id});
});

router.post('/verify', authenticate, async (req, res) => {
    let ids = await client.LRANGE('roomId', 0, -1);
    if (req.body.roomId !== "" && ids.includes(req.body.roomId))
        return res.sendStatus(201);
    return res.sendStatus(401);
})

module.exports = router