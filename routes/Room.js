const express = require('express');
const crypto = require('crypto');
const authenticate = require('../MiddleWare/Authenticate');
const router = express.Router()
const client = require('../api/Redis')
const schedule = require('../api/SimpleSchedular');

router.post('/generate', authenticate, async (req, res) => {
    const id = (crypto.randomBytes(64).toString('hex')).slice(0, 16);
    await client.LPUSH('roomId', id);
    await client.setEx(id, 60 * 60 * 1000, '1');
    schedule(async () => { await client.LREM('roomId', 1, id); }, 60 * 60 * 1000);
    return res.send({ "roomid": id, size: 1 });
});

router.post('/verify', authenticate, async (req, res) => {
    let ids = await client.LRANGE('roomId', 0, -1);
    if (req.body.roomId !== "" && ids.includes(req.body.roomId))
        return res.sendStatus(201);
    let size = Number(await client.GET(req.body.roomId));
    let remaining = await client.TTL(req.body.roomId);
    size++;
    await client.SETEX('room', remaining, size.toString());
    return res.status(401).send({ size });
})

module.exports = router