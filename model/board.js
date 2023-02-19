const mongoose = require('mongoose')

const Thread = require('./thread')

const boardSchema = new mongoose.Schema({
  board_name: {
    type: String,
    required: true
  },
  created_on: Date,
})

module.exports = mongoose.model('Board', boardSchema)