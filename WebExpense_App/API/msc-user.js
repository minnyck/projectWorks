// msc-user.js

var mongoose = require("mongoose");
var Schema = mongoose.Schema;

/*--- Schema ---*/
var userSchema = new Schema({
    username: String,
    email: [String],
    first_name: String,
    last_name: String,
    password: String

});

// export schema
module.exports = userSchema;
/*--- Schema ---*/
