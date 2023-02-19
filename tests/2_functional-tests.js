const chaiHttp = require('chai-http');
const chai = require('chai');
const assert = chai.assert;
const server = require('../server');

chai.use(chaiHttp);

suite('Functional Tests', function () {
  this.timeout(5000)
  let board = "general1"
  let board_id = ""
  let reply_id = ""

  test("POST /api/threads/{board} create a new thread", (done) => {
    let newBoard = {
      board,
      text: "Hello",
      delete_password: "1234"
    }
    chai
      .request(server)
      .post(`/api/threads/${board}`)
      .type('form')
      .send(newBoard)
      .end((err, res) => {
        assert.equal(res.status, 200)
        assert.equal()
        done()
    })
  })
  test("GET /api/threads/{board} view 10 recent threads with 3 replies", (done) => {
    chai
      .request(server)
      .get(`/api/threads/${board}`)
      .end((err, res) => {
        assert.equal(res.status, 200)
        assert.isArray(res.body)
        assert.isAtMost(res.body.length, 10)
        if (res.body.length != 0) {
          assert.property(res.body[0], 'bumped_on')
          assert.property(res.body[0], 'created_on')
          assert.property(res.body[0], 'replies')
          assert.property(res.body[0], 'replycount')
          assert.property(res.body[0], 'text')
          assert.property(res.body[0], '_id')
          // reported and deleted_password will not be sent to the client
          assert.isArray(res.body[0].replies)
          assert.isAtMost(res.body[0].replies.length, 3)
          board_id = res.body[0]._id
        }
        done()
    })
  })
  test("POST /api/replies/{board} create a new reply", (done) => {
    let newReplies = {
      thread_id: board_id,
      text: "this is reply",
      delete_password: "12345"
    }
    chai
      .request(server)
      .post(`/api/replies/${board}`)
      .type('form')
      .send(newReplies)
      .end((err, res) => {
        assert.equal(res.status, 200)
        assert.equal()
        done()
    })
  })
  test("GET /api/replies/{board} view a thread with all replies", (done) => {
    chai
      .request(server)
      .get(`/api/replies/${board}?thread_id=${board_id}`)
      .end((err, res) => {
        assert.equal(res.status, 200)
        assert.isObject(res.body)
        assert.property(res.body, "_id")
        assert.property(res.body, "text")
        assert.property(res.body, "bumped_on")
        assert.property(res.body, "created_on")
        assert.property(res.body, "replies")
        if (res.body.replies != 0) {
          assert.property(res.body.replies[0], 'created_on')
          assert.property(res.body.replies[0], 'text')
          assert.property(res.body.replies[0], '_id')
          reply_id = res.body.replies[0]._id
        }
        done()
    })
  })
  test("PUT /api/replies/{board} report a reply", (done) => {
    let newReplies = {
      board,
      thread_id: board_id,
      reply_id,
    }
    chai
      .request(server)
      .put(`/api/replies/${board}`)
      .type('form')
      .send(newReplies)
      .end((err, res) => {
        assert.equal(res.status, 200)
        assert.equal(res.text, "reported")
        // reported value in reply will be change to true
        done()
    })
  })
  test("PUT /api/threads/{board} report a thread", (done) => {
    let reportedBoard = {
      board,
      thread_id: board_id,
    }
    chai
      .request(server)
      .put(`/api/threads/${board}`)
      .type('form')
      .send(reportedBoard)
      .end((err, res) => {
        assert.equal(res.status, 200)
        assert.equal(res.text, "reported")
        // reported value in thread will be change to true
        done()
    })
  })
  test("DELETE /api/replies/{board} delete a reply with invalid password", (done) => {
    let newReplies = {
      board,
      thread_id: board_id,
      reply_id,
      delete_password: "1234"
    }
    chai
      .request(server)
      .delete(`/api/replies/${board}`)
      .type('form')
      .send(newReplies)
      .end((err, res) => {
        assert.equal(res.status, 200)
        assert.equal(res.text, "incorrect password")
        done()
    })
  })
  test("DELETE /api/replies/{board} delete a reply with valid password", (done) => {
    let newReplies = {
      board,
      thread_id: board_id,
      reply_id,
      delete_password: "12345"
    }
    chai
      .request(server)
      .delete(`/api/replies/${board}`)
      .type('form')
      .send(newReplies)
      .end((err, res) => {
        assert.equal(res.status, 200)
        assert.equal(res.text, "success")
        // text in reply will be change to [deleted]
        done()
    })
  })
  
  test("DELETE /api/threads/{board} delete a thread with invalid password", (done) => {
    let deleteBoard = {
      board,
      thread_id: board_id,
      delete_password: "123"
    }
    chai
      .request(server)
      .delete(`/api/threads/${board}`)
      .type('form')
      .send(deleteBoard)
      .end((err, res) => {
        assert.equal(res.status, 200)
        assert.equal(res.text, "incorrect password")
        done()
    })
  })
  test("DELETE /api/threads/{board} delete a thread with valid password", (done) => {
    let deleteBoard = {
      board,
      thread_id: board_id,
      delete_password: "1234"
    }
    chai
      .request(server)
      .delete(`/api/threads/${board}`)
      .type('form')
      .send(deleteBoard)
      .end((err, res) => {
        assert.equal(res.status, 200)
        assert.equal(res.text, "success")
        done()
    })
  })
});
