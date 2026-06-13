require('dotenv').config()
const express = require('express')
const http = require('http')
const { Server } = require('socket.io')
const mongoose = require('mongoose')
const Message = require('./models/Message')
const Conversation = require('./models/Conversation')

let onlineUsers = {}

const app = express()
const server = http.createServer(app)
const io = new Server(server)

app.use(express.static('public'))
app.use(express.json())
app.use('/uploads', express.static('uploads'))

const uploadRouter = require('./routes/upload')
app.use('/upload', uploadRouter)

io.on('connection', async (socket) => {
  console.log('A user connected:', socket.id)

  // load global messages on connection
  

  // user joins with username
  socket.on('user_join', async (username) => {
    onlineUsers[socket.id] = username
    console.log('Online users:', onlineUsers)
    io.emit('online_users', Object.values(onlineUsers))

    try {
    const messages = await Message.find({ room: 'global' }).sort({ createdAt: 1 }).limit(50)
    socket.emit('load_messages', messages)
  } catch (err) {
    console.log('Error loading messages:', err)
  }

    // load previous conversations for this user
    try {
      const conversations = await Conversation.find({
        participants: username
      }).sort({ lastMessageTime: -1 })
      socket.emit('load_conversations', conversations)
    } catch (err) {
      console.log(err)
    }
  })

  // join private room
  socket.on('join_private_room', async ({ roomId, targetUser }) => {
    socket.join(roomId)
    const currentUser = onlineUsers[socket.id]

    // create conversation if doesn't exist
    let conversation = await Conversation.findOne({
      participants: { $all: [currentUser, targetUser] }
    })
    if (!conversation) {
      conversation = new Conversation({
        participants: [currentUser, targetUser],
        lastMessage: '',
        lastMessageTime: new Date()
      })
      await conversation.save()
    }

    // load private message history
    try {
      const messages = await Message.find({ room: roomId }).sort({ createdAt: 1 }).limit(20)
      socket.emit('load_messages', messages)
    } catch (err) {
      console.log(err)
    }
  })

  // get global messages
  socket.on('get_global_messages', async () => {
    try {
      const messages = await Message.find({ room: 'global' }).sort({ createdAt: 1 }).limit(50)
      socket.emit('load_messages', messages)
    } catch (err) {
      console.log(err)
    }
  })

  // send message
  socket.on('send_message', async (data) => {
    if (!data.text && !data.fileUrl) return
    try {
      const message = new Message({
        username: data.username,
        text: data.text || '',
        fileUrl: data.fileUrl || '',
        fileType: data.fileType || '',
        room: data.room || 'global'
      })
      await message.save()

      // update conversation last message
      if (data.room !== 'global') {
        await Conversation.findOneAndUpdate(
          { participants: { $all: data.room.split('_') } },
          { lastMessage: data.text || '📎 File', lastMessageTime: new Date() }
        )
      }

      if (data.room === 'global') {
        io.emit('receive_message', data)
      } else {
        io.to(data.room).emit('receive_message', data)
      }
    } catch (err) {
      console.log('Error saving message:', err)
    }
  })

  // disconnect
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id)
    delete onlineUsers[socket.id]
    io.emit('online_users', Object.values(onlineUsers))
  })
})

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB Connected!')
    server.listen(3000, () => {
      console.log('Server running on port 3000')
    })
  })
  .catch(err => {
    console.log('Connection failed:', err)
    process.exit(1)
  })