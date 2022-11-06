const getUserByEmail = function(email, database) {
    for (let user in database) {
        if (database[user].email === email) {
            return database[user];
        }
    }
    return undefined;
};

const urlsForUser = function(id, database) {
    let newURLDatabase = {}
    for (let key in database) {
      if (database[key].userID === id) {
        newURLDatabase[key] = {longURL: database[key].longURL, userID: database[key].userID}
      }
    } return newURLDatabase
  }

module.exports = { getUserByEmail, urlsForUser }