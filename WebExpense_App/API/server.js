// default port
var HTTP_PORT = process.env.PORT || 8080;

// modules
var express = require("express");
var bodyParser = require("body-parser");
const path = require("path");

// module addition - by Christina
const crypto = require('crypto');
const mongoose = require('mongoose');
const multer = require('multer');
const GridFsStorage = require('multer-gridfs-storage');
const Grid = require('gridfs-stream');
const methodOverride = require('method-override');


var app = express();

// addition by -Christina
app.set('view engine', 'ejs');
//middlware - Christina
app.use(methodOverride('_method'));


// body parser support for JSON entries
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// data model and manager
const manager = require("./manager.js");
const m = manager();

//MongoDB URI - Chris
const mongoURI = "mongodb+srv://dseguin:YJ1BOiSWTWGIvrIg@cluster0.bukmx.mongodb.net/db-expense?retryWrites=true&w=majority";

//mongo connection - Chris
const conn = mongoose.createConnection(mongoURI);

// init gfs - Chris
let gfs;
// chris
conn.once('open', () =>{
    gfs = Grid(conn.db, mongoose.mongo);
    gfs.collection('uploads');
});

//create storage engine - Chris
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
                    bucketName: 'uploads'
                };
                resolve(fileInfo);
            });
        });
    }
});
const upload = multer({storage});

// setup a 'route' to listen on the default url path - Chris 
app.get("/", (req, res) => {

    gfs.files.find().toArray((err, files) =>{
        //check if files exist
        if(!files || files.length == 0){
            res.render( 'index', {files: false});
        } else {
            files.map(file =>{
                if(file.contentType === 'image/jpeg' || file.contentType === 'image/png'){
                    file.isImage = true;
                } else{
                    file.isImage = false;
                }
            });
            res.render( 'index', {files: files});
        }


        

    });
    //res.sendFile(path.join(__dirname, "/index.html"));

//res.render('index');
});

//Chris
//@route POST /upload
app.post('/upload', upload.single('file'), (req, res) => {
    // res.json({file: req.file});
    res.redirect('/');
 });
 
 //@route GET /files
 //@des display all files in JSON
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
 
 app.delete('/files/:id', (req, res) =>{
     gfs.remove({_id: req.params.id, root: 'uploads'}, (err, gridStore) =>{
         if(err){
             console.log(err);
             return res.status(404).json({err: err});
         }
 
         res.redirect('/');
     });
 });

// Chris


// Resources available
app.get("/api", (req, res) => {
    const links = [];
    // This app's resources...
    links.push({ "rel": "collection", "href": "/api/users", "methods": "GET" });
    links.push({ "rel": "collection", "href": "/api/users_10", "methods": "GET" });
    links.push({ "rel": "collection", "href": "/api/users/:email", "methods": "GET" });
    links.push({ "rel": "collection", "href": "/api/users/:userId", "methods": "GET" });
    links.push({ "rel": "collection", "href": "/api/users", "methods": "POST" });
    links.push({ "rel": "collection", "href": "/api/users/:userId", "methods": "PUT" });
    links.push({ "rel": "collection", "href": "/api/users/:userId", "methods": "DELETE" });

        //expense api
        links.push({ "rel": "collection", "href": "/api/expenses", "methods": "GET" });
        links.push({ "rel": "collection", "href": "/api/expenses/:username", "methods": "GET" });
        links.push({ "rel": "collection", "href": "/api/expenses/:username/:expID", "methods": "GET" });
        links.push({ "rel": "collection", "href": "/api/expenses", "methods": "POST" });
        links.push({ "rel": "collection", "href": "/api/expenses/:username/:expId", "methods": "POST" });
        links.push({ "rel": "collection", "href": "/api/expenses/:user/:expenseID", "methods": "DELETE" });

    links.push({ "rel": "collection", "href": "/api/bills", "methods": ["GET", "POST"] });
    links.push({ "rel": "collection", "href": "/api/bills/:userId", "methods": "GET" });
    links.push({ "rel": "collection", "href": "/api/bills/:userId/:billId", "methods": ["GET", "PUT", "DELETE"] });
    // Example resources...

    const linkObject = { 
      "apiName": "Personal Expense Users Collection",
      "apiDescription": "Web API for a BTS530 group project",
      "apiVersion": "1.0", 
      "apiAuthor": "Wilmer Kwong",
      "links": links
    };
    res.json(linkObject);
});

/* dynamic examples */

// create user ex
app.get("/api/signup", (req, res) => {
    res.sendFile(path.join(__dirname, "/user-sign-up.html"));
});

// Get all
app.get("/api/users", (req, res) => {
    // call manager method
    m.userGetAll()
        .then((data) => {
            res.json(data);
        })
        .catch((err) => {
            res.status(500).json({ "message": err});
        })
});

// Get some (preview users)
app.get("/api/users_10", (req, res) => {
    // call manager method
    m.userGetSome()
        .then((data) => {
            res.json(data);
        })
        .catch((err) => {
            res.status(500).json({ "message": err});
        })
});

// Get one by email
app.get("/api/users/:email", (req, res) => {
    // call manager method
    m.userGetByEmail(req.params.email)
        .then((data) => {
            res.json(data);
        })
        .catch(() => {
            res.status(404).json({ "message": "Resource not found" });
        })
});

