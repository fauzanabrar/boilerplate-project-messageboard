const mongoose = require('mongoose')
const mongo = require('mongodb')

const {replySchema} = require('./reply')

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
  },
  replies: [replySchema],
  replycount: Number
}, { autoMarkModified: true })

module.exports = mongoose.model('Thread', threadSchema)