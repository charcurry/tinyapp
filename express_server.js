const { getUserByEmail, urlsForUser, generateRandomString, users, urlDatabase } = require("./helpers");
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

//if logged in redirects to urls and to login if not
app.get("/", (req, res) => {
    const user = users[req.session.user_id];
    if (typeof user === "undefined") {
        return res.redirect("/login");
    } else {
        return res.redirect("/urls");
    }
});

//renders the urls page or sends an error if the user is not logged in
app.get("/urls", (req, res) => {
    const userID = req.session.user_id;
    const urlsOfUser = urlsForUser(userID, urlDatabase);
    const templateVars = { urls: urlsOfUser,
        user: users[userID]};
    if (typeof templateVars.user === "undefined") {
        res.send("<html><body>Error: User Must Be Logged In To View URLs</body></html>\n");
    } else {
        res.render("urls_index", templateVars);
    }
}); 

//renders the page for making a new url if the user is logged in
app.get("/urls/new", (req, res) => {
    const userID = req.session.user_id;
    const templateVars = { user: users[userID] };
    if (typeof templateVars.user === "undefined") {
        return res.redirect("/login");
    } else {
        res.render("urls_new", templateVars);
    }
});

//renders the page for a shortened url unless the user is not logged in, the url doesn't belong to the user, or the id does not exist
app.get("/urls/:id", (req, res) => {
    const shortURL = req.params.id;
    const userID = req.session.user_id;
    const urlsOfUser = urlsForUser(userID, urlDatabase);
    if (urlDatabase[shortURL] === undefined) {
        res.send("<html><body>Error: ID Does Not Exist</body></html>\n");
    } else if (typeof users[userID] === "undefined") {
        res.send("<html><body>Error: User Must Be Logged In To Edit URLs</body></html>\n");
    } else if (urlsOfUser[shortURL] === undefined) {
        res.send("<html><body>Error: This URL Belongs to a Different User</body></html>\n");
    } else {
        const templateVars = { 
            user: users[userID],
            id: shortURL, 
            longURL: urlDatabase[shortURL].longURL 
        };
        res.render("urls_show", templateVars);
    }
});

//redirects the user to the longURL unless the id the user is trying to go to doesn't exist
app.get("/u/:id", (req, res) => {
    const shortURL = req.params.id;
    const longURL = urlDatabase[shortURL].longURL;
    if (longURL === undefined) {
        res.send("<html><body>Error: id Is Not Recognized</body></html>\n");
    } else {
        res.redirect(longURL);
    }
});

//creates a new shortened url and goes to its page
app.post("/urls", (req, res) => {
    const userID = req.session.user_id;
    const longURL = req.body.longURL;
    const templateVars = { user: users[userID] };
    if (typeof templateVars.user === "undefined") {
        res.send("<html><body>Error: User Must Be Logged In To Shorten URLs</body></html>\n");
        return;
    } else {
        const shortURL = generateRandomString();
        urlDatabase[shortURL] = {longURL: longURL, userID: userID};
        return res.redirect(`/urls/${shortURL}`);
    }
});

//edits the longURL of a selected shortened URL
app.post("/urls/:id", (req, res) => {
    const shortURL = req.params.id;
    const userID = req.session.user_id;
    const newLongURL = req.body.newLongURL;
    const templateVars = { user: users[userID] };
    if (shortURL === undefined) {
        res.send("<html><body>Error: ID Does Not Exist</body></html>\n");
    } else if (typeof templateVars.user === "undefined") {
        res.send("<html><body>Error: User Must Be Logged In to Edit URLs</body></html>\n");
    } else {
        urlDatabase[shortURL].longURL = newLongURL;
        return res.redirect("/urls");
    }
});

//renders the login page unless the user is already logged in
app.get("/login", (req, res) => {
    const email = req.body.email;
    const password = req.body.password;
    const userID = req.session.user_id;
    const shortURL = req.params.id;
    const templateVars = { 
        email: email,
        password: password,
        user: users[userID],
        id: shortURL
    };
    if (typeof templateVars.user !== "undefined") {
        return res.redirect("/urls");
    } else {
        res.render("urls_login", templateVars);
    }
});

//renders the registration page if the user is not already logged in
app.get("/register", (req, res) => {
    const email = req.body.email;
    const password = req.body.password;
    const userID = req.session.user_id;
    const shortURL = req.params.id;
    const templateVars = { 
        email: email,
        password: password,
        user: users[userID],
        id: shortURL
    };
    if (typeof templateVars.user !== "undefined") {
        return res.redirect("/urls");
    } else {
        res.render("urls_register", templateVars);
    }
});

//deletes a shortened url if the user is logged in, the url belongs to the user, and if the id exists
app.post("/urls/:id/delete", (req, res) => {
    const shortURL = req.params.id;
    const userID = req.session.user_id;
    const urlsOfUser = urlsForUser(userID, urlDatabase);
    const templateVars = { user: users[userID] };
    if (typeof templateVars.user === "undefined") {
        res.send("<html><body>Error: User Must Be Logged In to Delete URLs</body></html>\n");
    } else if (shortURL === undefined) {
        res.send("<html><body>Error: ID Does Not Exist</body></html>\n");
    } else if (urlsOfUser[shortURL] === undefined) {
        res.send("<html><body>Error: Cannot Delete Another Users URL</body></html>\n");
    } else {
        delete urlDatabase[shortURL];
        return res.redirect("/urls");
    }
});

//logs the user in, or gives an error
app.post("/login", (req, res) => {
    const password = req.body.password;
    const email = req.body.email;
    const userFromEmail = getUserByEmail(email, users);
    let user = userFromEmail;
    if (user === undefined) {
        res.send("<html><body>Error 403: User not registered</body></html>\n");
    } else if (bcrypt.compareSync(password, user.password) !== true) {
        res.send("<html><body>Error 403: Password is incorrect</body></html>\n");
    } else {
      req.session.user_id = user.id;
        return res.redirect("/urls");
    }
});

//registers a new user if a user with the given email is not already registered, or unless no information is given
app.post("/register", (req, res) => {
    const email = req.body.email;
    const password = req.body.password;
    const userFromEmail = getUserByEmail(email, users);
    const newString = generateRandomString();
    if (userFromEmail !== undefined) {
        res.send("<html><body>Error 400: Bad Request: Email already in use</body></html>\n");
    } else if (email === "" || password === "") {
        res.send("<html><body>Error 400: Bad Request: No input given</body></html>\n");
    } else {
        users[newString] = {id: newString,
            email: email,
            password: bcrypt.hashSync(password, 10)};
      req.session.user_id = newString;
        return res.redirect("/urls");
    }
});

//logs the user out by deleting the user_id cookie
app.post("/logout", (req, res) => {
    req.session = null;
    return res.redirect("/login");
});

app.listen(PORT, () => {
    console.log(`Example app listening on port ${PORT}!`);
});