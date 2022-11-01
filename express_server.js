const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const cookieParser = require('cookie-parser')

function generateRandomString() {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < 5; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length))
  }
  return result
}

app.set("view engine", "ejs");
app.use(cookieParser())
app.use(express.urlencoded({ extended: true }));

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
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

const getUserByEmail = function(email) {
  for (let user in users) {
    if (users[user].email === email) {
      return users[user]
    }
  }
}

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.post("/login", (req, res) => {
  let user = getUserByEmail(req.body.email)
  if (user === undefined) {
    res.send("<html><body>Error 403: User not registered</body></html>\n")
  } else if  (user.password !== req.body.password) {
    res.send("<html><body>Error 403: Password is incorrect</body></html>\n")
  } else {
    res.cookie("user_id", user.id)
    return res.redirect('/urls')
  }
});

app.get("/urls", (req, res) => {
  const templateVars = { urls: urlDatabase,
    user: users[req.cookies["user_id"]]};
  res.render("urls_index", templateVars);
}); 

app.post("/urls", (req, res) => {
  urlDatabase[generateRandomString()] = req.body.longURL
  const key = Object.keys(urlDatabase).find(key => urlDatabase[key] === req.body.longURL);
  return res.redirect('/urls/' + key)
});

app.get("/urls/new", (req, res) => {
  const templateVars = { user: users[req.cookies["user_id"]] }
  res.render("urls_new", templateVars);
});

app.get("/urls/:id", (req, res) => {
  const templateVars = { 
    user: users[req.cookies["user_id"]],
    id: req.params.id, 
    longURL: urlDatabase[req.params.id] 
  };
  res.render("urls_show", templateVars);
});

app.get("/u/:id", (req, res) => {
  const longURL = urlDatabase[req.params.id]
  res.redirect(longURL);
});

app.post("/urls/:id/delete", (req, res) => {
  delete urlDatabase[req.params.id]
  return res.redirect('/urls')
});

app.post("/urls/:id", (req, res) => {
  urlDatabase[req.params.id] = req.body.newLongURL
  return res.redirect('/urls')
});

app.post("/logout", (req, res) => {
  res.clearCookie("user_id")
  return res.redirect('/login')
});

app.get("/register", (req, res) => {
  const templateVars = { 
    email: req.body.email,
    password: req.body.password,
    user: users[req.cookies["user_id"]],
    id: req.params.id, 
    longURL: urlDatabase[req.params.id] 
  };
  res.render("urls_register", templateVars)
});



app.post("/register", (req, res) => {
  let newString = generateRandomString();
  if (getUserByEmail(req.body.email) !== undefined) {
    res.send("<html><body>Error 400: Bad Request: Email already in use</body></html>\n")
  } else if (req.body.email === '' || req.body.password === '') {
    res.send("<html><body>Error 400: Bad Request: No input given</body></html>\n")
  } else {
    users[newString] = {id: newString,
      email: req.body.email,
      password: req.body.password}
res.cookie("user_id", newString)
console.log(users)
return res.redirect('/urls');
  }
});

app.get("/login", (req, res) => {
  const templateVars = { 
    email: req.body.email,
    password: req.body.password,
    user: users[req.cookies["user_id"]],
    id: req.params.id, 
    longURL: urlDatabase[req.params.id] 
  }
  res.render("urls_login", templateVars)
})