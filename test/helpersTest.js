const { assert } = require("chai");

const { getUserByEmail, urlsForUser } = require("../helpers.js");

const testUsers = {
    "userRandomID": {
        id: "userRandomID", 
        email: "user@example.com", 
        password: "purple-monkey-dinosaur"
    },
    "user2RandomID": {
        id: "user2RandomID", 
        email: "user2@example.com", 
        password: "dishwasher-funk"
    }
};

const testUrls = {
    b6UTxQ: {
        longURL: "https://www.tsn.ca",
        userID: "aJ48lW",
    },
    i3BoGr: {
        longURL: "https://www.google.ca",
        userID: "aJ48lW",
    },
};

describe("getUserByEmail", function() {
    it("should return a user with valid email", function() {
        const user = getUserByEmail("user@example.com", testUsers);
        const expectedUserID = "userRandomID";
        assert.strictEqual(user.id, expectedUserID);
    });
    it("should return undefined", function() {
        const user = getUserByEmail("random@email.com", testUsers);
        const expectedUser = undefined;
        assert.strictEqual(user, expectedUser);
    });
    it("should return a database of urls with valid user", function() {
        const urls = urlsForUser("aJ48lW", testUrls);
        const expectedUrls = {b6UTxQ: {
            longURL: "https://www.tsn.ca",
            userID: "aJ48lW",
        },
        i3BoGr: {
            longURL: "https://www.google.ca",
            userID: "aJ48lW",
        }
        };
        assert.deepEqual(urls, expectedUrls);
    });
    it("should return an empty database with invalid user", function() {
        const urls = urlsForUser("test2", testUrls);
        const expectedUrls = {};
        assert.deepEqual(urls, expectedUrls);
    });
});