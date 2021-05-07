const fetch = require("node-fetch");
const bcrypt = require("bcryptjs");

// local function - get by email
async function getUser(email) {
    let response = await fetch('https://young-wildwood-12713.herokuapp.com/api/users/' + email);
    let data = await response.json();
    return data;
}

// exported function - get by username
module.exports.getUserByEmail = function(identifier) {
    return new Promise((res, rej) => {
        getUser(identifier)
        .then(foundUser => {
            if (foundUser.message == "Resource not found") {
                rej("Resource not found");
            }
            res(foundUser);
        })
        .catch(err => {
            rej(err);
        });
    })
}

// local function - get by username
async function getUserByUsername(username) {
    let response = await fetch('https://young-wildwood-12713.herokuapp.com/api/users/name/' + username);
    let data = await response.json();
    return data;
}

// exported function - get by username
module.exports.getUserByUsername = function(identifier) {
    return new Promise((res, rej) => {
        getUserByUsername(identifier)
        .then(foundUser => {
            // check for valid resource
            if (foundUser.message == "Resource not found") {
                rej("Resource not found");
            }
            res(foundUser);
        })
        .catch(err => {
            rej(err);
        });
    })
}

// exported function - authUser, check password
module.exports.authUser = function(userData) {

    return new Promise((res, rej) => {

        getUser(userData.email)
        .then(foundUser => {
            let found_email = false;
            let found_email_idx = 0;
            
            // scrub through the list of emails
            var i;
            for (i = 0; i < foundUser.email.length; i++) {
                // look for non-null emails
                if (foundUser.email[i] == userData.email) {
                    found_email = true;
                    found_email_idx = i;
                }
            }

            // if a valid email was found
            if (found_email) {
                bcrypt.compare(userData.password, foundUser.password).then((passMatch) => {
                    console.log(passMatch);
                    if (passMatch) {
                        res(foundUser);
                    } else {
                        rej("Incorrect Email or Password.");
                    }
                })
            } else {
                rej("Invalid Email.");
            }
        }).catch((err) => {
            rej("Invalid Email or Password");
        })

    });

}
