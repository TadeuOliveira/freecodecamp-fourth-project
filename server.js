const express = require('express')
const app = express()
const cors = require('cors')
const bodyParser = require("body-parser");

app.use(bodyParser.urlencoded({ extended: "false" }));
app.use(bodyParser.json());

let mongoose;
require('dotenv').config()
try {
  mongoose = require("mongoose");
} catch (e) {
  console.error(e);
}

const {Schema} = mongoose;
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.get("/is-mongoose-ok", function (req, res) {
  if (mongoose) {
    res.json({ isMongooseOk: !!mongoose.connection.readyState });
  } else {
    res.json({ isMongooseOk: false });
  }
});

app.post("/api/users", function (req, res) {
  console.log({request: req.body});
  //let username = req.body.username;
  res.json({});
  return;
})

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
