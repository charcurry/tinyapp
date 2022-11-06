const { getUserByEmail, urlsForUser, generateRandomString } = require("./helpers");
const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const cookieSession = require("cookie-session");
const bcrypt = require("bcryptjs");

app.set("view engine", "ejs");
app.use(cookieSession({
    keys: ["secretkey"],

    // Cookie Options
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
}));

app.use(express.urlencoded({ extended: true }));

const urlDatabase = {
    b6UTxQ: {
        longURL: "https://www.tsn.ca",
        userID: "aJ48lW",
    },
    i3BoGr: {
        longURL: "https://www.google.ca",
        userID: "aJ48lW",
    },
};

const users = {
    userRandomID: {
        id: "userRandomID",
        email: "user@example.com",
        password: "purple-monkey-dinosaur",
    },
    user2RandomID: {
        id: "user2RandomID",
        email: "user2@example.com",
        password: "dishwasher-funk",
    },
};

//test path
app.get("/", (req, res) => {
    res.send("Hello!");
});

app.listen(PORT, () => {
    console.log(`Example app listening on port ${PORT}!`);
});

//test path
app.get("/urls.json", (req, res) => {
    res.json(urlDatabase);
});


//test path
app.get("/hello", (req, res) => {
    res.send("<html><body>Hello <b>World</b></body></html>\n");
});

//logs the user in, or gives an error
app.post("/login", (req, res) => {
    let user = getUserByEmail(req.body.email, users);
    if (user === undefined) {
        res.send("<html><body>Error 403: User not registered</body></html>\n");
    } else if (bcrypt.compareSync(req.body.password, user.password) !== true) {
        res.send("<html><body>Error 403: Password is incorrect</body></html>\n");
    } else {
        req.session.user_id = user.id;
        return res.redirect("/urls");
    }
});

//renders the urls page or sends an error if the user is not logged in
app.get("/urls", (req, res) => {
    const templateVars = { urls: urlsForUser(req.session.user_id),
        user: users[req.session.user_id]};
    if (typeof templateVars.user === "undefined") {
        res.send("<html><body>Error: User Must Be Logged In To View URLs</body></html>\n");
    } else {
        res.render("urls_index", templateVars);
    }
}); 

//creates a new shortened url and goes to its page
app.post("/urls", (req, res) => {
    const templateVars = { user: users[req.session.user_id] };
    if (typeof templateVars.user === "undefined") {
        res.send("<html><body>Error: User Must Be Logged In To Shorten URLs</body></html>\n");
        return;
    } else {
        const shortURL = generateRandomString();
        urlDatabase[shortURL] = {longURL: req.body.longURL, userID: req.session.user_id};
        const key = Object.keys(urlDatabase).find(key => urlDatabase[key].longURL === req.body.longURL);
        return res.redirect("/urls/" + key);
    }
});

//renders the page for making a new url if the user is logged in
app.get("/urls/new", (req, res) => {
    const templateVars = { user: users[req.session.user_id] };
    if (typeof templateVars.user === "undefined") {
        return res.redirect("/login");
    } else {
        res.render("urls_new", templateVars);
    }
});

//renders the page for a shortened url unless the user is not logged in, the url doesn't belong to the user, or the id does not exist
app.get("/urls/:id", (req, res) => {
    if (urlDatabase[req.params.id] === undefined) {
        res.send("<html><body>Error: ID Does Not Exist</body></html>\n");
    } else if (typeof users[req.session.user_id] === "undefined") {
        res.send("<html><body>Error: User Must Be Logged In To Edit URLs</body></html>\n");
    } else if (urlsForUser(req.session.user_id)[req.params.id] === undefined) {
        res.send("<html><body>Error: This URL Belongs to a Different User</body></html>\n");
    } else {
        const templateVars = { 
            user: users[req.session.user_id],
            id: req.params.id, 
            longURL: urlDatabase[req.params.id].longURL 
        };
        res.render("urls_show", templateVars);
    }
});

//redirects the user to the longURL unless the id the user is trying to go to doesn't exist
app.get("/u/:id", (req, res) => {
    const longURL = urlDatabase[req.params.id].longURL;
    if (longURL === undefined) {
        res.send("<html><body>Error: id Is Not Recognized</body></html>\n");
    } else {
        res.redirect(longURL);
    }
});

//deletes a shortened url if the user is logged in, the url belongs to the user, and if the id exists
app.post("/urls/:id/delete", (req, res) => {
    const templateVars = { user: users[req.session.user_id] };
    if (typeof templateVars.user === "undefined") {
        res.send("<html><body>Error: User Must Be Logged In to Delete URLs</body></html>\n");
    } else if (req.params.id === undefined) {
        res.send("<html><body>Error: ID Does Not Exist</body></html>\n");
    } else if (urlsForUser(req.session.user_id)[req.params.id] === undefined) {
        res.send("<html><body>Error: Cannot Delete Another Users URL</body></html>\n");
    } else {
        delete urlDatabase[req.params.id];
        return res.redirect("/urls");
    }
});

//edits the longURL of a selected shortened URL
app.post("/urls/:id", (req, res) => {
    const templateVars = { user: users[req.session.user_id] };
    if (req.params.id === undefined) {
        res.send("<html><body>Error: ID Does Not Exist</body></html>\n");
    } else if (typeof templateVars.user === "undefined") {
        res.send("<html><body>Error: User Must Be Logged In to Edit URLs</body></html>\n");
    } else {
        urlDatabase[req.params.id].longURL = req.body.newLongURL;
        return res.redirect("/urls");
    }
});

//logs the user out by deleting the user_id cookie
app.post("/logout", (req, res) => {
    req.session = null;
    return res.redirect("/login");
});

//renders the registration page if the user is not already logged in
app.get("/register", (req, res) => {
    const templateVars = { 
        email: req.body.email,
        password: req.body.password,
        user: users[req.session.user_id],
        id: req.params.id 
    };
    if (typeof templateVars.user !== "undefined") {
        return res.redirect("/urls");
    } else {
        res.render("urls_register", templateVars);
    }
});

//registers a new user if a user with the given email is not already registered, or unless no information is given
app.post("/register", (req, res) => {
    let newString = generateRandomString();
    if (getUserByEmail(req.body.email, users) !== undefined) {
        res.send("<html><body>Error 400: Bad Request: Email already in use</body></html>\n");
    } else if (req.body.email === "" || req.body.password === "") {
        res.send("<html><body>Error 400: Bad Request: No input given</body></html>\n");
    } else {
        users[newString] = {id: newString,
            email: req.body.email,
            password: bcrypt.hashSync(req.body.password, 10)};
        req.session.user_id = newString;
        return res.redirect("/urls");
    }
});

//renders the login page unless the user is already logged in
app.get("/login", (req, res) => {
    const templateVars = { 
        email: req.body.email,
        password: req.body.password,
        user: users[req.session.user_id],
        id: req.params.id
    };
    if (typeof templateVars.user !== "undefined") {
        return res.redirect("/urls");
    } else {
        res.render("urls_login", templateVars);
    }
});