
const mongoose = require('mongoose');
const bcrypt = require('bcrypt')

const User = require('./User');
const Post = require('./Post')

mongoose.connect('mongodb://127.0.0.1/petBook');

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
        }, // end of Test User 2
        {
            name: 'Test User 1',
            email: 'one@one.com',
            password: await bcrypt.hash('test', saltRounds),
            isAdmin: false
        }, // End of Test User 2

    ]); // User.create()



    // ========== Post seeds ==========
    await Post.deleteMany();
    const createdPosts = await Post.create([
        {
            author:createdUsers[0]._id,
            message: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec commodo velit id nunc mattis, vitae aliquam risus faucibus. Mauris dapibus, odio quis bibendum tincidunt, magna tortor condimentum felis, non vulputate magna ante in purus.',
            img_url: 'https://post.medicalnewstoday.com/wp-content/uploads/sites/3/2020/02/322868_1100-800x825.jpg'
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

    console.log('Posts:', createdPosts);
    console.log('Users:', createdUsers);

    console.log('Users all:', await User.find());

    process.exit(0);
});