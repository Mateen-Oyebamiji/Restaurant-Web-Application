//initializing  and modules
const express = require('express');
const session= require('express-session');
const pug =require("pug");
const mongoose = require('mongoose');
const MongoDBStore = require('connect-mongo');

//initializing more modules
const fs= require('fs');
const app = express();
const path = require('path');
const { send } = require('process');
const PORT = process.env.PORT || 3000;
 
app.use(express.json());
app.use(express.urlencoded({extended:true}));
const ObjectId = require('mongodb').ObjectId; 

//Global variable
let orderId= 1001;

/** setting session store */
const store = new MongoDBStore({
    mongoUrl: "mongodb://localhost:27017/a4",
    collection: "sessions"
});
store.on('error',(error)=>{ console.log(error)});


/** Helper functions */
/** Handles and sends javascript files to the server */
function sendJS(response, filename){
    fs.readFile(`./${filename}`,(err,data) =>{
        if(err) return sendResponse(response,500,"server-error");
        response.setHeader("Content-Type","application/javascript");
        sendResponse(response,200,data);
         
    })
}
/** Handles and sends javascript files from a specific folder to the server */
function sendJS2(response, filename){
    fs.readFile(`./public/${filename}`,(err,data) =>{
        if(err) return sendResponse(response,500,"server-error");
        response.setHeader("Content-Type","application/javascript");
        sendResponse(response,200,data);
         
    })
}
/** Handles and sends image files from a specific folder to the server */
function sendPNG(response,filename){
    fs.readFile(`./public/${filename}`,(err,data) =>{
        if(err) return sendResponse(response,500,"server-error");
        response.setHeader("Content-Type","image/png");
        sendResponse(response,200,data);
    })
}

/**sends the respose to server for a request */
function sendResponse(response, statusCode, data){
    response.statusCode =statusCode;
    response.write(data);
    response.end();
}

/** setting up session object */
app.use(
    session({
        name: 'a4-session',
        secret: 'some secret key here',
        cookie:{maxAge: 1000*60*60*3},
        resave: true,
        store: store,
        saveUninitialized: false,
    })
)

/** log requests recieved */
app.use(function(req, res, next){
    console.log(req.session);
    next();
})

/** Routing */
//handles get request for the home page
app.get("/",(req,res)=>{
    res.statusCode=200;
    res.setHeader("content-Type","text/html");
    if(req.session.loggedin){
        res.send(pug.renderFile("./views/homelog.pug",{session: req.session}));
        return;
    }
    res.send(pug.renderFile("./views/home.pug"));
     


})


/**  handles login requests */
app.route("/login")
    .get((req,res)=>{                //get request for login page
        if(req.session.loggedin){
            //res.status(200).send('Already logged in.');
            res.redirect("/");
            return;
        }
        
        res.status(200).send(pug.renderFile('./views/login.pug'));
    })
    .post((req,res)=>{                       //post request for login functionality
        let username=req.body.username;
        let password= req.body.password;

        if(req.session.loggedin){
            res.status(201).send('Already logged in.');
            return;
        }

        db.collection("users").findOne({username: username}, function(err,result){
            if(err) throw err;

            if(result == null){
                res.status(401).send("invalid username or password");
                return;
            }

            if(result.password == password){
                req.session.loggedin=true;
                req.session.username = username;
                req.session.userid = result._id;
                res.status(200).send('logged in.');
                return;
            }
            else{
                res.status(401).send("invalid username or password");
                return;
            }
        })

        
    })

//get request for javascript file
app.get("/login.js",(req,res)=>{
    sendJS(res,"login.js");
})

/** Handles request for logout */
app.route("/logout")
.get((req,res)=>{
    if(req.session.loggedin){
        req.session.loggedin= false;
        req.session.username=undefined;
        req.session.destroy();
        res.redirect("/");
    }else{
        res.status(200).send("cannot log out, as user is not logged in");
    }
})

/** Handles request for registration */
app.route("/register")  
.get((req,res)=>{                   //get request for registeration page
    if(req.session.loggedin){
        res.status(403).send("Forbidden, user already registered");
        return;
    } else{
        res.statusCode=200;
        res.setHeader("content-Type","text/html");
        res.send(pug.renderFile("./views/register.pug"));
    }
})
.post((req,res)=>{                     //post request for registeration function
    let username=req.body.username;
    let password= req.body.password;
    if(req.session.loggedin){
        res.status(403).send("Forbidden, user already registered");
        return;
    }

    db.collection("users").findOne({username: username}, function(err,result){
        if(err) throw err;

        if(result==null){
            db.collection("users").insertOne({_id:ObjectId(),username:username,password:password,privacy:false,order:[]},function(err,result2){
                if(err) throw err;
                req.session.loggedin=true;
                req.session.username = username;
                req.session.userid = result2._id;
                res.status(200).send('logged in.');
                return;

            })
        }
        else{
            res.status(401).send("user already exists");
        }
    })


})

//Handles get request for a javascript file
app.get("/register.js",(req,res)=>{
    sendJS(res,"register.js");
})

