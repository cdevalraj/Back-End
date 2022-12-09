const mongoose = require('mongoose')

const UserSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
        },
        email: {
            type: String,
            required: true,
        },
        password: {
            type: String,
            required: true
        },
        username: {
            type: String,
            required: true,
        },
        role: {
            type: String,
            default: "Basic"
        },
        createdAt: {
            type: Date,
            default: Date.now()
        }
    },
    { collection: "user" }
)

module.exports = mongoose.model("user", UserSchema)