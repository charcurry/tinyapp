const getUserByEmail = function(email, database) {
    for (let user in database) {
        if (database[user].email === email) {
            return database[user];
        }
    }
    return undefined;
};

const urlsForUser = function(id, database) {
    let newURLDatabase = {};
    for (let key in database) {
        if (database[key].userID === id) {
            newURLDatabase[key] = {longURL: database[key].longURL, userID: database[key].userID};
        }
    } return newURLDatabase;
};

function generateRandomString() {
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let result = "";
    for (let i = 0; i < 5; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
}

module.exports = { getUserByEmail, urlsForUser, generateRandomString };