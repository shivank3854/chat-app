const mongoose = require('mongoose')

const conversationSchema = new mongoose.Schema({
  participants: [String], // ['Shivank', 'Rohan']
  lastMessage: { type: String, default: '' },
  lastMessageTime: { type: Date, default: Date.now }
}, { timestamps: true })

module.exports = mongoose.model('Conversation', conversationSchema)