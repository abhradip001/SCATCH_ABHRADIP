const express = require('express');
const usersRouter = express.Router();
const { isloggedin} = require("../controllers/authController");
const {
    registerUser,
    loginUser, 
    logout,
} = require("../controllers/authController");


usersRouter.get("/", (req, res) => {
    res.send("users route working");
});

usersRouter.post("/register", registerUser );

usersRouter.post("/login", loginUser);

usersRouter.get("/logout",logout);

module.exports = usersRouter;

