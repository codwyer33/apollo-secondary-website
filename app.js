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


const slotSchema = new mongoose.Schema({
  physName: String,
  date: Date,
  timeStart: String,
  physSpecialty:String,
  timeEnd: String,
  location:String,
  notes:String,
  testId:String,
  studentName:String,
  studentEmail:String,
  dDate:String,
  dTime:String,
  filled: Boolean
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

const logSchema = new mongoose.Schema({
  time:String,
  type:String,
  user:String,
  update:String,
  slot: String
});
const Log = mongoose.model("Log", logSchema);

function makeLog(type, user, update, slot){
  var date = new Date();
  if (slot != " "){
    Slot.findOne({_id:slot}, function(err, foundSlot){
      if (err){
        console.log(err);
      } else {
        const newLog = new Log ({
          time: (1+date.getMonth())+"/"+date.getDate()+" "+date.getHours()+":"+date.getMinutes()+":"+date.getSeconds(),
          type: type,
          user: user,
          update: update, // activated email or slotid
          slot: foundSlot.physName + " "+ foundSlot.timeStart+ " "+foundSlot.date
        });
        newLog.save(function(err){
          if(err){
            console.log(err);
            errorPage(err);
          } else {
            console.log("Log saved");
          }
        });
      }
    });
  }
  
}

//INIT code
var maxSlots = 5;
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
    // if(x.timeStart && x.timeEnd){
    //   var xTimeStart = x.timeStart.getHours()-3; xTimeStart>12 ? xTimeStart=(xTimeStart-12).toString() : xTimeStart=xTimeStart.toString()
    //   var xTimeEnd = x.timeEnd.getHours()-3; xTimeEnd>12 ? xTimeEnd=(xTimeEnd-12).toString() : xTimeEnd=xTimeEnd.toString()
    //   var xTimeSM = x.timeStart.getMinutes().toString(); xTimeSM == "0" ? xTimeSM = "00" : null
    //   var xTimeEM = x.timeEnd.getMinutes().toString(); xTimeEM == "0" ? xTimeEM = "00" : null
    //   var ind1 = ''; var ind2 ='';
    //   x.timeStart.getHours()>12 ? ind1 = "pm" : ind1 = "am"
    //   x.timeEnd.getHours()>12 ? ind2 = "pm" : ind2 = "am"

    //   x.dTime = xTimeStart.concat(':',xTimeSM,ind1,' to ', xTimeEnd,':',xTimeEM,ind2);
    // }
    // console.log(x.timeStart);
    xArray.push(x);
  });
    // console.log(xArray);
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
          allGroups.push([student.group, false]);
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
      // console.log(allGroups[i]);
      break;
    }
  }
  return true; //temporary: if true, matches are allowed. set to false after the session
  return matchingLocked;
}

function errorPage(err){
  res.render("error", {errM:err});
}

//GET
app.get("/", function(req,res){
  res.render("landing");
});
app.get("/admin-login", function(req,res){
  res.render("admin-login", {errM:""});
})
app.get("/login", function(req,res){
  res.render("login", {errM:"", errM2:""});
});
app.get("/activate-account", function(req,res){
  res.render("activate-account", {errM:"", errM2:""});
});
// app.get("/error", function(req,res){
//   res.render("error", {err:"hi"});
// });
app.get('*', function(req, res) {
  res.redirect('/');
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
                        errorPage(err);
                      } else {
                        console.log("SUCCESS");
                        const array = setDisplayValues(slots);
                        makeLog("Activate account", email, email, " ");

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
                  errorPage(err);
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
        res.render("login", {errM:"", errM2:"Account not activated. Please activate your account (https://apolloprogram-match.herokuapp.com/activate-account) or contact apolloyimde@gmail.com."});
      }
      }
    }
  });
});

