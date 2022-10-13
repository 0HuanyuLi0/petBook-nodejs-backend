const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')

const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const jwtAuthenticate = require('express-jwt')

const User = require('./models/User')
const Post = require('./models/Post')
const Comment = require('./models/Comment')
const Message = require('./models/Message')

const app = express()
mongoose.connect('mongodb://127.0.0.1/petBook');

app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

const PORT = 3000
const saltRounds = 10
// TODO this should be in a .env file
const SERVER_SECRET_KEY = 'mySecretKeyHERE'

const db = mongoose.connection;

db.on('error', err => {
    console.log('Error connecting to DB server', err);
    process.exit(1); // quit the program
})

app.get('/', (req, res) => {
    console.log('Root route was requested');
    res.json({ hello: 'there' })
})

const http = require('http').createServer(app);
const io = require('socket.io')(http, {
    cors: {
        origin: ['http://localhost:3001']
    }
})

let usersAtSocket=[]

const addUser = (userId,socketId) => {
    !usersAtSocket.some(user=>user.userId === userId) &&
    usersAtSocket.push({userId,socketId})
}

const removeUser = (socketId) => {
    usersAtSocket = usersAtSocket.filter(user=>user.socketId !== socketId)
}

io.on('connection', function (socket) {
    // when connecting

    socket.on("addUser",(userId)=>{
        addUser(userId,socket.id)
        io.emit("getUsers",usersAtSocket)
    })

    // when disconnect 
    socket.on('disconnect', () => {
        console.log('Client disconnected');
        removeUser(socket.id)
        // io.emit("getUsers",usersAtSocket)
    });
    socket.on('goTodisconnect', () => {
        console.log('Client disconnected');
        removeUser(socket.id)
        // io.emit("getUsers",usersAtSocket)
    });

    //run
    socket.on('sendMessage', (senderId,text)=> {
        console.log("Received a chat message");
        io.emit('getMessage', {
            senderId,
            text
        });
    });

})



const checkAuth = () => {
    return jwtAuthenticate.expressjwt({
        secret: SERVER_SECRET_KEY, // check the token hasn't been tampered with
        algorithms: ['HS256'],
        requestProperty: 'auth' // gives us 'req.auth'
    })
}





http.listen(PORT, () => {
    const host = http.address().address
    const port = http.address().port
    console.log('App listening at http://%s:%s', host, port)
    // console.log(`Server listening at http://localhost:${PORT} ...`);
})



//======== user ==========
// TODO: session verify
// Sign in - create new user
app.post('/users', async (req, res) => {
    try {
        // const salt = await bcrypt.genSalt(saltRounds)
        const hashedPassword = bcrypt.hashSync(req.body.password, saltRounds)

        const newUser = new User({
            name: req.body.name,
            email: req.body.email,
            password: hashedPassword
        })

        const user = await newUser.save()

        const token = jwt.sign(
            { _id: user._id },
            SERVER_SECRET_KEY,
            { expiresIn: '72h' }
        )

        res.json({ token, user })

    } catch (err) {
        console.error('Error creating new user: ', err);
        res.json(err)
    }
})

// login
app.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body

        const user = await User.findOne({ email })

        if (!user) {
            res.json('user not found')
            return
            // throw new Error('user not found')
        }

        const validation = bcrypt.compareSync(password, user.password)
        if (!validation) {
            res.json('wrong password')
            return
            // throw new Error('wrong password')
        }

        const token = jwt.sign(
            { _id: user._id },
            SERVER_SECRET_KEY,
            { expiresIn: '72h' }
        )

        // strong params
        // let {password, ...filteredUser} = user.toJSON()

        res.json({ token, user })

    } catch (err) {
        console.error('Error login: ', err);
        res.json(err)
    }
})

