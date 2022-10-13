const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({

    sender: {
        ref: 'User',
        type: mongoose.Schema.Types.ObjectId
    },

    message: String,

    receiver:{
        ref: 'User',
        type: mongoose.Schema.Types.ObjectId
    },

    chatRoom:String,

    createdAt: {
        type: Date,
        default: Date.now, // automatically default this field to the current date
    },

}); // Schema()

module.exports = mongoose.model('Message', MessageSchema);