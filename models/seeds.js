
const mongoose = require('mongoose');
const bcrypt = require('bcrypt')
require('dotenv').config()
const User = require('./User');
const Post = require('./Post')
const Comment = require('./Comment')

mongoose.connect(process.env.MONGODB);

const db = mongoose.connection;

const saltRounds = 10

db.on('error', err => {
    console.log('DB Connection error', err);
    process.exit(1); // quit the program
});

db.once('open', async () => {
    console.log('Success! DB connected, model loaded.');

    // ========== User seeds ==========
    await User.deleteMany();

    const createdUsers = await User.create([
        {
            name: 'admin',
            email: 'admin@admin.com',
            password: await bcrypt.hash('admin', saltRounds),
            isAdmin: true,
            profilePicture:'https://images.unsplash.com/photo-1507146426996-ef05306b995a?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80'
        }, // end of Test User 2
        {
            name: 'Test User 1',
            email: 'one@one.com',
            password: await bcrypt.hash('test', saltRounds),
            isAdmin: false,
            profilePicture:'https://i.natgeofe.com/n/548467d8-c5f1-4551-9f58-6817a8d2c45e/NationalGeographic_2572187_square.jpg'
        }, // End of Test User 2

    ]); // User.create()

    //------friends---------

    createdUsers[1].following.push(createdUsers[0]._id)
    createdUsers[1].followers.push(createdUsers[0]._id)
   

    await createdUsers[0].save()
    // await createdUsers[1].save()



    // ========== Post seeds ==========
    await Post.deleteMany();
    const createdPosts = await Post.create([
        {
            author:createdUsers[0]._id,
            message: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec commodo velit id nunc mattis, vitae aliquam risus faucibus. Mauris dapibus, odio quis bibendum tincidunt, magna tortor condimentum felis, non vulputate magna ante in purus.',
            img_url: 'https://post.medicalnewstoday.com/wp-content/uploads/sites/3/2020/02/322868_1100-800x825.jpg',
            likes:[createdUsers[0]._id,createdUsers[1]._id,]
            
        }, {
            author:createdUsers[0]._id,
            message: 'Cras nec consectetur nibh. Morbi diam diam, interdum ultrices purus sed, consectetur molestie quam. Etiam lectus nibh, efficitur quis dui non, vehicula venenatis felis. Nam egestas tellus turpis, quis iaculis est iaculis ac. Sed in auctor enim.',
            img_url: 'https://hips.hearstapps.com/hmg-prod.s3.amazonaws.com/images/golden-retriever-royalty-free-image-506756303-1560962726.jpg'
        }, {
            author:createdUsers[1]._id,
            message: 'Nulla eu tortor sit amet purus finibus ultricies id vitae quam. Sed quis sem fermentum, aliquet urna in, ullamcorper arcu. Nulla fringilla sapien metus, ac tempus est congue ac.',
            img_url: 'https://i.natgeofe.com/n/4f5aaece-3300-41a4-b2a8-ed2708a0a27c/domestic-dog_thumb_square.jpg'
        }
    ])// Post.create

    createdUsers[0].posts.push(createdPosts[0]._id)
    createdUsers[0].posts.push(createdPosts[1]._id)
    createdUsers[1].posts.push(createdPosts[2]._id)

    await createdUsers[0].save()
    await createdUsers[1].save()

// ========== Comments seeds ==========
await Comment.deleteMany();
const createdComments = await Comment.create([
    {
        author:createdUsers[0]._id,
        message: 'Mauris dapibus, odio quis bibendum tincidunt, magna tortor condimentum felis, non vulputate magna ante in purus.',
        post:createdPosts[0]._id
        
    }, {
        author:createdUsers[0]._id,
        message: 'Nam egestas tellus turpis, quis iaculis est iaculis ac. Sed in auctor enim.',
        img_url: 'https://hips.hearstapps.com/hmg-prod.s3.amazonaws.com/images/golden-retriever-royalty-free-image-506756303-1560962726.jpg',
        post:createdPosts[0]._id
    }, {
        author:createdUsers[1]._id,
        message: 'Nulla fringilla sapien metus, ac tempus est congue ac.',
        post:createdPosts[0]._id
    }
])// Comment.create

createdPosts[0].comments.push(createdComments[0]._id)
createdPosts[0].comments.push(createdComments[0]._id)
createdPosts[0].comments.push(createdComments[0]._id)


await createdPosts[0].save()

    console.log('Posts:', createdPosts);
    console.log('Users:', createdUsers);


    process.exit(0);
});