app.post("/admin-login", function(req,res){
  const email = _.toLower(req.body.email);
  const password = req.body.password;

  Admin.findOne({email:email}, function(err, foundAdmin){
    if(err){
      res.render("admin-login",{errM:"An error occured. Please try again."});
    } else {
      if(foundAdmin){
        bcrypt.compare(password, foundAdmin.password, function(err,result){
          if(err){
            res.render("admin-login",{errM:"An error occured. Please try again."});
          } else {
            if(result){ //success!
              Slot.find(function(err,slots){
                if(err){
                  console.log(err);
                  errorPage(err);
                } else {
                  updateGroups();
                  const array = setDisplayValues(slots);
                  res.render("admin-home", {slots:array, maxSlots:maxSlots, allGroups:allGroups.sort()});
                }
              });
            } else {
              res.render("admin-login",{errM:"Incorrect password."});
            }
          }
        });
      } else {
        res.render("admin-login",{errM:"Email not found."});
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

  Slot.findOne({_id:slotId}, function(err,thisSlot){
    if(err){
      console.log(err);
      errorPage(err);
    } else {
      if (thisSlot.studentEmail){ // in case page isn't reloaded and someone else already claimed the slot
        if (thisSlot.studentEmail.length>0){ // works with new default of "" rather than null
          Student.findOne({email:userEmail},function(err,foundUser){
            if(err){
              console.log(err);
              errorPage(err);
            } else {
              Slot.find(function(err,slots){
                if(err){
                  console.log(err);
                  errorPage(err);
                } else {
                  const array = setDisplayValues(slots);
                  makeLog("Claim: already claimed", userEmail, slotId, slotId);
                  res.render("home", {user:foundUser, slots:array, maxSlots:maxSlots, matchingLocked:setMatchingLocked(foundUser),errM:"This slot was already claimed. Please reload the page frequently to see all available shadow slots."});
                }
              });
            }
          });
        }
      } else { //slot was not already claimed
        Slot.updateOne({_id:slotId},{studentName:userName, studentEmail:userEmail}, function(err){
          if(err){
            console.log(err);
            errorPage(err);
          } else {
            Student.findOne({email:userEmail},function(err,foundUser){
              if(err){
                console.log(err);
                errorPage(err);
              } else {
                Slot.find(function(err,slots){
                  if(err){
                    console.log(err);
                    errorPage(err);
                  } else {
                    const array = setDisplayValues(slots);
                    makeLog("Claim slot", userEmail, slotId, slotId);
                    res.render("home", {user:foundUser, slots:array, maxSlots:maxSlots, matchingLocked:setMatchingLocked(foundUser),errM:"Successfully matched."});
                  }
                });
              }
            });
          }
        });
      }
    }
  });

});

app.post("/unclaim", function(req,res){
  const slotId = req.body.slotId;
  const userEmail = _.toLower(req.body.userEmail);
// IMPORTANT - make this only reset if it is still the same student who is posting
  Slot.updateOne({_id:slotId},{studentName:"", studentEmail:""}, function(err){
    if(err){
      console.log(err);
      errorPage(err);
    } else {
      Student.findOne({email:userEmail},function(err,foundUser){
        if(err){
          console.log(err);
          errorPage(err);
        } else {
          Slot.find(function(err,slots){
            if(err){
              console.log(err);
              errorPage(err);
            } else {
              const array = setDisplayValues(slots);
              makeLog("Unclaim", userEmail, slotId, slotId);
              res.render("home", {user:foundUser, slots:array, maxSlots:maxSlots, matchingLocked:setMatchingLocked(foundUser), errM:"Successfully removed slot."});
            }
          });
        }
      });
    }
  });

});
app.post("/admin-newAccounts", function(req,res){
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
          errorPage(err);
        } else {
          const newStudent = new Student ({
            email:_.toLower(email),
            password:hashedPassword,
            group:group
          });
          newStudent.save(function(err){
            if(err){
              console.log(err);
              errorPage(err);
            } else {
              console.log("Saved");
            }
          });
        }
      });
    }

  });
  // fName /// lName /// email /// password
  const uploadAdmins = req.body.uploadAdmins;
  var adminsArray = uploadAdmins.split("###");
  let m = [];
  for(let i=0; i<adminsArray.length; i++){
    m.push(adminsArray[i].split("///"));
  }
  m.forEach(function(admin){
    const fName = admin[0];
    const lName = admin[1];
    const email = admin[2];
    const password = admin[3];

    if(fName&&lName&&email&&password){
      bcrypt.hash(password,saltRounds,function(err,hashedPassword){
        if(err){
          console.log(err);
          errorPage(err);
        } else {
          const newAdmin = new Admin ({
            fName:fName,
            lName:lName,
            email:_.toLower(email),
            password:hashedPassword
          });
          newAdmin.save(function(err){
            if(err){
              console.log(err);
              errorPage(err);
            } else {
              console.log("Saved");
            }
          });
        }
      });
    }
  })

  res.redirect("/");
});

