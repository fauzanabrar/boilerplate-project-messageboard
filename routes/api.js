'use strict';

const Thread = require('../model/thread')
const Board = require('../model/board')
const Reply = require('../model/reply')

const {ObjectId} = require('mongodb')

module.exports = function (app) {
  
  app.route('/api/threads/:board')
    .get(async (req, res) => {
      const board = req.params.board

      let result = []

      const b = await Board.findOne({ board_name: board })
      
      if(b) {
        const t = await Thread.find({ board_id: b._id }).limit(10)
        
        if (t.length !== 0) {
          for (let i of t) {
            let replies = []
            let r = await Reply.find({thread_id: t._id},'-delete_password -thread_id -reported').limit(3)
            if (r.length !== 0) {
              replies = r
              
            }
            result.push({
              _id: i._id,
              bumped_on: i.bumped_on,
              created_on: i.created_on,
              text: i.text,
              replies,
              replycount: replies.length
            })
          }
        }
      }
      
      return res.json(result)

      // Board.findOne({ board_name: board })
      //   .then(doc => {
      //     console.log("Board jalan")
      //     Thread.find({ board_id: (doc._id).toString() })
      //       .limit(10)
      //       .then(docs => {
      //         result = docs.map(d => {
      //           let replies = []

      //           Reply.find({ thread_id: d._id })
      //             .limit(3)
      //             .then(re => {
      //               replies = re.map(r => {
      //                 return {
      //                   _id: r._id,
      //                   text: r.text,
      //                   created_on: r.created_on
      //                 }
      //               })

      //               result.push({
      //                 _id: d._id,
      //                 bumped_on: d.bumped_on,
      //                 created_on: d.created_on,
      //                 text: d.text,
      //                 replies,
      //                 replycount: replies.length
      //               })
      //             })
      //             .catch(err => {
      //               return console.log("reply", err)
      //             })
                
      //           return res.json(result)
      //         })
      //       })
      //       .catch(err => {
      //         return console.log(err)
      //       })
      //   })
      //   .catch(err => {
      //     return console.log(err)
      //   })
        
    })
    .post(async (req, res) => {
      const board = req.params.board
      const text = req.body.text
      const delete_password = req.body.delete_password

      const currentDate = new Date().toISOString()

      const newBoard = {
        board_name: board,
        created_on: currentDate,
      }

      let new_board = await Board.findOneAndUpdate({ board_name: board }, newBoard, { upsert: true, new: true })

      const newThread = {
        bumped_on: currentDate,
        created_on: currentDate,
        text,
        delete_password,
        reported: false,
        board_id: new_board._id
      }

      let new_thread = await Thread.findOneAndUpdate({ text }, newThread, { upsert: true, new: true })

      console.log("Success create a new thread ", new_thread._id)

      // Board.findOneAndUpdate({ board_name: board }, newBoard, { upsert: true, new: true })
      //   .then(new_board => {
      //     const newThread = {
      //       bumped_on: currentDate,
      //       created_on: currentDate,
      //       text,
      //       delete_password,
      //       reported: false,
      //       board_id: new_board._id
      //     }

      //     Thread.findOneAndUpdate({ text, delete_password }, newThread, { upsert: true, new: true })
      //       .then(new_thread => {
      //         return console.log("Success create a new thread ", new_thread._id)
      //       })
      //       .catch(err => {
      //         return console.log("thread error:", err)
      //       })
      //   })
      //   .catch(err => {
      //     return console.log(err)
      //   })
      return res.send("success")
    })
    .put(async (req, res) => {
      const board = req.params.board
      const thread_id = req.body.thread_id

      await Thread.findOneAndUpdate({ _id:thread_id }, {reported: true})

      return res.send("reported")
    })
    .delete(async (req, res) => {
      const board = req.params.board
      const thread_id = req.body.thread_id
      const delete_password = req.body.delete_password

      let thread = await Thread.findOne({ _id: thread_id })

      if (delete_password !== thread.delete_password) {
        
        return res.send("incorrect password")
      }

      return res.send("success")
    });
    
  app.route('/api/replies/:board')
    .get(async (req, res) => {
      const board = req.params.board
      const thread_id = req.query.thread_id

      let new_thread = await Thread.findOne({ _id: thread_id })
      
      if (!new_thread) return console.log("Error new thread")

      let replies = await Reply.find({ thread_id },'-delete_password -thread_id -reported')

      if (!replies) {
        replies = []
      }
      

      let result = {
        _id: thread_id,
        text: new_thread.text,
        bumped_on: new_thread.bumped_on,
        created_on: new_thread.created_on,
        replies
      }

      return res.json(result)
    })
    .post(async (req, res) => {
      const board = req.params.board
      const thread_id = req.body.thread_id
      const text = req.body.text
      const delete_password = req.body.delete_password

      const currentDate = new Date().toISOString()

      // let new_board = await Board.findOne({ board_name: board })

      // if(!new_board) return console.log("Error new board")
      
      
      
      const newReply = {
        text,
        thread_id,
        delete_password,
        created_on: currentDate,
        reported: false,
      }

      let new_reply = await Reply.findOneAndUpdate({ text, thread_id }, newReply, { upsert: true, new: true })

      let new_thread = await Thread.findOneAndUpdate({ _id: thread_id, text }, {bumped_on: currentDate})
      
      // if (!new_thread) return console.log("Error new thread")

      console.log("Success create a new reply ", new_reply._id)

      return res.send("success")

    })
    .put(async (req, res) => {
      const board = req.params.board
      const thread_id = req.body.thread_id
      const reply_id = req.body.reply_id

      await Reply.findOneAndUpdate({ reply_id, thread_id }, {reported: true})

      return res.send("reported")
    })
    .delete(async (req, res) => {
      const board = req.params.board
      const thread_id = req.body.thread_id
      const reply_id = req.body.reply_id
      const delete_password = req.body.delete_password

      let reply = await Reply.findOne({ reply_id, thread_id })
      
      if (delete_password !== reply.delete_password) {
        
        return res.send("incorrect password")
      }
      
      let delete_reply = await Reply.findOneAndUpdate({ reply_id, thread_id }, {text: "[deleted]"})

      return res.send("success")
    });

};