// Get one by username
app.get("/api/users/name/:username", (req, res) => {
    // call manager method
    m.userGetByUsername(req.params.username)
        .then((data) => {
            res.json(data);
        })
        .catch(() => {
            res.status(404).json({ "message": "Resource not found" });
        })
});

// Add new user
app.post("/api/users", (req, res) => {
    // call manager method
    m.userAdd(req.body)
        .then((data) => {
            res.json(data);
        })
        .catch((err) => {
            res.status(500).json({ "message": err });
        })
});

// Edit existing user
app.put("/api/users/:userId", (req, res) => {
    // call manager method
    m.userEdit(req.body)
        .then((data) => {
            res.json(data);
        })
        .catch((err) => {
            res.status(404).json({ "message": err });
        })
});

// Delete a user
app.delete("/api/users/:userId", (req, res) => {
    m.userDelete(req.params.userId)
        .then(() => {
            res.status(204).end();
        })
        .catch((err) => {
            res.status(404).json({ "message": err });
        })
});

/* expense routes */

// Get all expenses
app.get("/api/expenses", (req, res) => {
    m.expenseGetAll().then((data) => {
        res.json(data);
    }).catch((err) => {
        res.status(500).json({ "message": err});
    });
});

//Get expenses by ID -christina
app.get("/api/expenses/:username/:expID", (req, res) =>{
    m.expenseGetByID(req.params.expID).then((data) =>{
       // res.render('exp', {expense: data});
        res.json(data);
    }).catch((err) => {
        res.status(500).json({ "message": err});
    });
});


// update expenses by ID - Christina
// Edit existing Expense
app.post("/api/expenses/:username/:expId", (req, res) => {
    m.expenseEdit(req.params.expId, req.body).then((data) => {
       // res.render('exp.ejs', {expense: data});
        res.json(data);
        //res.redirect('/');
    }).catch((err) => {
        res.status(404).json({ "message": err });
    });
});


// Get expenses by user
app.get("/api/expenses/:username", (req, res) => {
    m.expenseGetByUser(req.params.username, req.query).then((data) => {
        res.json(data);
    }).catch((err) => {
        res.status(500).json({ "message": err});
    });
});


// Add expense
app.post("/api/expenses", (req, res) => {
    m.expenseAdd(req.body).then((data) => {
        res.json(data);
    }).catch((err) => {
        res.status(500).json({"message": err});
    });
});

// Delete expense
app.delete("/api/expenses/:user/:expenseID", (req, res) => {
    m.expenseDelete(req.params.expenseID)
        .then(() => {
            res.status(204).end();
        })
        .catch((err) => {
            res.status(404).json({ "message": err });
        });
});

// Get all bills
app.get("/api/bills", (req, res) => {
    m.billGetAll().then((data) => {
        res.json(data);
    }).catch((err) => {
        res.status(500).json({ "message": err});
    });
});

// Get bills by user
app.get("/api/bills/:username", (req, res) => {
    m.billGetByUser(req.params.username, req.query).then((data) => {
        res.json(data);
    }).catch((err) => {
        res.status(500).json({ "message": err});
    });
});


// Get bills by username/object id
app.get("/api/bills/:username/:billId", (req, res) => {
    m.billGetOne(req.params.billId).then((data) => {
        res.json(data);
    }).catch((err) => {
        res.status(500).json({ "message": err});
    });
});

// Add new bill
app.post("/api/bills", (req, res) => {
    m.billAdd(req.body).then((data) => {
        res.json(data);
    }).catch((err) => {
        res.status(500).json({ "message": err });
    });
});

// Edit existing bill
app.put("/api/bills/:username/:billId", (req, res) => {
    m.billEdit(req.params.billId, req.body).then((data) => {
        res.json(data);
    }).catch((err) => {
        res.status(404).json({ "message": err });
    });
});

// Delete existing bill
app.delete("/api/bills/:username/:billId", (req, res) => {
    m.billDelete(req.params.billId).then((data) => {
        res.status(204).end();
    }).catch((err) => {
        res.status(404).json({ "message": err });
    });
});

// Get all joint accounts
app.get("/api/joints", (req, res) => {
    m.jointGetAll().then((data) => {
        res.json(data);
    });
});

// Add joint account
app.post("/api/joints", (req, res) => {
    m.jointAdd(req.body).then((data) => {
        res.redirect("/api/joints");
    }).catch((err) => {
        res.status(500).json({ "message": err });
    });
});

// Get joint by user
app.get("/api/joints/:username", (req, res) => {
    m.jointGetByUser(req.params.username).then((data) => {
        res.json(data);
    }).catch((err) => {
        res.status(500).json({ "message": err });
    });
});

// Delete joint
app.delete("/api/joints", (req, res) => {
    m.jointDelete(req.body).then((data) => {
        res.status(204).end();
    }).catch((err) => {
        res.status(404).json({ "message": err });
    });
});

// resource not found
app.use((req, res) => {
    res.status(404).send("Resource not found");
});

m.connect().then(() => {
    app.listen(HTTP_PORT, () => { console.log("Ready to handle requests on port " + HTTP_PORT) });
}).catch((err) => {
    console.log("Unable to start the server:\n" + err);
    process.exit();
});
  
