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
          .sort({bumped_on: 'desc'})
          .select('-delete_password -board_id -reported -__v').lean()
        
        result = t.map(doc => {
          if (doc.replies) {
            doc.replies.sort((a, b) => new Date(b.created_on) - new Date(a.created_on))
            
            if (doc.replies.length > 3) {
              doc.replies.length = 3
            }
            doc.replies.forEach(item => {
              delete item["delete_password"]
              delete item["reported"]
              delete item["thread_id"]
              delete item["__v"]
            })

            return doc
          }
        })
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


      return res.redirect(`/b/${board}`)
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
        let new_thread = await Thread.findOne({ _id: thread_id })
          .select('-delete_password -board_id -reported -__v').lean()

        let result = new_thread
        result = {
          ...result,
          replies: result.replies.map(rep => {
            delete rep["delete_password"]
              delete rep["reported"]
              delete rep["thread_id"]
            delete rep["__v"]
            return rep
          })
        }
        if(result.replies.length >= 2){
          result.replies.sort((a,b)=> new Date(a.created_on) - new Date(b.created_on))
        }
        
        return res.json(result)
	     
      } catch (error) {
        console.log("erorr why?",error)
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
	
        let new_reply = new Reply(newReply)

        await new_reply.save()


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
	
	      let reply = await Reply.findOneAndUpdate({ _id:reply_id, delete_password }, {$set:{'text': "[deleted]"}}, {new: true})
	      
	      if (!reply) {
	        return res.send("incorrect password")
	      }

        let thread = await Thread.findOne({_id: thread_id})
        let r = thread.replies.id(reply_id)
        r.text = "[deleted]"
        await thread.save()
	      
	
      } catch (error) {
        console.log(error)
      }
      return res.send("success")
    });

};
