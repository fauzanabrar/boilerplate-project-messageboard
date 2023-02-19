const mongoose = require('mongoose')

const replySchema = new mongoose.Schema({
  created_on: Date,
  text: {
    type: String,
    required: true
  },
  reported: Boolean,
  delete_password: {
    type: String,
    required: true
  },
  thread_id: {
    type: String,
    required: true
  }
})

module.exports = mongoose.model('Reply', replySchema)