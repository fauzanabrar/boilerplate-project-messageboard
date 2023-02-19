'use strict';

const Thread = require('../model/thread')
const Board = require('../model/board')
const {Reply} = require('../model/reply')

const {ObjectId} = require('mongodb')

module.exports = function (app) {
  
  app.route('/api/threads/:board')
    .get(async (req, res) => {
      const board = req.params.board

      let result = []

      const b = await Board.findOne({ board_name: board })
      
      if(b) {
        const t = await Thread.find({ board_id: b._id })
                              .limit(10)
                              .select('-delete_password -board_id -reported -replies.delete_password -replies.thread_id -replies.reported')
                              .slice('replies', 0, 3).exec()
        
        console.log("disini kah?",t)
        // if (t.length !== 0) {
        //   for (let i of t) {
        //     // let replies = []
        //     // let r = await Reply.find({thread_id: t._id},'-delete_password -thread_id -reported').limit(3)
        //     // if (r.length !== 0) {
        //     //   replies = r
        //     // }
        //     result.push({
        //       _id: i._id,
        //       bumped_on: i.bumped_on,
        //       created_on: i.created_on,
        //       text: i.text,
        //       replies: i.replies,
        //       replycount: i.replycount
        //     })
        //   }
        // }

        
        return res.json(t)
      }
      
      return res.json(result)

        
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

      try {
        let new_board = await Board.findOneAndUpdate({ board_name: board }, newBoard, { upsert: true, new: true })

        const newThread = {
          bumped_on: currentDate,
          created_on: currentDate,
          text,
          delete_password,
          reported: false,
          board_id: new_board._id, 
          replies: [],
          replycount: 0
        }

        let new_thread = await Thread.findOneAndUpdate({ text }, newThread, { upsert: true, new: true })
        console.log("Success create a new thread ", new_thread._id)
      } catch (err) {
        console.log(err)
      }


      return res.redirect(`/b/${board}/`)
    })
    .put(async (req, res) => {
      const board = req.params.board
      const thread_id = req.body.thread_id

      try {
        await Thread.findOneAndUpdate({ _id: thread_id }, { reported: true })
        
      } catch (error) {
        console.log(error)
      }

      return res.send("reported")
    })
    .delete(async (req, res) => {
      const board = req.params.board
      const thread_id = req.body.thread_id
      const delete_password = req.body.delete_password

      try {
        let thread = await Thread.findOne({ _id: thread_id })
      
        if (delete_password !== thread.delete_password) {
          
          return res.send("incorrect password")
        }
    } catch (error) {
      console.log(error)
    }

      return res.send("success")
    });
    
  app.route('/api/replies/:board')
    .get(async (req, res) => {
      const board = req.params.board
      const thread_id = req.query.thread_id

      try {
	      let new_thread = await Thread.findOne({ _id: thread_id }).select('-delete_password -board_id -reported -replies.delete_password -replies.thread_id -replies.reported')
        
        return res.json(new_thread)
	      // if (!new_thread) return console.log("Error new thread")
	
	      // let replies = await Reply.find({ thread_id },'-delete_password -thread_id -reported')
	
	      // if (!replies) {
        //   replies = []
	      // }
	
	      // let result = {
	      //   _id: thread_id,
	      //   text: new_thread.text,
	      //   bumped_on: new_thread.bumped_on,
	      //   created_on: new_thread.created_on,
	      //   replies
	      // }
	
	      // return res.json(result)
      } catch (error) {
        console.log(error)
        return res.send("error")
      }
    })
    .post(async (req, res) => {
      const board = req.params.board
      const thread_id = req.body.thread_id
      const text = req.body.text
      const delete_password = req.body.delete_password

      const currentDate = new Date().toISOString()

      const newReply = {
        text,
        thread_id,
        delete_password,
        created_on: currentDate,
        reported: false,
      }
      try {
	
	      let new_reply = await Reply.findOneAndUpdate({ thread_id }, newReply, { upsert: true, new: true })
        
        let new_thread = await Thread.findOneAndUpdate(
          { _id: thread_id }, 
          { 
            bumped_on: currentDate, 
            $push: {replies: new_reply}, 
            $inc: {replycount: 1} 
          }, { new: true })

        console.log("Success create a new reply ", new_reply._id)
	      
      } catch (error) {
        console.log(error);
      }

      return res.redirect(`/b/${board}/${thread_id}`)

    })
    .put(async (req, res) => {
      const board = req.params.board
      const thread_id = req.body.thread_id
      const reply_id = req.body.reply_id

      try {
	      await Reply.findOneAndUpdate({ _id: reply_id }, {reported: true})
      } catch (error) {
        console.log("error")
      }

      return res.send("reported")
    })
    .delete(async (req, res) => {
      const board = req.params.board
      const thread_id = req.body.thread_id
      const reply_id = req.body.reply_id
      const delete_password = req.body.delete_password

      try {
	
	      let reply = await Reply.findOne({ _id:reply_id, thread_id })
	      
	      if (delete_password !== reply.delete_password) {
	        
	        return res.send("incorrect password")
	      }
	      
	      let delete_reply = await Reply.findOneAndUpdate({ _id: reply_id, thread_id }, {text: "[deleted]"})
	
      } catch (error) {
        console.log(error)
      }

      return res.send("success")
    });

};
