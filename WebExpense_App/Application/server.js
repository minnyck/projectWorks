var fs = require('fs');
eval(fs.readFileSync("./data-service.js")+'');
const dataService = require("./data-service.js");
const dataServiceAuth = require("./data-service-auth");
var express = require("express");
var app = express();
var path = require("path");
var multer = require("multer");
var bodyParser = require("body-parser");
const exphbs= require("express-handlebars");
const ejs = require("ejs");
const fetch = require("node-fetch");
const api = "https://young-wildwood-12713.herokuapp.com/api/"  // Change dat later
const clientSessions = require("client-sessions");

const bcrypt = require("bcryptjs");
const { allowedNodeEnvironmentFlags } = require('process');

// Use public as static folder (don't remove this pls I need it for filtering)
app.use(express.static("public"));

// static assets folder
app.use('/static', express.static(path.join(__dirname, 'public')))

// static assets folder
app.use('/static', express.static(path.join(__dirname, 'public')))

/* image storage */

const crypto = require('crypto');
const mongoose = require('mongoose');
const GridFsStorage = require('multer-gridfs-storage');
const Grid = require('gridfs-stream');
const methodOverride = require('method-override');

//middle ware
app.use(methodOverride('_method'));
app.use(bodyParser.json());

//MongoDB URI
const mongoURI = "mongodb+srv://dseguin:YJ1BOiSWTWGIvrIg@cluster0.bukmx.mongodb.net/db-expense?retryWrites=true&w=majority";

//mongo connection 
const conn = mongoose.createConnection(mongoURI, { useNewUrlParser: true });

// mongoose.set('useNewUrlParser', true);
// mongoose.set('useUnifiedTopology', true);

// init gfs
let gfs;

conn.once('open', () =>{
    gfs = Grid(conn.db, mongoose.mongo);
    gfs.collection('uploads');
});

//create storage engine

const storage = new GridFsStorage({
    url: mongoURI,
    file: (req, file) =>{
        return new Promise((resolve, reject) => {
            crypto.randomBytes(16, (err,buf) => {
                if(err){
                    return reject(err);
                }
                const filename = buf.toString('hex') + path.extname(file.originalname);
                const fileInfo = {
                    filename: filename,
                    bucketName: 'uploads',
                    metadata: {"expenseID" : req.params.expID}
                };
                resolve(fileInfo);
            });
        });
    }
});
const upload = multer({storage});

/* image storage */

var HTTP_PORT = process.env.PORT || 4000;
app.use(bodyParser.urlencoded({extended: true}));

// call this function after the http server starts listening for requests
function onHttpStart() {
  console.log("Express http server listening on: " + HTTP_PORT);
}

app.engine(".hbs", exphbs({
    extname: ".hbs", 
    defaultLayout: "main",
    helpers: {
        navLink: function(url, options){
            return '<li' + 
            ((url == app.locals.activeRoute) ? ' class="active" ' : '') +
            '><a href="' + url + '">' + options.fn(this) + '</a></li>';
        },

        equal: function (lvalue, rvalue, options) {
            if (arguments.length < 3)
                throw new Error("Handlebars Helper equal needs 2 parameters");
            if (lvalue != rvalue) {
                return options.inverse(this);
            } else {
                return options.fn(this);
            }
        }
    }
}));
app.set("view engine", ".hbs");
app.set("view engine", ".ejs");

app.use(bodyParser.urlencoded({ extended: false }));


// Enable CORS
app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS,POST,PUT,DELETE");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
    next();
});

// init userSession
app.use(clientSessions({
    cookieName: "userSession",
    secret: "mongo_bts530",
    duration: 60 * 60 * 1000,
    activeDuration: 60 * 1000
}));

app.use(function(req, res, next) {
    res.locals.userSession = req.userSession;
    next();
})

//setup a "route" to listen on the default url path (http://localhost)
app.get("/", function(req, res){
    res.render("home.hbs", {
        title: "Home"
    });
});

//@route POST /upload
// upload IMAGE file to DB

app.post('/upload/:expID', upload.single('file'), (req, res) => {
    var url = "/expense/" +  req.params.expID;
    res.redirect(url);
 });

