const fs = require('fs');
const { STRING } = require('sequelize');

const Sequelize = require('sequelize');

const fetch = require("node-fetch");
/*
var sequelize = new Sequelize('d8at98ncneff0f', 'qvxqqczwxuidki', '63ce401358211b05a9ec96741e86b9113c7d1f2b5a13d05c9e76b2314e6b7951', {
    host: 'ec2-107-22-7-9.compute-1.amazonaws.com',
    dialect: 'postgres',
    port: 5432,
    dialectOptions:{
        ssl: {rejectUnauthorized: false}
    }
})

var expense = sequelize.define('expense',{
    expenseNum :{
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    expenseName: Sequelize.STRING,
    expenseAmount: Sequelize.NUMBER,
    expenseDate: Sequelize.STRING,
    vendorName:Sequelize.STRING,
    expenseDesc:Sequelize.STRING
});

//sequelize.authenticate().then(()=>console.log('Connection success.'))
  //      .catch((err) => console.log("Unable to connect to DB.", err));
  */
       
function initialize(){
    // console.log("initializing dataservice");
/*
    return new Promise(function(resolve, reject){ 
        try{
        let db = mongoose.createConnection("mongodb+srv://dbUser:db2745@senecaweb-zvkt2.mongodb.net/test?retryWrites=true&w=majority");

        User = db.model("users", userSchema);
        console.log(User);
        }
        catch(err){
            reject(err);
        }
    
        resolve();  
        */
return new Promise(function(resolve, reject){
   sequelize.sync().then(function(){
       resolve();
   }).catch(function(error){
        reject("Unable to sync to the database");
   });
});

return new Promise(function(resolve, reject){
    reject();
});
}

function getAllExpenses(){

    return new Promise(function(resolve, reject){
    expense.findAll().then(function(data){
        resolve(data);
    }).catch(function(err){
            reject("no results returned");
    });

    });
}

function getExpenseByNum(num){
 
    return new Promise(function(resolve, reject){
        console.log(num);
        expense.findAll({
            where: {
                _id: num
            }
        }).then(function(data){

            console.log("Employee with id" + num);
            resolve(data);

        }).catch(function(err){
            reject("no result returned");
        });
     });   

}


function addExpense(expenseData){
   
   return new Promise(function(resolve, reject){
    for (var prop in expenseData){
        if( expenseData[prop] == ""){
             expenseData[prop] = null;
        }
    }

    expense.create(expenseData).then(function(data){
        
        console.log("Expense added");
        resolve(data);

    }).catch(function(err){
        console.log(expenseData);
        reject("unable to create expense");
    });
});
}

// local function
async function editUser(user) {
    let url = 'https://young-wildwood-12713.herokuapp.com/api/users/' + user._id;
    const response = await fetch(url, {
        method: 'PUT', // *GET, POST, PUT, DELETE, etc.
        mode: 'cors', // no-cors, *cors, same-origin
        cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
        credentials: 'same-origin', // include, *same-origin, omit
        headers: {
          'Content-Type': 'application/json'
          // 'Content-Type': 'application/x-www-form-urlencoded',
        },
        redirect: 'follow', // manual, *follow, error
        referrerPolicy: 'no-referrer', // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
        body: JSON.stringify(user) // body data type must match "Content-Type" header
      });
      return response.json(); // parses JSON response into native JavaScript objects
}

// exported function
module.exports.editUser = function(userData) {

    return new Promise((res, rej) => {

        editUser(userData)
        .then((user) => {
            res(user);
        })
        .catch((err) => {
            rej(err);
        });

    });

}
/*
async function getExpenseByID(username, expID){
    let response = await fetch('https://young-wildwood-12713.herokuapp.com/api/expenses/' + userName + '/' + expID);
    let data = await response.json();
    return data;
}

module.exports.getExpense = function(username, expID){
    return new Promise((res, rej) =>{
        getExpenseByID(username, expID)
        .then()
    });

}
*/


// local function
async function getBillsFromDB(userName) {
    let response = await fetch('https://young-wildwood-12713.herokuapp.com/api/bills/' + userName);
    let data = await response.json();
    return data;
}

module.exports.getBills = function(userName) {
    return new Promise((res, rej) => {
        getBillsFromDB(userName)
        .then(billList => {

            // sort array by date
            // bad bubble sort, but ya kno
            // small -> big
            var i;
            var j;
            for (i = 0; i < billList.length; i++) {
                for (j = 0; j < billList.length - 1; j++) {
                    if (billList[j].date > billList[j+1].date) {
                        // swap the elements
                        var tmp;
                        tmp = billList[j];
                        billList[j] = billList[j+1];
                        billList[j+1] = tmp;
                    }
                }
            }

            res(billList);
        })
        .catch((err) => {
            rej(err);
        });
    });
}

async function getJointsFromDB(username) {
    let response = await fetch('https://young-wildwood-12713.herokuapp.com/api/joints/' + username);
    let data = await response.json();
    return data;
}

module.exports.getJointAccounts = function(username) {
    return new Promise((res, rej) => {
        getJointsFromDB(username).then((users) => {
            res(users);
        });
    });
}

module.exports.addJointAccount = function(user1, user2) {
    json = JSON.stringify({"user1": user1, "user2": user2});
    return new Promise((res, rej) => {
        fetch("https://young-wildwood-12713.herokuapp.com/api/joints", {
            method: "POST",
            headers: {'Content-Type': 'application/json'},
            body: json
        }).then((data) => {
            res();
        })
    });
}