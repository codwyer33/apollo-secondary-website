const express = require('express');
const ejs = require('ejs');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const _ = require('lodash');
const bcrypt = require('bcrypt');
const saltRounds = 10;

const app = express();
app.use(express.static('public'));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended:true}));

mongoose.connect("mongodb+srv://admin:SkSBcB1qnCkR2cIH@cluster0-bw7ds.mongodb.net/googlesheetsdb", {useNewUrlParser: true, useUnifiedTopology: true });

const adminSchema = new mongoose.Schema({
  fName:String,
  lName:String,
  password:String,
  email:String,
  permissions:Array
});
const Admin = mongoose.model("Admin", adminSchema);

// const newAdmin = new Admin ({
//   fName:"Clare",
//   lName:"O",
//   password:"_",
//   email:"_"
// });
// newAdmin.save();

const slotSchema = new mongoose.Schema({
  physName:String,
  specialty:String,
  date:Date,
  timeStart:Date,
  timeEnd:Date,
  location:String,
  notes:String,
  testId:String,
  studentName:String,
  studentEmail:String
});
const Slot = mongoose.model("Slot", slotSchema);
// const newSlot = new Slot ({
//   physName:"working"
// });
// newSlot.save();

app.get("/", function(req,res){
  res.render("landing");
});
app.get("/view-slots", function(req,res){
  Slot.find(function(err,slots){
    if(err){
      console.log(err);
    } else {
      res.render("view-slots", {slots:slots});
    }
  })
});

let port = process.env.PORT;
if(port == null || port == ""){
  port=3000;
}

app.listen(port, function() {
  console.log("Server started!");
});