app.post("/admin-matchSettings", function(req,res){
  maxSlots = req.body.maxSlots;
  matchingLocked = req.body.matchingLock; //not needed?
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

  res.redirect("/");
});

// app.post("/admin-emails", function(req,res){
//   var data = "";
//   Student.find(function(err, users){
//     if(err){
//       console.log(err);
//     } else{
//       for(let i = 0; i<users.length; i++){
//         users[i].fName ? data=data.concat(users[i].fName,"//") : data=data.concat("!null!//")
//         users[i].lName ? data=data.concat(users[i].lName,"//") : data=data.concat("!null!//")
//         users[i].email ? data=data.concat(users[i].email,"//") : data=data.concat("!null!//")
//         users[i].group ? data=data.concat(users[i].group,"//") : data=data.concat("!null!//")
//         // Slot.findOne({studentEmail:users[i].email}, function(err,slots){
//         //   if(err){
//         //     console.log(err);
//         //   } else {
//         //     if(slots){
//         //       data.concat("SLOT HERE!!");
//         // //       dSlots = setDisplayValues(slots)
//         // //       dSlots.forEach(function(thisSlot){
//         // //         data = data.concat(thisSlot.physName,"$$",thisSlot.physSpecialty,"$$");
//         // //         thisSlot.notes ? data=data.concat(thisSlot.notes,"$$") : data=data.concat("!null!$$")
//         // //         data = data.concat("&&");
//         // //       });
//         //     }
//         //   }
//         // });
//         data.concat("##");
//       }
//       console.log(data);
//       res.send(data);
//     }
//   });
// });


//SERVER
let port = process.env.PORT;
if(port == null || port == ""){
  port=3000;
}

app.listen(port, function() {
  console.log("Server started!");
});


// Email string generator test
// var studentEmailList = [];

// Student.find(function(err,students){
//   if(err){
//     console.log(err);
//   } else {
//     students.forEach(function(student){
//       studentEmailList.push([student.email,""]);
//     });

//     Slot.find(function(err,slots){
//       if (err){
//         console.log(err);
//       } else {
//         for(i = 0; i<studentEmailList.length; i++){
//           var thisStudentSlots = [];
//           slots.forEach(function(slot){
//             if(slot.studentEmail == studentEmailList[i][0]){
//               thisStudentSlots.push(slot);
//             }
//           });
//           studentEmailList[i][1] = thisStudentSlots;



//         }
//         // console.log(studentEmailList);
//       }
//     });
//   }
// });