// Handles users page functionality
app.get("/users",(req,res)=>{
    db.collection("users").find({privacy: false}).toArray(function(err,results){
        if(err) throw err;

        if(req.query.name != undefined){
            let search=req.query.name.toLowerCase();
            let arr=[];
            for(const res in results){
                if(results[res].username.includes(search)){
                    arr.push(results[res])
                }
            }
            res.send(pug.renderFile("./views/users.pug",{res:arr,ses:req.session}))
            return;
        }
        res.statusCode=200;
        res.setHeader("content-Type","text/html");
        res.send(pug.renderFile("./views/users.pug",{res:results,ses:req.session}));

    })
})

// Handles get request for a javascript file
app.get("/users/privacy.js",(req,res)=>{
    sendJS(res,"privacy.js");
})

//Handles functionality for user profile
app.get("/users/:userID",(req,res)=>{
    db.collection("users").findOne({_id: ObjectId(req.params.userID)},function(err,result){
        if(err) throw err;

        if(result !=null){
            if(result.privacy == true){
                if(req.session.username == result.username){
                    res.statusCode=200;
                    res.setHeader("content-Type","text/html");
                    res.send(pug.renderFile("./views/userprofile.pug",{res:result,ses:req.session}));
                    return;
                }
                else{
                    res.status(403).send("You are not authorized to see this profile");
                    return;
                }
            }
            else{
                if(req.session.username == result.username){
                    res.statusCode=200;
                    res.setHeader("content-Type","text/html");
                    res.send(pug.renderFile("./views/userprofile.pug",{res:result,ses:req.session}));
                    return;
                }
                res.status(200).send(pug.renderFile('./views/profile.pug',{res:result,ses:req.session}));
                return;
            }
        } else{
            res.status(404).send("cannot find this profile");
            //console.log(result);
            return;
        }
    })
})

// updates user profile settings
app.put("/users/:userID",(req,res)=>{
    if(req.body.On == true){
        db.collection("users").updateOne({_id: ObjectId(req.params.userID)}, {$set: {privacy: true}}, function(err,result){
            if(err) throw err
        })
    } else{
        db.collection("users").updateOne({_id: ObjectId(req.params.userID)}, {$set: {privacy: false}}, function(err,result){
            if(err) throw err
        })
    }
    res.status(201).send("UPDATED");
})

// Handles get request for user profile page(header)
app.get("/profile",(req,res)=>{
    if(req.session.loggedin){
        db.collection("users").findOne({username: req.session.username},function(err,result){
            res.redirect("/users/"+result._id);
            return
        })
        //res.redirect("/users/"+req.session.userid);
        //return
    }
    else{
        res.status(401).send("Unauthorized,You are not logged in");
    }

})

// renders order form
app.get("/order",(req,res)=>{
    if(req.session.loggedin){
        res.status(200).send(pug.renderFile('./views/orderform.pug',{ses:req.session}));
    }
    else{
        res.status(401).send("Unauthorized,You are not logged in");
    }
})

// saves order into the database
app.post("/orders",(req,res)=>{
    if(req.session.loggedin){
        let info=req.body;
        info.username= req.session.username;
        info.orderId= ObjectId();
        orderId++;
        db.collection("users").updateOne({username: req.session.username},{$push:{order: info}},function(err,result){
            if(err) throw err
        })
        res.status(200).send("Order added");

        
    }
    else{
        res.status(401).send("Unauthorized,You are not logged in");
    }
})

// Handles individual order pages
app.get("/orders/:orderID",(req,res)=>{
    db.collection("users").find({}).toArray(function(err,result){
        if(err) throw(err)
        let data;
         
        for(const elem of result){
            if(elem.order.length !=0){
                for(const elem2 of elem.order){
                    if(elem2.orderId == req.params.orderID){
                        data=elem2;
                         
                    }
                }
            }
        }
         
        if(data != null){
            db.collection("users").findOne({username:data.username},function(err,result2){
                if(err) throw err;

                if(result2.privacy == true){
                    if(req.session.username == result2.username){
                        res.status(200).send(pug.renderFile('./views/order.pug',{ses:req.session,data:data}));
                        return;
                    }
                    else{
                        res.status(401).send("Permissions needed to access private profile")
                        return;
                    }
                }
                else {
                    res.status(200).send(pug.renderFile('./views/order.pug',{ses:req.session,data:data}));
                    return;
                }
                 
            })
        }
    })

})

// Handles get request for a javascript file
app.get("/orderform.js",(req,res)=>{
    sendJS2(res,"orderform.js");
})
//Handles get request for an image file
app.get("/add.png",(req,res)=>{
    sendPNG(res,"add.png");
})
//handles get request for an image file
app.get("/remove.png",(req,res)=>{
    sendPNG(res,"remove.png");
})








/** Setting up Mongodb and server connection */

mongoose.connect('mongodb://localhost:27017/a4',{useNewUrlParser: true,useUnifiedTopology: true});

let db = mongoose.connection;
db.on('error',console.error.bind(console, 'Error connecting to database'));
db.once('open',function(){
     
    app.listen(3000);
    console.log("Server listening at http://localhost:3000");
});
 
