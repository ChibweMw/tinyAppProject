const express = require('express');
const bodyParser = require("body-parser");
const cookieSession = require("cookie-session");
const methodoverride = require("method-override");
const app = express();
const PORT = process.env.PORT || 8080; //defaults to 8080
const bcrypt = require("bcrypt");

app.use(methodoverride('_method'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieSession({
  name : "session",
  keys: ['key1', 'key2'],
  maxAge: 300000
}));

app.set("view engine", "ejs");

let urlDatabase = {
};

const users = {
};

function generateRandomString(num) {
  let shortURL = ''; //an empty string to hold the future random string
  let urlLength = num; //random string length
  const charList = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";

  for (let i = 0; i < num; i++) {
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

function logUserIn (req,res) {
  for (let id in users) {
    if (req.body.email === users[id].email && bcrypt.compareSync(req.body.password, users[id].password)) {
      req.session['user_id'] = users[id].id;
      res.redirect("/urls");
      return;
    }
  }
  res.status(403).send("Wrong email or password.");
  return;
}

app.get("/", (req, res) => {
  const currentUser = req.session;
  if (currentUser['user_id']) {
    res.redirect("/urls");
  } else {
    res.redirect("/login");
  }
});

app.get("/urls", (req, res) => {
  const currentUser = req.session;
  if (currentUser['user_id']) {
    let templateVars = { urls: urlsForUser(currentUser['user_id']), user: users[req.session["user_id"]] };
    res.render("urls_index", templateVars);
  } else {
    res.redirect("login");
  }
});

app.get("/urls/new", (req, res) => {
  const currentUser = req.session;
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
  res.redirect(urlDatabase[newLink].longURL);
});

//user registration
app.get("/register", (req, res) => {
  const currentUser = req.session;
  if (currentUser['user_id']) {
    res.redirect("/urls");
  } else {
    res.render("users_register", {
      user: users[req.session['user_id']]
    });
  }
});

//login page
app.get("/login", (req, res) => {  
  if (!req.session['user_id']) {
    res.render("users_login",{
      user: users[req.session['user_id']]
    });
  } else {
    res.redirect("/urls");
  }
});

//for edit/update page
app.get("/urls/:id", (req, res) => {
  const currentUser = req.session['user_id'];
  let templateVars = req.params.id;
  if (currentUser === urlDatabase[templateVars].userID) {
    res.render("urls_show", { shortURL : templateVars,
                              urls : urlDatabase[templateVars].longURL ,
                              user: users[req.session['user_id']]
    });
  } else {
    res.redirect("/login");
  }
});

app.post("/register" , (req, res) => {
  //add new user to `users` object
  if (!req.body.email || !req.body.password) {
    res.status(400).send("Please fill in both fields.\n");
  } else if (req.body.email && req.body.password) {
    for (let id in users) {
      if (req.body.email === users[id].email) {
        res.status(400).send("That email is already in use.\n");
        return;
      }
    }
    let newUserId = generateRandomString(9);
    const password = req.body.password;
    const hashedPassword = bcrypt.hashSync(password, 10);
    users[newUserId] = { id : newUserId, email : req.body.email,  password : hashedPassword };
    req.session['user_id'] = newUserId;
    res.redirect("/urls");
  }
});

//post new urls
app.post("/urls", (req, res) => {
  const currentUser = req.session;
  if (currentUser['user_id']){
    let shortURL = generateRandomString(6);
    let newLongURL = req.body.longURL;
    if (newLongURL) {
      urlDatabase[shortURL] = { userID : req.session["user_id"], longURL : req.body.longURL };
      res.redirect("/urls");
    } else {
      res.status(400).send("Must provide long URL to be shortened.\n");
    }
  } else {
    res.status(403).send("Must be logged in to create new short URLs.\n");
  }
});

//login
app.post("/login", (req, res) => {
  logUserIn(req, res);
});



app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/urls");
});

//POST request for url update
app.put("/urls/:id", (req, res) => {
  const currentUser = req.session;
  if (currentUser['user_id']){
    let templateVars = req.params.id;
    let updatedURL = req.body.newUrl;
    if (updatedURL){
      urlDatabase[templateVars].longURL = req.body.newUrl;
      res.redirect("/urls");
    } else {
      res.status(400).send("Update failed. No new URL provided.");
    }
  } else {
    res.status(403).send("Must be logged in to update URLs.");
  }
});

app.delete("/urls/:id/delete", (req, res) => {
  const currentUser = req.session;
  if (currentUser['user_id']) {
    let id = req.params.id;
    delete urlDatabase[id];
    res.redirect("/urls");
  } else {
    res.status(403).send("Must be logged in to delete urls.\n");
  }
});

app.listen(PORT, () => {
  console.log(`'TinyApp' listening on port ${PORT}!`);
});