//@route GET /files
//@desc display all files in JSON

app.get('/files', (req, res) => {
    gfs.files.find().toArray((err, files) =>{
        //check if files exist
        if(!files || files.length == 0){
            return res.status(404).json({
                err: "No files exist"
            });
        } 

        // files exist
        return res.json(files);
    });
});

//@route GET /files/:filename
//@des display all files in JSON
app.get('/files/:filename', (req, res) => {
    gfs.files.findOne({filename: req.params.filename}, (err, file) =>{
        if(!file || file.length == 0){
            return res.status(404).json({
                err: 'no file exists'
            });
        }

        return res.json(file);
    });
});

//@route GET /image/:filename
//@des display single image in JSON
app.get('/image/:filename', (req, res) => {
    gfs.files.findOne({filename: req.params.filename}, (err, file) =>{
        if(!file || file.length == 0){
            return res.status(404).json({
                err: 'no file exists'
            });
        }
        //check if image
        if(file.contentType === 'image/jpeg' || file.contentType === 'image/png'){
            //read output to browser
            const readstream = gfs.createReadStream(file.filename);
            readstream.pipe(res);

        } else{
            res.status(404).json({
                err: 'Not an image'
            });
        }
    });
});

// @ route DELETE /files/:id
//@desc delete files

app.delete('/files/:expID/:id', (req, res) =>{
    gfs.remove({_id: req.params.id, root: 'uploads'}, (err, gridStore) =>{
        if(err){
            console.log(err);
            return res.status(404).json({err: err});
        }
        var url = "/expense/" +  req.params.expID;
        res.redirect(url);
    });
});

// Get expenses for logged in user
app.get("/expenses", function(req, res){
    if (req.userSession.user) {
        // Convert query back to a string lol
        var quer = "?"
        for (q in req.query) {
            quer = quer + q + "=" + req.query[q] + "&";
        }
        url = api + "expenses/" + req.userSession.profile + quer;
        //console.log(url);
        fetch(url).then(data => 
            data.json()
        ).then(body => {
            res.render("expenses.hbs", {expense: body, username: req.userSession.user.userName, dates: JSON.stringify(body), title: "Expenses"});
        });
    } else {
        res.render("login.hbs", {errorMessage: "The user must login to access the expense page."});
    }
 });


//get individual expenses information
app.get("/expense/:expID", function(req, res) {
    
    if(req.userSession.user){
        url = api + "expenses/" + req.userSession.profile + "/" +  req.params.expID;
        fetch(url).then(data => 
            data.json()
        ).then(viewData => {
            gfs.files.find().toArray((err, files) =>{
                //check if files exist
                if(!files || files.length == 0){
                    res.render( 'expenseE.ejs', {files: false, viewData: viewData});
                } else {
                    files.map(file =>{
                        if((file.contentType === 'image/jpeg' || file.contentType === 'image/png')){
                            file.isImage = true;
                        } else{
                            file.isImage = false;
                        }
                        if(file.metadata.expenseID === req.params.expID){
                            file.isExp = true;
                        }
                        else{
                            file.isExp = false;
                        }
                    });
                    res.render( 'expenseE.ejs', {files: files, viewData: viewData});
                }
            });
            //console.log(req.userSssion.user.userName);

            //res.render("expenseE.ejs", {viewData: viewData});
            //console.log("this should've worked");
        }).catch(() =>{
            res.status(404).send("Expense Not Found");
        });

    } else {
        res.render("login.hbs", {errorMessage: "Timed out. The user must login again."});
    }  
});


// update expense by id
app.post("/expense/:expID/update", function(req, res) {
    data = {"user": req.userSession.user.userName};
    data.date = req.body.date;
    data.amount = req.body.amount;
    data.vendor = req.body.vendor;
    data.description = req.body.description;

    if(req.userSession.user){
        url = api + "expenses/" + req.userSession.profile + "/" +  req.params.expID;
        fetch(url, {
            method: "POST",
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        })
        .then(response => response.json())
        .then(viewData => {
            //console.log(req.userSession.user.userName);
             res.redirect("/expenses");
            //console.log("this should've worked");
        }).catch(() =>{
            res.status(404).send("Expense Not Found");
        });
    } else {
        res.render("login.hbs", {errorMessage: "Timed out. The user must login again."});
    }  
});

