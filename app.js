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
  appId:String,
  group:String
});
const Student = mongoose.model("Student", studentSchema);

//INIT code
var maxSlots = 2;
var allGroups = [];
// var allowedGroups =[];

updateGroups();

function setDisplayValues(slots){
  const xArray = [];
  const sortedSlots = slots.sort((a, b) => a.date - b.date)

  sortedSlots.forEach(function(slot){
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
  return xArray;
};

//FUNCTIONS
function updateGroups(){
  Student.find(function(err, students){
    if(err){
      console.log(err);
    } else {
      var studentGroups = [];
      students.forEach(function(student){
        let duplicate = false;
        let thisStudent = student;
        for (let i = 0; i<allGroups.length; i++){
          if (thisStudent.group == allGroups[i][0]){
            duplicate = true;
            break;
          }
        }
        if (duplicate == false){
          allGroups.push([student.group, true]);
        }
      });

      // Removes duplicate group names
      // for(let i = 0; i<studentGroups.length; i++){
      //   for(let j = i+1; j<a.length; j++) {
      //     if(a[j] == a[i]){
      //       a.splice(j,1);
      //     }
      //   }
      // }
    }
    // allGroups = a;
    // for (let i = 0; i<allGroups.length; i++){
    //   allGroups[i][1] = false;
    // }
  });
}

function setMatchingLocked(student){
  for(let i = 0; i<allGroups.length; i++){
    if(allGroups[i][0] == student.group){
      var matchingLocked = allGroups[i][1];
      console.log(allGroups[i]);
      break;
    }
  }
  return matchingLocked;
}

//GET
app.get("/", function(req,res){
  res.render("landing");
});
app.get("/view-slots", function(req,res){
  Slot.find(function(err,slots){
    if(err){
      console.log(err);
    } else {
      updateGroups();
      const array = setDisplayValues(slots);
      res.render("view-slots", {slots:array, maxSlots:maxSlots, allGroups:allGroups.sort()});
    }
  })
});
app.get("/login", function(req,res){
  res.render("login", {errM:"", errM2:""});
});
app.get("/activate-account", function(req,res){
  res.render("activate-account", {errM:"", errM2:""});
});

//POST
app.post("/activate-account", function(req,res){
  const email = _.toLower(req.body.email);
  const password = req.body.password;
  const fName = req.body.fName;
  const lName = req.body.lName;
  console.log(email);

  Student.findOne({email:email}, function(err, foundUser){
    if(err){
      console.log(err);
      res.render("activate-account", {errM:"An error occured. Please try again or contact apolloyimde@gmail.com."})
    } else { //no error
      if (foundUser){
        if(foundUser.fName){
          res.render("activate-account", {errM:"An account with this email has already been activated. Please use the login page or contact apolloyimde@gmail.com."})
        }else{
          bcrypt.compare(password,foundUser.password, function(err, result){
            if(err){
              console.log(err);
              res.render("activate-account", {errM:"An error occured. Please try again or contact apolloyimde@gmail.com."})
            } else {
              if(result){ //SUCCESS
                Student.updateOne({email:email}, {fName:_.startCase(req.body.fName), lName:_.startCase(req.body.lName)}, function(err){
                  if(err){
                    console.log(err);
                    res.render("activate-account", {errM:"An error occured. Please try again or contact apolloyimde@gmail.com."})
                  } else {
                    Slot.find(function(err,slots){
                      if(err){
                        console.log(err);
                      } else {
                        console.log("SUCCESS");
                        const array = setDisplayValues(slots);

                        res.render("home", {errM:"Account activated!",user:foundUser, slots:array, maxSlots:maxSlots, matchingLocked:setMatchingLocked(foundUser)});
                      }
                    });
                  }
                });
              } else { //wrong password
                res.render("activate-account", {errM: "Incorrect password. Please use the login information sent to you or contact apolloyimde@gmail.com."})
              }
            }
          });
        }
      } else {
        res.render("activate-account", {errM:"Email not found. Please use the login information sent to you or contact apolloyimde@gmail.com."})
      }
    }
  })
});
app.post("/login", function(req,res){ //STUDENT LOGIN
  const email = _.toLower(req.body.email);
  const password = req.body.password;

  Student.findOne({email:email}, function(err, foundUser){
    if(err){
      res.render("login", {errM:"", errM2:"An error occured. Please try again."});
    } else {
      if(!foundUser){ //no user has that email
        res.render("login", {errM:"", errM2:"Username or password was incorrect."});
      } else { //found a user with that email
        if(foundUser.fName){
        bcrypt.compare(password, foundUser.password, function(err, result){
          if(err){
            res.render("login", {errM:"", errM2:"An error occured. Please try again.!"});
          } else {
            if(result){
              Slot.find(function(err,slots){
                if(err){
                  console.log(err);
                } else {
                  // let matchingLocked = setMatchingLocked(foundUser);
                  const array = setDisplayValues(slots);

                  res.render("home", {user:foundUser, slots:array, maxSlots:maxSlots, matchingLocked:setMatchingLocked(foundUser), errM:""});
                }
              });
            } else {
              res.render("login", {errM:"", errM2:"Username or password was incorrect."});
            }
          }
        });
      } else {
        res.render("login", {errM:"", errM2:"Account not activated. Please activate your account or contact apolloyimde@gmail.com."});
      }
      }
    }
  });
});
app.post("/claim", function(req,res){
  const userFName = req.body.userFName;
  const userLName = req.body.userLName;
  const userName = userFName.concat(" ",userLName);
  const userEmail = _.toLower(req.body.userEmail);
  const slotId = req.body.slotId;

  Slot.updateOne({_id:slotId},{studentName:userName, studentEmail:userEmail}, function(err){
    if(err){
      console.log(err);
    } else {
      Student.findOne({email:userEmail},function(err,foundUser){
        if(err){
          console.log(err);
        } else {
          Slot.find(function(err,slots){
            if(err){
              console.log(err);
            } else {
              const array = setDisplayValues(slots);

              res.render("home", {user:foundUser, slots:array, maxSlots:maxSlots, matchingLocked:setMatchingLocked(foundUser),errM:"Successfully matched."});
            }
          });
        }
      });
    }
  });
});
app.post("/unclaim", function(req,res){
  const slotId = req.body.slotId;
  const userEmail = _.toLower(req.body.userEmail);

  Slot.updateOne({_id:slotId},{studentName:null, studentEmail:null}, function(err){
    if(err){
      console.log(err);
    } else {
      Student.findOne({email:userEmail},function(err,foundUser){
        if(err){
          console.log(err);
        } else {
          Slot.find(function(err,slots){
            if(err){
              console.log(err);
            } else {
              const array = setDisplayValues(slots);
              res.render("home", {user:foundUser, slots:array, maxSlots:maxSlots, matchingLocked:setMatchingLocked(foundUser), errM:"Successfully removed slot."});
            }
          });
        }
      });
    }
  });

});
app.post("/admin-maxSlots", function(req,res){
  maxSlots = req.body.maxSlots;
  matchingLocked = req.body.matchingLock;
  const uploadUserArray = req.body.uploadUsers;
  let n = [];
  var uploadUsers = uploadUserArray.split("###");
  for(let i=0; i<uploadUsers.length; i++){
   n.push(uploadUsers[i].split("///"));
  }
  n.forEach(function(user){
    const email = user[0];
    const password = user[1];
    const group = user[2];

    if(email&&password&&group){
      bcrypt.hash(password,saltRounds,function(err,hashedPassword){
        if(err){
          console.log(err);
        } else {
          const newStudent = new Student ({
            email:_.toLower(email),
            password:hashedPassword,
            group:group
          });
          newStudent.save(function(err){
            if(err){
              console.log(err);
            } else {
              console.log("Saved");
            }
          });
        }
      });
    }

  });

  res.redirect("/");
});

app.post("/admin-updateAccess", function(req,res){
  var checkedBoxes = [];

  for (let i = 0; i<allGroups.length; i++) {
    const box = req.body[allGroups[i][0]];
    if(box){
      allGroups[i][1] = true;
    } else {
      allGroups[i][1] = false;
    }
  }
  console.log(allGroups);

  res.redirect("/view-slots");
});


//SERVER
let port = process.env.PORT;
if(port == null || port == ""){
  port=3000;
}

app.listen(port, function() {
  console.log("Server started!");
});
