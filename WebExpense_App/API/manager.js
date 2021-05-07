// manager.js
// ¯\_(ツ)_/¯

const mongoose = require("mongoose");
mongoose.set('useNewUrlParser', true);
mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);

var mongodb = require("mongodb");

// imports
const userSchema = require("./msc-user");
const expenseSchema = require("./msc-expense");
const billSchema = require("./msc-bill");
const jointSchema = require("./msc-joint");

module.exports = function() {

    let Users;
    let Expenses;
    let Bills;
    let Joints;

    return {
        connect: function() {
            return new Promise((res, rej) => {

                console.log("Attempting to connect to the database...");

                // attempt to connect
                mongoose.connect("mongodb+srv://dseguin:YJ1BOiSWTWGIvrIg@cluster0.bukmx.mongodb.net/db-expense?retryWrites=true&w=majority", { connectTimeoutMS: 5000, useUnifiedTopology: true });

                var db = mongoose.connection;
                
                db.on('error', (error) => {
                    console.log('Connection error:', error.message);
                    reject(error);
                });

                db.once('open', () => {
                    console.log('Connection to the database was successful');
                    Users = db.model("Users", userSchema, "User");
                    Expenses = db.model("Expenses", expenseSchema, "Expense");
                    Bills = db.model("Bills", billSchema, "Bill");
                    Joints = db.model("Joints", jointSchema, "Joints");
                    res();
                });

            })
        },

        // find all users
        userGetAll: function() {
            return new Promise((res, rej) => {
                Users.find()
                    .sort({ id: 'asc', first_name: 'asc', last_name: 'asc' })
                    .exec((err, users) => {
                        if (err) {
                        // Query error
                        return rej(err.message);
                        }
                        // Found, a collection will be returned
                        return res(users);
                    });
            });
        },

        // find some users (10)
        userGetSome: function() {
            return new Promise((res, rej) => {
                Users.find()
                    .sort({ id: 'asc', first_name: 'asc', last_name: 'asc' })
                    .limit(10)
                    .exec((err, users) => {
                        if (err) {
                        // Query error
                        return rej(err.message);
                        }
                        // Found, a collection will be returned
                        return res(users);
                    });
            });
        },
        
        // find one user by email
        userGetByEmail: function(userEmail) {
            return new Promise((res, rej) => {
                // Find one specific document
                Users.findOne({"email": userEmail}, (err, user) => {
                    if (err) {
                        // Find/match is not found
                        return reject(err.message);
                    }
                    // Check for a user
                    if (user) {
                        // Found, one object will be returned
                        return res(user);
                    } else {
                        return rej('Not found');
                    }
                });
            })
        },

        // find one by user name
        userGetByUsername: function(username) {
            return new Promise((res, rej) => {
                // Find one specific document
                Users.findOne({"username": username}, (err, user) => {
                    if (err) {
                        // Find/match is not found
                        return reject(err.message);
                    }
                    // Check for a user
                    if (user) {
                        // Found, one object will be returned
                        return res(user);
                    } else {
                        return rej(username + ' not found');
                    }
                });
            })
        },

        // user add one
        userAdd: function(newUser) {
            return new Promise((res, rej) => {
                // Create a new user
                Users.create(newUser, (err, addedUser) => {
                    // if there is an error
                    if (err) {
                        return rej(err.message);
                    }

                    // otherwise it was successful, return it
                    return res(addedUser);
                })
            })
        },

        // user edit
        userEdit: function(newUser) {
            return new Promise((res, rej) => {
                Users.findByIdAndUpdate(newUser._id, newUser, {new: true}, (err, user) => {
                    if (err) {
                        return rej(err.message);
                    }
                    if (user) {
                        return res(user);
                    } else {
                        return rej("User not found");
                    }
                })
            })
        },

        // user delete
        userDelete: function(userId) {
            return new Promise((res, rej) => {
                Users.findByIdAndRemove(userId, (err) => {
                    if (err) {
                        return rej(err.message);
                    }
                    return res();
                })
            })
        },

        /* expense functions */

        // expense get all or some
        expenseGetAll: function() {
            return new Promise((res, rej) => {
                Expenses.find().exec((err, items) => {
                    if (err) {
                        return rej(err.message);
                    }
                    return res(items);
                });
            });
        },

                //get single expense by ID
                expenseGetByID: function(expID){
                    return new Promise((res, rej) =>{
                        Expenses.findOne({"_id": expID}, (err, item) => {
                            if (err) {
                                // Find/match is not found
                                return rej(err.message);
                            }
                            // Check for item
                            if (item) {
                                // Found, one object will be returned
                                return res(item);
                            } else {
                                return rej('Not found');
                            }
                        });
                    });
        
                },
        

        // expense get one by user
        expenseGetByUser: function(username, query) {
            // Get query and sort field
            q = {"user": username};
            if (query.startDate && query.endDate) {
                q["date"] = {$gte: query.startDate, $lte: query.endDate};
            }
            if (query.sort) {
                split = query["sort"].split(",");
                split.push("a");
                field = split[0];
                direc = split[1];
                sort = {}
                if (direc == "d") {
                    sort[field] = -1;
                } else {
                    sort[field] = 1;
                }
            } else {
                sort = {"date": -1};
            }
            // Get expenses
            return new Promise((res, rej) => {
                Expenses.find(q).sort(sort).exec((err, items) => {
                    if (err) {
                        return rej(err.message);
                    }
                    return res(items);
                });
            });
        },

        // expense add
        expenseAdd: function(expense) {
            return new Promise((res, rej) => {
                Expenses.create(expense, (err, item) => {
                    if (err) {
                        return rej(err.message);
                    }
                    return res(item);
                });
            });
        },

                //expense edit

                expenseEdit: function(expID, newExp){
                    return new Promise((res, rej) => {
                        Expenses.findByIdAndUpdate(expID, newExp, {new: true}, (err, exp) => {
                            if (err) {
                                return rej(err.message);
                            }
                            if (exp) {
                                return res(exp);
                            } else {
                                return rej("Expense not found");
                            }
                        });
                    });
                },
        
        expenseDelete: function(dbID) {
            return new Promise((res, rej) => {
                Expenses.findByIdAndRemove(dbID, (err) => {
                    if (err) {
                        return rej(err.message);
                    }
                    return res();
                });
            });
        },

        // Get all bills
        billGetAll: function() {
            return new Promise((res, rej) => {
                Bills.find().exec((err, items) => {
                    if (err) {
                        return rej(err.message);
                    }
                    return res(items);
                });
            });
        },

        // Get bills by user
        billGetByUser: function(username, query) {
            // Get query and sort field
            q = {"user": username};
            if (query.dateFrom && query.dateTo) {
                q["date"] = {$gte: query.dateFrom, $lte: query.dateTo};
            } 
            if (query.amountFrom && query.amountTo) {
                q["amount"] = {$gte: query.amountFrom, $lte: query.amountTo};
            }
            if (query.sort) {
                split = query["sort"].split(",");
                split.push("a");
                field = split[0];
                direc = split[1];
                sort = {}
                if (direc == "d") {
                    sort[field] = -1;
                } else {
                    sort[field] = 1;
                }
            } else {
                sort = {"date": 1};
            }
            return new Promise((res, rej) => {
                Bills.find(q).sort(sort).exec((err, items) => {
                    if (err) {
                        return rej(err.message);
                    }
                    return res(items);
                });
            });
        },

        // Get single bill by object ID
        billGetOne: function(billId) {
            return new Promise((res, rej) => {
                // Find one specific document
                Bills.findOne({"_id": billId}, (err, bill) => {
                    if (err) {
                        // Find/match is not found
                        return reject(err.message);
                    }
                    // Check for a bill
                    if (bill) {
                        // Found, one object will be returned
                        return res(bill);
                    } else {
                        return rej('Not found');
                    }
                });
            })
        },

        // Add new bill
        billAdd: function(newBill) {
            return new Promise((res, rej) => {
                // Create a new bill
                Bills.create(newBill, (err, addedBill) => {
                    // if there is an error
                    if (err) {
                        return rej(err.message);
                    }

                    // otherwise it was successful, return it
                    return res(addedBill);
                })
            });
        },

        // Edit bill
        billEdit: function(billId, newBill) {
            return new Promise((res, rej) => {
                Bills.findByIdAndUpdate(billId, newBill, {new: true}, (err, bill) => {
                    if (err) {
                        return rej(err.message);
                    }
                    if (bill) {
                        return res(bill);
                    } else {
                        return rej("Bill not found");
                    }
                });
            });
        },

        // Delete bill
        billDelete: function(billId) {
            return new Promise((res, rej) => {
                Bills.findByIdAndRemove(billId, (err) => {
                    if (err) {
                        return rej(err.message);
                    }
                    return res();
                });
            });
        },

        // Get all joints
        jointGetAll: function() {
            return new Promise((res, rej) => {
                Joints.find().exec((err, items) => {
                    if (err) {
                        rej(err);
                    } else {
                        res(items);
                    }
                });
            });
        },

        // Add joint account
        jointAdd: function(body) {
            return new Promise((res, rej) => {
                let joint;
                if (body.user1 < body.user2) {
                    joint = {user1: body.user1, user2: body.user2};
                } else {
                    joint = {user1: body.user2, user2: body.user1};
                }
                // Create a new joint account
                Joints.create(joint, (err, added) => {
                    // if there is an error
                    if (err) {
                        return rej(err.message);
                    }

                    // otherwise it was successful, return it
                    return res(added);
                })
            });
        },

        // Return users, not joints
        jointGetByUser: function(username) {
            return new Promise((res, rej) => {
                Joints.find({$or: [{user1: username}, {user2: username}]}).exec((err, items) => {
                    if (err) {
                        rej(err.message);
                    } else {
                        users = [];
                        for (let item of items) {
                            if (item.user1 != username) {
                                users.push(item.user1);
                            } else {
                                users.push(item.user2);
                            }
                        }
                        Users.find({"username": users}).exec((error, rets) => {
                            if (error) {
                                res(error.message);
                            } else {
                                res(rets);
                            }
                        });
                    }
                });
            });
        },

        // Delete joint
        jointDelete: function(body) {
            let joint;
            return new Promise((res, rej) => {
                let joint;
                if (body.user1 < body.user2) {
                    joint = {user1: body.user1, user2: body.user2};
                } else {
                    joint = {user1: body.user2, user2: body.user1};
                }
                // Create a new joint account
                Joints.deleteMany(joint, (err, deleted) => {
                    // if there is an error
                    if (err) {
                        rej(err.message);
                    }
                    // otherwise it was successful, return it
                    res();
                })
            });
        }
    }

} // module.exports
