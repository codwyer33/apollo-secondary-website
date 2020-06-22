const express = require('express');
const ejs = require('ejs');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const _ = require('lodash');
const bcrypt = require('bcrypt');
const saltRounds = 10;
const months = ["January","February","March","April","May","June","July","August","September","October","November","December",]

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
  physName: String,
  date: Date,
  timeStart: Date,
  physSpecialty:String,
  timeEnd: Date,
  location:String,
  notes:String,
  testId:String,
  studentName:String,
  studentEmail:String,
  dDate:String,
  dTime:String
});
const Slot = mongoose.model("Slot", slotSchema);
// const newSlot = new Slot ({
//   physName:"working"
// });
// newSlot.save();

const studentSchema = new mongoose.Schema({
  fName:String,
  lName:String,
  password:String,
  email:String,
  appId:String
});
const Student = mongoose.model("Student", studentSchema);


//Currently doesn't work:
function setDisplayValues(slots){
  const newArray = [];
  slots.forEach(function(slot){
    const newSlot = slot;
    if (slot.date){
      // newSlot.date = ;
      console.log(newSlot);
    }
    newArray.push(newSlot);
  });
  return(newArray);
};

//GET
app.get("/", function(req,res){
  res.render("landing");
});
app.get("/view-slots", function(req,res){
  Slot.find(function(err,slots){
    if(err){
      console.log(err);
    } else {
      const xArray = [];
      slots.forEach(function(slot){
        const x = slot;
        if(x.date){
          const xMonth = months[x.date.getMonth()];
          const xDay = x.date.getDate();
          const xYear = x.date.getFullYear();
          x.dDate = xMonth.concat(' ',xDay,', ', xYear);
        }
        if(x.timeStart && x.timeEnd){
          var xTimeStart = x.timeStart.getHours()-3; xTimeStart>12 ? xTimeStart=(xTimeStart-12).toString() : xTimeStart=xTimeStart.toString()
          var xTimeEnd = x.timeEnd.getHours()-3; xTimeEnd>12 ? xTimeEnd=(xTimeEnd-12).toString() : xTimeEnd=xTimeEnd.toString()
          var xTimeSM = x.timeStart.getMinutes().toString(); xTimeSM == "0" ? xTimeSM = "00" : null
          var xTimeEM = x.timeEnd.getMinutes().toString(); xTimeEM == "0" ? xTimeEM = "00" : null
          var ind1 = ''; var ind2 ='';
          x.timeStart.getHours()>12 ? ind1 = "pm" : ind1 = "am"
          x.timeEnd.getHours()>12 ? ind2 = "pm" : ind2 = "am"

          x.dTime = xTimeStart.concat(':',xTimeSM,ind1,' to ', xTimeEnd,':',xTimeEM,ind2);
        }
        xArray.push(x);
      });
      res.render("view-slots", {slots:xArray});
    }
  })
});
app.get("/login", function(req,res){
  res.render("login", {errM:"", errM2:""});
});

//POST
app.post("/create-account", function(req,res){
  const email = req.body.email;
  const password = req.body.password;
  const fName = req.body.fName;
  const lName = req.body.lName;

  Student.findOne({email:email}, function(err, result){
    if(err){
      res.render("login", {errM:"An error occured. Please try again.", errM2:""});
    } else {
      if(result){ //found a user with that email
        res.render("login", {errM:"An account with this email already exists. Please log in.", errM2:""});
      } else { //no user has that email
        bcrypt.hash(password, saltRounds, function(err, hashResult){
          if(err){
            res.render("login", {errM:"An error occured. Please try again.", errM2:""});
          } else {
            const newStudent = new Student ({
              fName:_.capitalize(fName),
              lName:_.capitalize(lName),
              email:email,
              password:hashResult
            });
            newStudent.save(function(err){
              if(err){
                res.render("login", {errM:"An error occured. Please try again.", errM2:""});
              } else {
                Slot.find(function(err,slots){
                  if(err){
                    console.log(err);
                  } else {
                    res.render("home", {user:newStudent, slots:slots});
                  }
                });
              }
            });
          }
        })
      }
    }
  });
});
app.post("/login", function(req,res){ //STUDENT LOGIN
  const email = req.body.email;
  const password = req.body.password;

  Student.findOne({email:email}, function(err, foundUser){
    if(err){
      res.render("login", {errM:"", errM2:"An error occured. Please try again."});
    } else {
      if(!foundUser){ //no user has that email
        res.render("login", {errM:"", errM2:"Username or password was incorrect."});
      } else { //found a user with that email
        bcrypt.compare(password, foundUser.password, function(err, result){
          if(err){
            res.render("login", {errM:"", errM2:"An error occured. Please try again.!"});
          } else {
            if(result){
              Slot.find(function(err,slots){
                if(err){
                  console.log(err);
                } else {
                  res.render("home", {user:foundUser, slots:slots});
                }
              });
            } else {
              res.render("login", {errM:"", errM2:"Username or password was incorrect."});
            }
          }
        })
      }
    }
  });
});


//SERVER
let port = process.env.PORT;
if(port == null || port == ""){
  port=3000;
}

app.listen(port, function() {
  console.log("Server started!");
});
