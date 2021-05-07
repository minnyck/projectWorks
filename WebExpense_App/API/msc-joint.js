var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var jointSchema = new Schema({
    user1: String,
    user2: String
});

module.exports = jointSchema;