// get all users info
app.get('/user/image/:id', async (req, res) => {
    try {
        const usersImage = await User.findById(req.params.id).select(['profilePicture', 'name'])

        res.json(usersImage)
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

//=========message=============
// post new message
app.post('/messages/:senderId', async(req,res)=>{
    try{

        const newMessage = new Message({
            sender:req.params.senderId,
            receiver:req.body.receiver,
            message:req.body.message,
            chatRoom:req.body.chatRoom
        })

        const message = await newMessage.save()
        const resData = await message.populate({
            path:'sender',
            select:['name', 'email', '_id', 'profilePicture']
        })

        console.log('======message',resData)
        res.json(resData)

    }catch(err){
        console.log('Error post message',err);
        res.json(err)
    }
})

//get messages
app.get('/messages/:chatRoom', async(req,res)=>{
    try{

        const messages = await Message.find({
            chatRoom:req.params.chatRoom
        }).populate({
            path:'sender',
            select:['name', 'email', '_id', 'profilePicture']
        })
        // .populate({
        //     path:'receiver',
        //     select:['name', 'email', '_id', 'profilePicture']
        // })

        res.json(messages.reverse())

    }catch(err){
        console.log('Error get messages',err);
        res.json(err)
    }
})






//======= Post ========
//get all posts
app.get('/posts', async (req, res) => {
    try {
        const posts = await Post.find().populate({ path: 'author', select: ['name', 'email', 'profilePicture', '_id'] }).populate('comments')

        res.json(posts)
    } catch (err) {
        console.error('Error get all posts ', err);
        res.json(err)
    }
})

//get profile posts
app.get('/posts/profile/:id', async (req, res) => {
    try {
        const posts = await Post.find({
            author: {
                _id: req.params.id
            }
        }).populate({ path: 'author', select: ['name', 'email', 'profilePicture', '_id'] }).populate('comments')
        // console.log("=====profile posts:", posts);
        res.json(posts)
    } catch (err) {
        console.error('Error get all posts ', err);
        res.json(err)
    }
})



// get a post's all comments
app.get('/post/:id/comments', async (req, res) => {
    try {
        const comments = await Comment.find({
            post: req.params.id
        }).populate({
            path: 'author',
            select: ['name', 'email', '_id', 'profilePicture']
        })

        res.json(comments)
    } catch (err) {
        console.error('Error get the post comments ', err);
        res.json(err)
    }
})

// update a post
app.post('/post/:id', async (req, res) => {
    try {
        const post = await Post.findById(req.params.id)

        if (post.author._id.toString() !== req.body.userId) {
            throw new Error('You do not have the right to edit this post')
        }

        const updated_post = await post.updateOne(req.body)

        res.json(updated_post)

    } catch (err) {
        console.error('Error update the post ', err);
        res.json(err)
    }
})

//follow a user
app.post('/follow/:id', async (req, res) => {
    try {

        const newFollowing = await User.findById(req.params.id)

        const currentUser = await User.findById(req.body.currentUserId)

        if (currentUser.following.includes(req.params.id)) {
            throw new Error('you have followed this user already')
        }

        const currentUser_res = await currentUser.updateOne({ $push: { following: req.params.id } })

        const follower_res = await newFollowing.updateOne({ $push: { followers: currentUser._id } })

        res.json({
            following: currentUser.following, followers: currentUser.followers
        })

    } catch (err) {
        console.error('Error follow a user', err);
        res.json(err)
    }
})

//unfollow a user
app.post('/unfollow/:id', async (req, res) => {
    try {
        const currentUser = await User.findById(req.body.currentUserId)
        const following = await User.findById(req.params.id)

        // console.log('====',following);
        // console.log('====',following);

        if (!currentUser.following.includes(req.params.id)) {
            throw new Error('you did not follow this user')
        }

        const currentUser_res = await currentUser.updateOne({ $pull: { following: req.params.id } })

        const follower_res = await following.updateOne({ $pull: { followers: following._id } })

        res.json({ currentUser_res, follower_res })

    } catch (err) {
        console.error('Error unfollow a user', err);
        res.json(err)
    }
})




// ========== routes below this line only work for authenticated users =============
app.use(checkAuth()) // provide req.auth(the user id from the token) to all following routes

// custom middleware, defined inline:
//   use the req.auth ID from the middleware above and try to look up a user with it if not found,return an error code
app.use(async (req, res, next) => {
    try {
        const user = await User.findById(req.auth._id)
        if (user === null) {
            res.sendStatus(401)
        } else {
            req.current_user = user
            next() // move on to the next route
        }

    } catch (err) {
        console.log('Error querying user', err);
        res.sendStatus(500)
    }
})

// all routes below now have a 'req.current_user' defined
app.get('/current_user', (req, res) => {
    res.json(req.current_user)
})

//post a post
app.post('/posts', async (req, res) => {
    try {
        // console.log("=====", req.current_user._id);
        const newPost = new Post({
            author: req.current_user._id,
            message: req.body.message,
            img_url: req.body.img_url
        })

        const post = await newPost.save()

        await User.findByIdAndUpdate(req.current_user._id, {
            $push: { posts: post }
        })


        res.json(post)

    } catch (err) {
        console.error('Error get post a post ', err);
        res.json(err)
    }
})

//like a post
app.post("/like/:id", async (req, res) => {
    try {
        let post = await Post.findById(req.params.id)

        if (!post.likes.includes(req.current_user._id)) {
            await post.updateOne({ $push: { likes: req.current_user._id } })

            res.json({
                liked: true,
                number: post.likes.length + 1
            })

        } else {

            await post.updateOne({ $pull: { likes: req.current_user._id } })

            res.json({
                liked: false,
                number: post.likes.length - 1
            })
        }
    } catch (err) {
        console.error('Error like the post ', err)
        res.json(err)
    }
});

//delete a post
app.delete('/post/:id', async (req, res) => {
    // console.log("===============", req.current_user._id);
    try {

        const post = await Post.findById(req.params.id)

        if (post.author._id.toString() !== req.current_user._id.toString()) {
            // console.log("===============", post.author._id.toString());
            res.json('You do not have the right to edit this post')
            return
        }

        const deletePost = await Post.findByIdAndDelete(req.params.id)

        await Comment.deleteMany({ post: req.params.id })

        res.json(req.params.id)


    } catch (err) {
        console.error('Error delete the post ', err)
        res.json(err)
    }
})

//delete user
app.delete('/user/:id', async (req, res) => {
    try {
        if (req.current_user._id.toString() !== req.params.id.toString()) {
            throw new Error('You do not have right to detele this account')
        }
        const user = await User.findByIdAndDelete(req.params.id)

        await Post.deleteMany({ author: req.current_user._id.toString() })
        await Comment.deleteMany({ author: req.current_user._id.toString() })
        await Message.deleteMany({ sender: req.current_user._id.toString() })
        await Message.deleteMany({ receiver: req.current_user._id.toString() })
        // Message
        res.json('user deleted')
    } catch (err) {
        console.error('Error detele user', err);
        res.json(err)
    }

})

//post a comment
app.post('/comments', async (req, res) => {
    try {
        const newComment = new Comment({
            author: req.current_user._id,
            message: req.body.message,
            img_url: req.body.img_url,
            post: req.body.postId
        })

        const comment = await newComment.save()



        await Post.findByIdAndUpdate(req.body.postId, {
            $push: { comments: comment }
        })


        res.json(comment)


    } catch (err) {
        console.error('Error get post a post ', err);
        res.json(err)
    }
})

//delete a comment
app.delete('/comment/:id', async (req, res) => {

    try {

        const comment = await Comment.findById(req.params.id)

        const postId = comment.post._id.toString()


        if (comment.author._id.toString() !== req.current_user._id.toString()) {
            res.json('You do not have the right to edit this post')
            return
        }


        await Post.findByIdAndUpdate(
            postId,
            { $pull: { comments: comment._id } }
        )

        const post = await Post.findById(postId)
        // console.log('=====Test: ', post.comments);

        const deleteComment = await Comment.findByIdAndDelete(req.params.id)

        // await Comment.deleteMany({ post: req.params.id })

        res.json(req.params.id)


    } catch (err) {
        console.error('Error delete the post ', err)
        res.json(err)
    }
})

//get friends
app.get("/user/:id/friends", async (req, res) => {

    try {
        if (req.current_user._id.toString() !== req.params.id) {
            throw new Error('You do not have right to get this account info')
        }
        const userFriends = await User.findById(req.params.id).populate({
            path: 'following',
            select: ['name', 'email', '_id', 'profilePicture']
        }).populate({
            path: 'followers',
            select: ['name', 'email', '_id', 'profilePicture']
        })

        const friends = { following: userFriends.following, followers: userFriends.followers }

        // console.log('=======friends',friends);

        res.json(friends)

        // res.json(user);
    } catch (err) {
        console.error('Error get user friend', err);
        res.json(err)
    }
});

//======= followe ========