// Bills or sumn - somthin somm
app.get("/bills", function (req, res) {
    // check if a user is logged in
    if (req.userSession.user) {
        // Convert query back to a string lol
        // Convert query back to a string lol
        var quer = "?"
        for (q in req.query) {
            quer = quer + q + "=" + req.query[q] + "&";
        }
        url = api + "bills/" + req.userSession.profile + quer;
        fetch(url).then(data => 
            data.json()
        ).then((billsList) => {
            res.render("bills.hbs", {
                title: "Bills",
                bills: billsList, month: "April",
                upcomingBills: billsList.length
            });
        });
    } else {
        res.render("login.hbs", {errorMessage: "The user must login to access the bill page."});
    }
});

app.get("/bills/view/:billid", (req, res) => {
    url = api + "bills/" + req.userSession.profile + "/" + req.params.billid;
        fetch(url).then(data => 
            data.json()
        ).then((bill) => {
            res.render("bill.hbs", {
                title: "Bill",
                myBill: bill
            });
        })
        .catch((err) => {
            res.render("bill.hbs", {
                title: "Bill",
                errorMessage: err
            });
        });
});

// edit bill
app.post("/bills/view/:billId", (req, res) => {
    url = api + "bills/" + req.userSession.user.userName + "/" + req.params.billId;

    // get the data ready for commit
    data = { "user": req.userSession.user.userName };
    data.date = (req.body.date).slice(-2);
    data.reminder = 0;
    data.amount = req.body.amount;
    data.vendor = req.body.vendor;
    data.description = req.body.description;

    fetch(url, {
        method:     'put',
        body:       JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' }
    })
    .then(() => {
        res.redirect("/bills");
    })
});

// Render expense add form
app.get("/expenses/add",  function(req, res) {

    res.render("addExpenses.hbs", {"username": req.userSession.user.userName});

});

// Add expense
app.post("/expenses/add", (req, res) => {
    data = {"user": req.userSession.profile};
    data.date = req.body.date;
    data.amount = req.body.amount;
    data.vendor = req.body.vendor;
    data.description = req.body.description;
    url = api + "expenses";

    fetch(url, {
        method: 'post',
        body:    JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' }
    })
    .then(response => response.json())
    .then(viewData => {
        //console.log(req.userSession.user.userName);
         res.redirect("/expenses");
        //console.log("this should've worked");
    }).catch(() =>{
        res.status(404).send("Expense Not Added");
    });
});

// Delete expense
app.get("/expenses/:expenseID/delete", (req, res) => {
    url = api + "expenses/" + req.userSession.profile + "/" + req.params.expenseID;
    fetch(url, {
        method: "delete"
    }).then(() => {
        res.redirect("/expenses");
    });
});

// Delete bill
app.get("/bills/delete/:billID", (req, res) => {
    url = api + "bills/" + req.userSession.profile + "/" + req.params.billID;
    fetch(url, {
        method: "delete"
    }).then(() => {
        res.redirect("/bills");
    });
});

// Add bill

app.get("/bills/add", (req, res) => {
    res.render("addBill.hbs", {title: "Add Bill"});
});

// Post bill add
app.post("/bills/add", (req, res) => {
    url = api + "bills";
    data = {
        "user": req.userSession.profile,
        "date": req.body.date.substring(8),
        "reminder": 0,
        "amount": req.body.amount,
        "vendor": req.body.vendor,
        "description": req.body.description
    }
    fetch(url, {
        method: "post",
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    }).then(() => {
        res.redirect("/bills");
    });
});

// Redirect to expenses
app.get("/redirect", (req, res) => {
    res.redirect("/expenses");
});

app.get("/login", function(req, res){
    res.render("login.hbs", {title: "Login"});
});

app.post("/login", function(req, res) {
    req.body.userAgent = req.get('User-Agent');
    dataServiceAuth.authUser(req.body)
    .then((user) => {

        req.userSession.user = {
            userName: user.username,
            email: user.email,
            first_name: user.first_name,
            last_name: user.last_name,
            password: "********"
        };

        req.userSession.profile = user.username;

        res.redirect("/landing");

    })
    .catch((err) => {
        console.log("There was an error fetching login info: " + err);
        res.render("login.hbs", {
            errorMessage: err
        })
    });
});

