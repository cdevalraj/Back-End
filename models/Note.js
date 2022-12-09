const mongoose = require('mongoose')

const NoteSchema = new mongoose.Schema(
    {
        username: {
            type: String,
            required: true,
        },
        title: {
            type: String,
            required: true,
        },
        content: {
            type: String,
            required: true,
        },
        createdAt: {
            type: Date,
            immutable: true,
            default: () => Date.now()
        },
        updatedAt: {
            type: Date,
            default: () => Date.now()
        }
    },
    { collection: "notes" }
)

module.exports = mongoose.model("note", NoteSchema)