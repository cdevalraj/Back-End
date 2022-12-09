const express = require("express")
const authenticate = require("../MiddleWare/Authenticate")
const router = express.Router()
const Note=require('../models/Note')

//getting All the notes of a specific user
router.get('/',authenticate,async (req,res)=>{
    let user=req.user
    try{
        let notes=await Note.find({username:user.username})
        res.send(notes);
    }
    catch(err)
    {
        res.status(500).json({ message: err.message })
    }
})

//creating a new note
router.post('/save',authenticate,async (req,res)=>{
    let user=req.user
    let note=new Note({
        username:user.username,
        title:req.body.title,
        content:req.body.con
    })
    try{
        await note.save();
        res.status(201).send('Note Saved Successfully');
    }
    catch(err){
        res.status(500).json({ message: er.message })
    }
})

//deleting a specific note
router.delete('/delete/:id',authenticate,async(req,res)=>{
    try{
        await Note.deleteOne({_id:req.params.id})
        res.send('Note deleted Successfully');
    }
    catch(err)
    {
        res.status(500).json({ message: er.message })
    }
})

//update a note
router.patch('/update/:id',authenticate,async(req,res)=>{
    try{
        await Note.updateOne({_id:req.params.id},{$set:{
            title:req.body.title,
            content:req.body.con,
            updatedAt:new Date()
        }})
        res.send('Note Updated Successfully');
    }
    catch(err){
        res.status(500).json({ message: err.message })
    }
})

module.exports = router