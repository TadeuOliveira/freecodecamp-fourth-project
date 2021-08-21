const express = require('express')
const app = express()
const cors = require('cors')
const bodyParser = require("body-parser")

app.use(bodyParser.urlencoded({ extended: "false" }))
app.use(bodyParser.json())

let mongoose
require('dotenv').config()
try {
  mongoose = require("mongoose")
} catch (e) {
  console.error(e)
}

const {Schema} = mongoose
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })

const User = mongoose.model('User',new Schema({
  username: {type: String, required: true}
}))

const Exercise = mongoose.model('Exercise', new Schema({
  description: {type: String, required: true},
  userid: {type: String, required: true},
  duration: {type: Number, required: true},
  date: {type: Date},
}))

app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
})

app.get("/is-mongoose-ok", function (req, res) {
  if (mongoose) {
    res.json({ isMongooseOk: !!mongoose.connection.readyState })
  } else {
    res.json({ isMongooseOk: false })
  }
})

app.post("/api/users", function (req, res) {
  let newuser = new User({
    username: req.body.username 
  })
  newuser.save(function (err, data){
    if(err){
      throw err
      return
    }
    res.json({
      username: data.username,
      _id: data._id
    })
    return
  })
})

app.get("/api/users", function (req, res) {
  User.find({}) 
  .exec(function(err, data){
    if(err){
      throw err
      return
    }
    res.json(data)
  })
})

app.post("/api/users/:_id/exercises", function (req, res) {
  User.find({ _id: req.params._id }, function(err, user){
    if(err){
      res.send(err.message)
      return
    }
    if(!user.length){
      res.send('Unknown userId')
      return
    }
    let new_exercise = new Exercise({
      userid: req.params._id,
      description: req.body.description,
      duration:req.body.duration,
    })
    if(req.body.date) new_exercise.date = req.body.date
    new_exercise.save(function(err, exdata){
      if(err){
        const errmsg = Object.values(err.errors)[0].message
        res.send(errmsg)
        return
      }
      res.json({
        _id: exdata.userid, 
        username: user.username,
        date: exdata.date ? new Date(req.body.date + ' GMT-0300').toDateString() : "", 
        duration: exdata.duration,
        description: exdata.description,
      })
    })
  })
})

app.get("/api/users/:_id/logs", function (req, res) {

  let skipFromTo = (!req.query.from && !req.query.to)
  let limit = Number(req.query.limit)
  let skipLimit = !Number.isInteger(limit) || limit < -1 

  let from = req.query.from ? new Date(req.query.from) : new Date(0)
  let to = req.query.to ? new Date(req.query.to) : new Date(8640000000000000)

  const execCallback = function(err, data){
    if(err){
      throw err
      return
    }
    res.json(data)
    return
  }

  from = from == 'Invalid Date' ? new Date(0) : from
  to = to == 'Invalid Date' ? new Date(8640000000000000) : to

  User.findOne({ _id: req.params._id }, function(err, user){
    if(err){
      console.error(err)
      res.send(err.message)
      return
    }
    if(!user){
      res.send('Unknown userId')
      return
    }

    let query = Exercise.find({ userid: req.params._id })

    if(!skipFromTo) query = query.where('date').gte(from).lte(to)

    if(!skipLimit) query = query.limit(limit)

    query.
      select('-_id -userid -__v').
      exec(function (err, data){
        if(err){
          throw err
          return
        }
        //todo: dar um jeito de converter date pra cada elemento
        responseData = []
        data.forEach(d => {
          let newobj = {
            description: d.description,
            duration: d.duration
          }
          if(d.date) newobj.date = new Date(d.date).toDateString()
          responseData.push(newobj)
        })
        res.json({
          _id: req.params._id,
          username: user.username,
          count: data.length,
          log: responseData,
        })
        return
      })
  })
  return
})

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