// var confEmails = [];
// Student.find(function(err,students){
//   if(err){
//     console.log(err);
//   } else {
//     allContent = ""
//     Slot.find(function(err,slots){
//       for(var i=0; i<students.length; i++){
//         var thisStudentSlots = [];
//         for (var j=0; j<slots.length; j++){
//           if (slots[j].studentEmail == students[i].email){
//             thisStudentSlots.push("SLOT: " + (slots[j].date.getMonth()+1) + "/" + slots[j].date.getDate() + " from " + slots[j].timeStart + " to " + slots[j].timeEnd + ", with " + slots[j].physName + " (" + slots[j].physSpecialty+"). Location: " + slots[j].location + ". Notes: " + slots[j].notes);
//           }
//         }
//         var content = "";
//         for(var k = 0; k<thisStudentSlots.length; k++){
//           content = content + thisStudentSlots[k] + " ";
//         }
//         // console.log(content);
//         if (content.length < 1){
//           content = "None";
//         }
//         allContent = allContent + content + " ///";
//         // console.log(students[i].email)
//       }
//       console.log(allContent)
//     });
//   }
// });
var physList = ["Bijan Sorouri","Dan Elliott","Debbie Zarek","Ijaz Anwar","Jayshree Tailor","Jeff Cramer","Nancy Fan","Nimesh Mehta","Priya Dixit-Patel","Sangita Modi","Sharad Patel","Shilpa Mehta","Stephen Kushner","Vishal Patel","Alex Bodenstab","Arun Malhotra","Ashesh Modi","Brad Bley","Brian Sarter","Craig Smucker","Damian Andrisani","Drew Brady","Gaetano Pastore","Ganesh Balu","Gregg Goldstein","Gregory Masters","Jagdeep Hundal","James Rubano","Jean Stewart","Jennifer Turano","Jeremie Axe","Joan Coker","John Kelly","Jonathan Romak","Joseph Straight","Ken Lingenfelter","Kieran Connolly","Michael Teixido","Neil Hockstein","Paul Imber","Pawan Rastogi","Prasad Kanchana","Prayus Tailor","Pulak Ray","Randeep Kahlon","Scott Roberts","Tom Barnett","W. Scott Newcomb, DPM","William Sheppard"];
// var physList = ["Alex Bodenstab","Anjala Pahwa","Arlen Stone","Beenish Ahmed","Brian Galinat","Craig Smucker","Debbie Zarek","Drew Brady","Eric Johnson","Evan Lapinsky","Gaurav Jain","Gregg Goldstein","Gregory Masters","Harry Lebowitz","Jagdeep Hundal","James Rubano","Jayshree Tailor","Jean Stewart","Jennifer Turano","Jiao Junfang","Joan Coker","Jonathan Romak","Joseph Straight","Kieran Connolly","Kimberly Rogers","Matthew McCarter","Matt Handling","Michael Teixido","Michael Pushkarewicz","Nancy Fan","Neil Hockstein","Paul Imber","Pawan Rastogi","Prasad Kanchana","Pulak Ray","Rob Winter","Steve Dellose","Steve Rybicki","Stephen Kushner","William Newell","William Sheppard","W. Scott Newcomb, DPM","Ken Lingenfelter"];
// var sList = [["arjankahlon@gmail.com", "Arjan Kahlon"],["anastasiarigas13@gmail.com", "Anastasia Rigas"],["ciannic31@gmail.com", "Cianni Covert"],["so.emily@charterschool.org", "Emily So"],["estherchung0922@gmail.com", "Esther Chung"],["kaurjasleen2004@gmail.com", "Jasleen Kaur"],["ths2263@towerhill.org", "Lauren Kulda"],["pelane2004@gmail.com", "Paige Lane"],["samveda.menon@gmail.com", "Samveda Menon"],["preba0914@icloud.com", "Sariaya Oommen"],["abcholewa1@gmail.com", "Abigail Cholewa"],["adeebaallim@gmail.com", "Adeeba Allimulla"],["guninadrika@gmail.com", "Adrika Gunin"],["raikahlon1@gmail.com", "Amanrai Kahlon"],["amdrushler@gmail.com", "Amelia Drushler"],["acmorlet@gmail.com", "Anais Morlet"]];
// var sList = [["apezzuto@ursuline.org", "Angelina Pezzuto"],["anshdesai46@gmail.com", "Ansh Desai"],["griffbrooke11@gmail.com", "Brooke Griffin"],["ths2360@towerhill.org", "Cameron Haskins"],["cecifant23@ncs.charter.k12.de.us", "Cecilia Fantini"],["celinelourde@hotmail.com", "Celine Lourdemaria"],["charlotte90210@outlook.com", "Charlotte Walder"],["dheedant23@ncs.charter.k12.de.us", "Dheeraj Danthuluri"],["dudhiadiya4@gmail.com", "Diya Dudhia"]];
// var sList = [["annasagaram.meghnaraj@charterschool.org", "Meghna Annasagaram"],["pgedelman@gmail.com", "Paul Edelman"],["puiyee.de@gmail.com", "Puiyee Kong"],["sahasubb23@ncs.charter.k12.de.us", "Saharsh Subbasani"],["chittakone.021@gmail.com", "Samantha Chittakone"],["samraiqbal1013@gmail.com", "Samra Iqbal"],["sindsiva23@ncs.charter.k12.de.us", "Sindhu Sivasankar"],["srijay.chenna@gmail.com", "Srijay Chenna"],["suhabhat23@ncs.charter.k12.de.us", "Suhani Bhatt"],["kedda.tara@charterschool.org", "Tara Kedda"],["vadhera.varun@charterschool.org", "Varun Vadhera"],["wynnkama23@ncs.charter.k12.de.us", "Wynnie Kamau"]];
// var sList = [["sawdeye23@sanfordschool.org", "Eva Sawdey"],["cokerh23@sanfordschool.org", "Helena Coker"],["mancuso.jack@charterschool.org", "Jack Mancuso"],["jasminelee03@gmail.com", "Jasmine Lee"],["johanjc04@gmail.com", "Johan Cheruvannoor"],["kimorahbrisco@gmail.com", "Kimorah Brisco"],["madsrieger@icloud.com", "Madison Rieger"],["s.matthew.haimowitz@redclayschools.com", "Matthew Haimowitz"]];
var sList = [["suveer.ganta@gmail.com", "Suveer Ganta"],["so.emily@charterschool.org", "Emily So "],["ths2263@towerhill.org", "Lauren Kulda "]];
// ["nidhipatel0943@gmail.com", "Nidhi Patel "],
// ["daga.kirti@charterschool.org", "Kirti Daga"],
// ["kaurjasleen2004@gmail.com", "Jasleen Kaur"],
// ["samveda.menon@gmail.com", "Samveda Menon"],
// ["preba0914@icloud.com", "Sariaya Oommen"],
// ["abigail_mclaughlin@yahoo.com", "Abby McLaughlin"],
// ["kyleelev01@gmail.com", "Kylee"],
// ["pelane2004@gmail.com", "Paige Lane"],
// ["eanewcomb16@gmail.com", "Emily Newcomb"],
// ["emilyhaney0@gmail.com", "Emily Haney"],
// ["ameetabalaji23@gmail.com", "Ameeta Balaji"],["anastasiarigas13@gmail.com", "Anastasia Rigas"],
// ["mlrush2123@gmail.com", "Miranda Rush"],
// ["sindhu.narayan20@gmail.com", "Sindhu Narayan"],
// ["mstelyn@gmail.com", "Mackenzie Stelyn"],
// ["ciannic31@gmail.com", "Cianni Covert"],
// ["chizaramogbunamiri@gmail.com", "Chizaram Ogbunamiri "],
// ["ths22117@towerhill.org", "Paige Zhang"],
// ["adhya654@gmail.com", "Adhya Anilkumar "],
// ["priyal.patel.199030@gmail.com", "Priyal Patel"],
// ["lucybtaylor24@gmail.com", "Lucy Taylor"],
// ["elana.agarwal@gmail.com", "Elana Agarwal"],
// ["wes.mah03@gmail.com", "Wesley Mah"],
// ["brahmbhatt.siya@gmail.com", "Siya Brahmbhatt "],
// ["mkounga21@archmereacademy.com", "Maeva Kounga"],
// ["aemsley7@gmail.com", "Abigail Emsley"],
// ["boyapati.shriya@charterschool.org", "Shriya Boyapati "],
// ["estherchung0922@gmail.com", "Esther Chung"],
// ["samraiqbal1013@gmail.com", "Samra Iqbal"],
// ["srijay.chenna@gmail.com", "Srijay Chenna"],
// ["raikahlon1@gmail.com", "Amanrai (Rai) Kahlon"],
// ["cornwallo21@sanfordschool.org", "Liv Cornwall "],
// ["sombaytwail@gmail.com", "Samara Durgadin"],
// ["arjankahlon@gmail.com", "Arjan Kahlon"],
// ["codwyer23@archmereacademy.com", "Clare O'Dwyer"],
// ["puiyee.de@gmail.com", "Puiyee Kong"],
// ["kimraph22@ncs.charter.k12.de.us", "Raphael Kim"],
// ["ciannic31@gmail.com", "Cianni Covert"]];

