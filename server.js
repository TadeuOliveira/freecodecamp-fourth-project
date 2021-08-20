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
  User.find({}, function(err, data){
    if(err){
      throw err
      return
    }
    res.json({data})
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
      _id: req.params._id,
      description: req.body.description,
      duration:req.body.duration,
      date: req.body.date,
    })
    new_exercise.save(function(err, exercise){
      if(err){
        const errmsg = Object.values(err.errors)[0].message
        res.send(errmsg)
        return
      }
      res.json({
        _id: exercise._id, 
        username: user.username,
        date: exercise.date ? new Date(exercise.date).toDateString() : "", 
        duration: exercise.duration,
        description: exercise.description,
      })
    })
  })
})

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
