const express = require('express');
const bodyParser = require("body-parser");
const cookies = require("cookie-parser");
const app = express();
const PORT = process.env.PORT || 8080; //defaults to 8080

app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookies());

app.set("view engine", "ejs");

let urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
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
  return shortURL;
}

app.get("/hello", (req, res) => {
  res.end("<html><body>Ello <b>Ellow</b></body></html>\n");
});

app.get("/urls", (req, res) => {
  let templateVars = { urls: urlDatabase, user: users[req.cookies["user_id"]] };
  console.log(users[req.cookies["user_id"]]);
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  let templateVars = { user: users[req.cookies["user_id"]] };
  res.render("urls_new", templateVars);
});

app.get("/u/:shortURL", (req, res) => {
  //turn the longURL into a random 6 character string
  let shortURL = generateRandomString(6);
  res.redirect("/urls");
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
  res.render("urls_show", { shortURL : templateVars, urls : urlDatabase });
});

app.post("/register" , (req, res) => {
  //add new user to `users` object
  if (!req.body.email || !req.body.password) {
    console.log("please fill in both fields")
    res.status(400).send("please fill in both fields");
  } else if (req.body.email && req.body.password) {
    for (let id in users) {
      if (req.body.email === users[id].email) {
        res.status(400).send("That email is already in use.")
        return;
      }
    }
    let newUserId = generateRandomString(9);
    users[newUserId] = { id : newUserId, email : req.body.email,  password : req.body.password };
    console.log(users);
    res.cookie("user_id", newUserId);
    res.redirect("/urls");
  }
});

app.post("/urls", (req, res) => {
  res.send(`Okay`);
});

//login
app.post("/login", (req, res) => {
  res.cookie("username", req.body.username);
  res.redirect("/urls");
});

//logout
app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect("/urls");
});

//POST request for url update
app.post("/urls/:id", (req, res) => {
  let templateVars = req.params.id;
  urlDatabase[templateVars] = req.body.newUrl;

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