allContent = ""
Slot.find(function(err,slots){
  for(var i=0; i<physList.length; i++){
    var thisPhysSlots = [];
    for (var j=0; j<slots.length; j++){
      if (slots[j].physName == physList[i]){
        for (var k=0; k< sList.length; k++){
          if (sList[k][0] == slots[j].studentEmail){
            var thisName = sList[k][1]
            thisPhysSlots.push("SLOT: " + (slots[j].date.getMonth()+1) + "/" + slots[j].date.getDate() + " from " + slots[j].timeStart + " to " + slots[j].timeEnd + ", with Dr. " + slots[j].physName + " (" + slots[j].physSpecialty+"). Location: " + slots[j].location + ". Student Name: " + thisName);
            // console.log(thisName+ ",   " + slots[j].studentEmail);
          }
        }
      }
    }
    var content = "";
    for(var k = 0; k<thisPhysSlots.length; k++){
      content = content + thisPhysSlots[k] + " ";
    }
    // console.log(content);
    if (content.length < 1){
      content = "None";
    }
    allContent = allContent + content + " ///";
    // console.log(students[i].email)
  }
  console.log(allContent)
});

// Slot.find(function(err,slots){
//   if(err){
//     console.log(err);
//   } else {
//     for(var i=0; i<slots.length-1; i++){
//       console.log(slots[i].studentEmail + ",    " + slots[i].studentName)

