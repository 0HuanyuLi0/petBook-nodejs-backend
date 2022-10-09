const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')
const bcrypt = require('bcrypt')

const User = require('./models/User')
const Post = require('./models/Post')

const app = express()
const PORT = 3000
const saltRounds = 10



mongoose.connect('mongodb://127.0.0.1/petBook');

app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.listen(PORT, () => {
    console.log(`Server listening at http://localhost:${PORT} ...`);
})

const db = mongoose.connection;

db.on('error', err => {
    console.log('Error connecting to DB server', err);
    process.exit(1); // quit the program
})

app.get('/', (req, res) => {
    console.log('Root route was requested');
    res.json({ hello: 'there' })
})

//======== user ==========
// TODO: session verify
// Sign in - create new user
app.post('/users', async (req, res) => {
    try {
        // const salt = await bcrypt.genSalt(saltRounds)
        const hashedPassword = await bcrypt.hash(req.body.password, saltRounds)

        const newUser = new User({
            name: req.body.name,
            email: req.body.email,
            password: hashedPassword
        })

        const user = await newUser.save()
        res.json(user)
    } catch (err) {
        console.error('Error creating new user: ', err);
        res.json(err)
    }
})

// login
app.post('/login', async (req, res) => {
    try {
        const user = await User.findOne({ email: req.body.email })
        if (!user) {
            throw new Error('user not found')

        }

        const validation = await bcrypt.compare(req.body.password, user.password)
        if (!validation) {
            throw new Error('wrong password')
        }

        res.json(user)

    } catch (err) {
        console.error('Error login: ', err);
        res.json(err)
    }
})

// get all users info
app.get('/users', async (req, res) => {
    try {
        const users = await User.find()
        res.json(users)
    } catch (err) {
        console.error('Error loading all users: ', err);
    }
})

//get user info
app.get("/user/:id", async (req, res) => {

    try {
        if (req.body.userId !== req.params.id) {
            throw new Error('You do not have right to get this account info')
        }
        
        const user = await User.findById(req.params.id).populate('posts')
        res.json(user)
       
        // res.json(user);
    } catch (err) {
        console.error('Error get user info', err);
        res.json(err)
    }
});

//update user info
app.post('/user/:id', async (req, res) => {

    try {
        if (req.body.userId !== req.params.id) {
            throw new Error('You do not have right to update this account')
        }
        const user = await User.findByIdAndUpdate(req.params.id, req.body, { returnDocument: 'after' })
        res.json(user)
    } catch (err) {
        console.error('Error update user', err);
        res.json(err)
    }

})

//delete user
app.delete('/user/:id', async (req, res) => {
    try {
        if (req.body.userId !== req.params.id) {
            throw new Error('You do not have right to detele this account')
        }
        const user = await User.findByIdAndDelete(req.params.id)
        res.json(user)
    } catch (err) {
        console.error('Error detele user', err);
        res.json(err)
    }

})

//======= followe ========
//follow a user
app.post('/follow/:id',async(req,res)=>{
    try{
        const currentUser = await User.findById(req.body.userId)
        const follower = await User.findById(req.params.id)

        if (currentUser.following.includes(req.params.id)) {
            throw new Error('you have followed this user already')
        }

        const currentUser_res = await currentUser.updateOne({$push:{following:req.params.id}})
        const follower_res = await follower.updateOne({$push:{followers:req.body.userId}})

        res.json(currentUser_res)

    }catch(err){
        console.error('Error follow a user', err);
        res.json(err)
    }
})

//unfollow a user
app.post('/unfollow/:id',async(req,res)=>{
    try{
        const currentUser = await User.findById(req.body.userId)
        const follower = await User.findById(req.params.id)

        if (!currentUser.following.includes(req.params.id)) {
            throw new Error('you did not follow this user')
        }

        const currentUser_res = await currentUser.updateOne({$pull:{following:req.params.id}})
        const follower_res = await follower.updateOne({$pull:{followers:req.body.userId}})

        res.json(currentUser_res)

    }catch(err){
        console.error('Error follow a user', err);
        res.json(err)
    }
})

//======= Post ========
//get all posts
app.get('/posts',async(req,res)=>{
    try{
        const posts = await Post.find().populate({path:'author',select:['name','email','profilePicture','coverPicture','_id']})
        res.json(posts)
    }catch(err){
        console.error('Error get all posts ',err);
        res.json(err)
    }
})

//post a post
app.post('/posts',async(req,res)=>{
    try{
        const newPost = new Post({
            author:req.body.userId,
            message:req.body.message,
            img_url:req.body.img_url
        })

        const post = await newPost.save()
        res.json(post)

    }catch(err){
        console.error('Error get post a post ',err);
        res.json(err)
    }
})

// get a post
app.get('/post/:id',async(req,res)=>{
    try{
        const post = await Post.findById(req.params.id).populate({path:'author',select:['name','email','profilePicture','coverPicture','_id']})
        res.json(post)
    }catch(err){
        console.error('Error get the post ',err);
        res.json(err)
    }
})

// update a post
app.post('/post/:id',async(req,res)=>{
    try{
        const post = await Post.findById(req.params.id)

        if (post.author._id.toString() !== req.body.userId) {
            throw new Error('You do not have the right to edit this post')
        }

        const updated_post = await post.updateOne(req.body)

        res.json(updated_post)

    }catch(err){
        console.error('Error update the post ',err);
        res.json(err)
    }
})

//delete a post
app.delete('/post/:id',async(req,res)=>{
    try{
        const post = await Post.findById(req.params.id)

        if (post.author._id.toString() !== req.body.userId) {
            throw new Error('You do not have the right to edit this post')
        }

        const deletePost = await Post.findByIdAndDelete(req.params.id)

        res.json(deletePost)

    }catch(err){
        console.error('Error delete the post ',err)
        res.json(err)
    }
})

//like a post
app.post("/like/:id", async (req, res) => {
    try {
      const post = await Post.findById(req.params.id)
      if (!post.likes.includes(req.body.userId)) {
        await post.updateOne({ $push: { likes: req.body.userId } })
        res.json(post)
      } else {
        await post.updateOne({ $pull: { likes: req.body.userId } })
        res.json(post)
      }
    } catch (err) {
    console.error('Error like the post ',err)
      res.json(err)
    }
  });