app.get("/register", function(req, res){
    res.render("register.hbs");
});

// register post
app.post("/register", (req, res) => {
    // current session username

    // get api url
    url = api + "users"

    // compile data to send to API
    data = { "username": req.body.username };
    data.email = req.body.email;
    data.first_name = req.body.first_name;
    data.last_name = req.body.last_name;

    // data integrity check

    console.log(data);

    // check if username is taken
    dataServiceAuth.getUserByUsername(data.username)
    .then((foundUser) => {
        // if the username is found in the database and returns a user
        console.log("dupe username detected");
        console.log(foundUser);
        res.render("register.hbs", { errorMessage: "That username is already taken." })
    })
    .catch((err) => {
        // username is not found in the database, check email
        dataServiceAuth.getUserByEmail(data.email)
        .then((foundUser) => {
            // duplicate email found
            console.log("dupe email detected");
            res.render("register.hbs", { errorMessage: "That email is already taken." })
        })
        .catch((err) => {
            // valid user and email for registration
            // password encryption
            bcrypt.hash(req.body.password, 10)
            .then(hash => {
                // store the hash
                data.password = hash;

                // add the user by accessing the api
                fetch(url, {
                    method: 'post',
                    body: JSON.stringify(data),
                    headers: { 'Content-Type': 'application/json' }
                })
                    .then(() => {
                        res.render("login.hbs", {
                            tite: "Login",
                            result: true
                        });
                    })
            })
            .catch(err => {
                console.log(err);
            })
        })
    })
});

app.post("/profile", function(req, res) {
    if (req.userSession.user) {
        // copy of sessioned user
        let authUser = req.userSession.user;

        // change user password
        if (req.body.newPass) {
            console.log("PUT METHOD - Pass change");
            
            // get password
            authUser.password = req.body.oldPass1;

            if (req.body.newPass != req.body.newPassConf) {
                res.render("profile.hbs", {
                    title: "Profile",
                    errorMessagePass: "New password does not match."
                })
            } else {
                dataServiceAuth.authUser(authUser)
                .then((user) => {
                    user.password = req.body.newPass;
                    dataService.editUser(user)
                    .then((user) => {
                        // make censored password and mask it in user session
                        let pass = "";
                        for (i = 0; i < user.password.length; i++) {
                            pass += "*";
                        };
                        req.userSession.user.password = pass;
                        res.render("profile.hbs", {
                            title: "Profile",
                            successMessagePass: "Password successfully changed."
                        })
                    })
                    .catch((err) => {
                        res.render("profile.hbs", {
                            errorMessagePass: "There was an error changing passwords."
                        })
                    });
                })
                .catch((err) => {
                    console.log("There was an error fetching password info: " + err);
                    res.render("profile.hbs", {
                        title: "Profile",
                        errorMessagePass: "Incorrect Password."
                    })
                });
            }
        } else {
            res.render("login.hbs", {errorMessage: "The user must login to access the profile page."});
        }
    }

    // add a new email
    if (req.body.new_email) {
        console.log("PUT METHOD - Add email");

        // get password
        authUser.password = req.body.oldPass2;

        if (req.body.new_email != req.body.new_email_conf) {
            res.render("profile.hbs", {
                errorMessageEmail: "New email does not match."
            })
        } else {
            dataService.editUser(req.body)
            // get the user from the data base
            dataServiceAuth.authUser(authUser)
            .then((user) => {
                // commit changes
                user.email.push(req.body.new_email);
                dataService.editUser(user)
                .then((user) => {
                    // make censored password and mask it in user session
                    let pass = "";
                    for (i = 0; i < user.password.length; i++) {
                        pass += "*";
                    };
                    req.userSession.user.password = pass;
                    res.render("profile.hbs", {
                        successMessageEmail: "Email successfully added."
                    })
                })
                .catch((err) => {
                    res.render("profile.hbs", {
                        successMessageEmail: "There was an error saving the new email."
                    })
                });
            })
            .catch((err) => {
                console.log("There was an error fetching password info: " + err);
                res.render("profile.hbs", {
                    errorMessageEmail: "Incorrect Password."
                })
            });

        }
    }

});