//       // if(slots[i].studentEmail != null){
//       //   Student.find({email:slots[i].studentEmail},function(err, thisStudent){
//       //     Slot.updateOne({_id: slots[i]._id},{studentName: thisStudent.fName + " " + thisStudent.lName},function(err){
  
//       //     });
    
//       //   });
//       // }    
    
//   }
  
// }
// });

// Mon Nov 22 00:00:00 GMT-08:00 2021

// app.post("/admin-newSlots", function(req,res){
//   console.log("here");
//   var slotString = req.body.uploadSlots;
// // slotString = "Alex Bodenstab+++Orthopaedics/Joint Replacement+++Wed Nov 10 00:00:00 GMT-08:00 2021+++1:00 PM+++5:00 PM+++MAP1 Suite 238 4745 Ogletown Stanton Rd Newark DE 19713++++++43";

//   const uploadSlotArray = slotString;
//   let n = [];
//   var uploadSlots = uploadSlotArray.split("###");
//   for(let i=0; i<uploadSlots.length; i++){
//     n.push(uploadSlots[i].split("+++"));
//   }
//   n.forEach(function(slot){
//     const name = slot[0];
//     const specialty = slot[1];
//     const date = slot[2];
//     const start = slot[3];
//     const end = slot[4];
//     const address = slot[5];
//     const notes = slot[6];
//     const id = slot[7];

//     const newSlot = new Slot ({
//       physName: name,
//       date: date,
//       timeStart: start,
//       physSpecialty:specialty,
//       timeEnd: end,
//       location:address,
//       notes:notes,
//       testId:id
//     });
//     var dateobj = new Date(date)
//     console.log(dateobj);
//     newSlot.save(function(err){
//       if(err){
//         console.log(err);
//         errorPage(err);
//       } else {
//         console.log("Saved slot " + id);
//       }
//     });
      
//   });
// });
