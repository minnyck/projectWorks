var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var expenseSchema = new Schema({
    user: String,
    date: String,
    amount: Number,
    vendor: String,
    description: String
});

module.exports = expenseSchema;