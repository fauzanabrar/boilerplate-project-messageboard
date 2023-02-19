const mongoose = require('mongoose')

const Reply = require('./reply')

const threadSchema = new mongoose.Schema({
  bumped_on: Date,
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
  board_id: {
    type: String,
    required: true
  }
})

module.exports = mongoose.model('Thread', threadSchema)