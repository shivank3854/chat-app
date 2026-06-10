// require('dotenv').config()
const express = require('express')
const http = require('http')
const { Server } = require('socket.io')
const mongoose = require('mongoose')
const Message = require('./models/Message')

const app = express()
const server = http.createServer(app)
const io = new Server(server)

app.use(express.static('public'))

io.on('connection', async (socket) => {
  console.log('A user connected:', socket.id)

  try {
    const messages = await Message.find().sort({ createdAt: 1 }).limit(20)
    socket.emit('load_messages', messages)
  } catch (err) {
    console.log('Error loading messages:', err)
  }

  socket.on('send_message', async (data) => {
    if (!data.text || !data.username) return
    try {
      const message = new Message({
        username: data.username,
        text: data.text
      })
      await message.save()
      io.emit('receive_message', data)
    } catch (err) {
      console.log('Error saving message:', err)
    }
  })

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id)
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