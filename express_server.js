const express = require('express');
const bodyParser = require("body-parser");
const cookies = require("cookie-parser");
const app = express();
const PORT = process.env.PORT || 8080; //defaults to 8080

app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookies());

app.set("view engine", "ejs");

let urlDatabase = {
  "b2xVn2": { userID : "admin", longURL : "http://www.lighthouselabs.ca" },
  "9sm5xK": { userID : "admin", longURL : "http://www.google.com" }
};

const users = {
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
}

function generateRandomString(num) {
  let shortURL = ''; //an empty string to hold the future random string
  let urlLength = num; //random string length
  const charList = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";

  for (let i = 0; i < num; i++) {
    //pick a random character from our predetermined character list
    //concatenate it to the shortURL
    //do this `num` times. `num` being our desired string length
    shortURL += charList[Math.floor(Math.random() * charList.length)];
  }
  return shortURL.toString();
}

function urlsForUser(id) {
  let userUrls = {};
  for (let uID in urlDatabase) {
    if (urlDatabase[uID].userID === id) {
      userUrls[uID] = urlDatabase[uID];
    }
  }
  return userUrls;
}

app.get("/hello", (req, res) => {
  res.end("<html><body>Ello <b>Ellow</b></body></html>\n");
});

app.get("/urls", (req, res) => {
  const currentUser = req.cookies;
  let templateVars = { urls: urlsForUser(currentUser['user_id']), user: users[req.cookies["user_id"]] };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  const currentUser = req.cookies;
  if (currentUser['user_id']) {
    let templateVars = { user: users[currentUser["user_id"]] };
    res.render("urls_new", templateVars);
  } else {
    res.redirect("/login");
  }
});

//go to link!
app.get("/u/:shortURL", (req, res) => {
  let newLink = req.params.shortURL;
  console.log(newLink);

  res.redirect(urlDatabase[newLink].longURL);
});

//user registration
app.get("/register", (req, res) => {
  //show registration page
  res.render("users_register")
});

//login page
app.get("/login", (req, res) => {
  res.render("users_login");
});

//for edit/update page
app.get("/urls/:id", (req, res) => {
  let templateVars = req.params.id;
  console.log(req.params.id);
  res.render("urls_show", { shortURL : templateVars, urls : urlDatabase[templateVars].longURL });
});

app.post("/register" , (req, res) => {
  //add new user to `users` object
  if (!req.body.email || !req.body.password) {
    console.log("please fill in both fields");
    res.status(400).send("please fill in both fields");
  } else if (req.body.email && req.body.password) {
    for (let id in users) {
      if (req.body.email === users[id].email) {
        res.status(400).send("That email is already in use.");
        return;
      }
    }
    let newUserId = generateRandomString(9);
    users[newUserId] = { id : newUserId, email : req.body.email,  password : req.body.password };
    res.cookie("user_id", newUserId);
    res.redirect("/urls");
  }
});

//post new urls
app.post("/urls", (req, res) => {
  // console.log(req.cookies["user_id"]);
  let shortURL = generateRandomString(6);
  urlDatabase[shortURL] = { userID : req.cookies["user_id"], longURL : req.body.longURL };
  res.redirect("/urls");
});

//login
app.post("/login", (req, res) => {
  console.log(req.body);
  for (let id in users) {
    if (req.body.email === users[id].email && req.body.password === users[id].password) {
      res.cookie("user_id", users[id].id);
      res.redirect("/urls");
      return;
    }
  }
  for (let id in users) {
    if (req.body.email !== users[id].email || req.body.password !== users[id].password) {
      console.log("Submitted :", req.body, "Valid :", users[id]);
      res.status(403).send("Wrong email or password.");
      return;
    }
  }
});

//logout
app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect("/urls");
});

//POST request for url update use newUrl
app.post("/urls/:id", (req, res) => {
  let templateVars = req.params.id;
  console.log(req.params.id);
  console.log(req.body);
  urlDatabase[templateVars].longURL = req.body.newUrl;
  res.redirect("/urls");
});

app.post("/urls/:id/delete", (req, res) => {
  let id = req.params.id
  delete urlDatabase[id];
  res.redirect("/urls");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}! YO!`);
});