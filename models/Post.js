const mongoose = require('mongoose');

const PostSchema = new mongoose.Schema({

    author:{
        ref:'User',
        type:mongoose.Schema.Types.ObjectId
    },

    message: String,

    img_url:String,

    likes:[{
        ref:'User',
        type:mongoose.Schema.Types.ObjectId
    }],

    createdAt: {
        type: Date,
        default: Date.now, // automatically default this field to the current date
    },

}); // Schema()

module.exports = mongoose.model('Post', PostSchema);