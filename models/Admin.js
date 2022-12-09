const mongoose=require('mongoose')

const AdminSchema=new mongoose.Schema({
    name:{
        type:String,
        required:true,
    },
    email:{
        type:String,
        required:true,
        lowercase:true
    },
    Password:String,
    Role:{
        type:String,
        default:"Admin"
    },
    createdAt:{
        type:Date,
        default: Date.now()
    },
    username:{
        type:String,
        required:true,
        lowercase:true
    }
})

module.exports=mongoose.model("Admin",AdminSchema)