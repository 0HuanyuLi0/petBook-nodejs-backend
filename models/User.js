const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({

    name: {
        type: String,
        require: true,
        min: 3,
        // unique: true
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
        default: 'https://i.natgeofe.com/n/548467d8-c5f1-4551-9f58-6817a8d2c45e/NationalGeographic_2572187_square.jpg'
    },

    coverPicture: {
        type: String,
        default: ''
    },

    following: [{
        // the people who I am following
        ref:'User',
        type:mongoose.Schema.Types.ObjectId
    }],


    followers: [{
        // the people who followed me
        ref:'User',
        type:mongoose.Schema.Types.ObjectId
    }],

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