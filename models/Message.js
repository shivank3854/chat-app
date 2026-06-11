const mongoose = require('mongoose')

const messageSchema = new mongoose.Schema({
  username: { type: String, required: true },
  text: { type: String, default: '' },
  fileUrl: { type: String, default: '' },
  fileType: { type: String, default: '' }
}, { timestamps: true })

module.exports = mongoose.model('Message', messageSchema)