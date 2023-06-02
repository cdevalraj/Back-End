const express=require('express');
const crypto = require('crypto');
const authenticate = require('../MiddleWare/Authenticate');
const router=express.Router()
const client = require('../api/Redis')
const ids=[]

router.post('/generate',authenticate,async(req,res)=>{
    const user=req.user;
    let id=await client.get(`room?user=${user.username}`);
    if(id===null)
    {
        id=(crypto.randomBytes(64).toString('hex')).slice(0,12);
        await client.setEx(`room?user=${user.username}`,1000*60*60,id);
        ids.push(id);
    }
    return res.send({"roomid":id});
});

router.get('/verify',authenticate,async(req,res)=>{
    if(req.body.roomId!=="" && ids.has(req.body.roomId))
        return res.sendStatus(201);
    return res.sendStatus(400);
})

module.exports = router