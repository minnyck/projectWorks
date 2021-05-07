var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var billSchema = new Schema({
    user: String,
    date: Number,
    reminder: Number,
    amount: Number,
    vendor: String,
    description: String
});

module.exports = billSchema;