app.get("/logout", (req, res) => {
    req.userSession.reset();
    res.redirect("/");
});

app.get("/landing", function(req, res){
    res.render("landing.hbs");
});

app.get("/profile", function(req, res) {
    if (req.userSession.user) {
        dataService.getJointAccounts(req.userSession.user.userName).then((accs) => {
            for (let account of accs) {
                if (account.username == req.userSession.joint) {
                    account.active = true;
                }
            }
            res.render("profile.hbs", {joints: accs, title: "Profile"});
        }).catch((err) => {
            console.log("Hmmm there was an issue");
            console.log(err);
        });
    } else {
        res.render("login.hbs", {errorMessage: "The user must login to access the profile page."});
    }
});

app.get("/tracking", (req, res) => {
    res.render("tracking.hbs");
});

app.get("/joint", (req, res) => {
    /*
    dataService.getJointAccounts(req.userSession.user.userName).then((accs) => {
        for (let account of accs) {
            if (account.username == req.userSession.joint) {
                account.active = true;
            }
        }
        res.render("profile.hbs", {joints: accs});
    }).catch((err) => {
        console.log("Hmmm there was an issue");
        console.log(err);
    });
    */
   res.redirect("/profile");
});

// Add joint account
app.post("/joint", (req, res) => {
    dataServiceAuth.authUser(req.body)
    .then((user) => {
        //console.log("Current user: " + req.userSession.user.userName);
        //console.log("Joint user: " + user.username);
        if (user.username == req.userSession.user.userName) {
            res.render("profile.hbs", {
                errorMessage: "Cannot create joint account with current user!"
            });
        } else {
            dataService.addJointAccount(req.userSession.user.userName, user.username).then(() => {
                res.redirect("/profile#joint");
            })
        }
    }).catch((err) => {
        /*
        console.log("There was an error fetching login info: " + err);
        res.render("login", {
            layout: false,
            errorMessage: err
        })
        */
       res.render("profile.hbs", {
           errorMessage: err
       });
       console.log("There was an error. This should show up somewhere ig.");
    });
});

// Switch joint account
app.post("/joint/switch", (req, res) => {
    if (req.body.joint) {
        req.userSession.joint = req.body.joint;
        if (req.body.joint < req.userSession.user.userName) {
            req.userSession.profile = req.body.joint + "-" + req.userSession.user.userName;
        } else {
            req.userSession.profile = req.userSession.user.userName + "-" + req.body.joint;
        }
    } else {
        req.userSession.joint = null;
        req.userSession.profile = req.userSession.user.userName;
    }
    res.redirect("/profile#joint");
});

// Close joint account
app.get("/joint/delete/:username", (req, res) => {
    url = api + "joints";
    json = {
        "user1": req.userSession.user.userName,
        "user2": req.params.username
    }
    fetch(url, {
        method: "delete",
        body: JSON.stringify(json),
        headers: { 'Content-Type': 'application/json' }
    }).then(() => {
        res.redirect("/profile#joint");
    });
});

// 404 error - catch all
/* disabled because it's being blocked by "delete expense" route
app.get("/expenses/*", (req, res) => {
    console.log("expenses 404 error");
    res.render("404");
});
*/

// 404 error - catch all
app.get("*", (req, res) => {
    res.render("404.hbs", {
        suggestedFix: "Click here to go back to the application home",
        suggestedLink: "/"
    });
});

// setup http server to listen on HTTP_PORT
app.listen(HTTP_PORT, onHttpStart);

/*
initialize().then(function(msg){
    app.listen(HTTP_PORT, onHttpStart);
 })
 .catch(function(reject_msg){
     console.log(reject_msg);
 });
 */

/*
initialize()
.then(dataServiceAuth.initialize)
.then(function(){
    app.listen(HTTP_PORT, function(){
        console.log("app listening on: " + HTTP_PORT)
    });
 }).catch(function(err){
     console.log("unable to start server: " + err);
 });
*/