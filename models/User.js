const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({

    name: {
        type: String,
        require: true,
        min: 3,
        unique: true
    },

    email: {
        type: String,
        require: true,
        unique: true
    },

    password: {
        type: String,
        require: true
    },

    profilePicture: {
        type: String,
        default: ''
    },

    coverPicture: {
        type: String,
        default: ''
    },

    following: {
        // the people who I am following
        type: Array,
        default: []
    },

    followers: {
        // the people who followed me
        type: Array,
        default: []
    },

    isAdmin: {
        type: Boolean,
        default: false
    },

    description:{
        type: String,
        max:100
    },

    location:{
        type:String
    },

    posts:[{
        ref:'Post',
        type:mongoose.Schema.Types.ObjectId
    }],

    createdAt: {
        type: Date,
        default: Date.now, // automatically default this field to the current date
    },

}); // Schema()

module.exports = mongoose.model('User', UserSchema);