const userModel = require("../models/user-model");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { generateToken } = require("../utils/generateToken");

module.exports.registerUser = async (req, res) => {
    try {
        let { email, password, fullname } = req.body;

        let user = await userModel.findOne({ email: email });
        if (user) {
            req.flash("error", "User already exists with this account, please login.");
            return res.redirect("/");
        }
        bcrypt.genSalt(10, function (err, salt) {
            bcrypt.hash(password, salt, async function (err, hash) {
                if (err) {
                    console.log(err.message);
                    req.flash("error", err.message);
                    return res.redirect("/");
                } else {
                    let user = await userModel.create({
                        email,
                        password: hash,
                        fullname,
                    });
                    req.flash("error", "Registration successful, please login.");
                    res.redirect("/");
                }
            });
        });
    } catch (err) {
        console.log(err.message);
        req.flash("error", err.message);
        res.redirect("/");
    }
};

module.exports.loginUser = async (req, res) => {
    let { email, password } = req.body;

    let user = await userModel.findOne({ email: email });
    if (!user) {
        req.flash("error", "Email or password is incorrect, please try again.");
        return res.redirect("/");
    } else {
        bcrypt.compare(password, user.password, function (err, result) {
            if (err) {
                console.log(err.message);
                req.flash("error", err.message);
                return res.redirect("/");
            }
            if (result) {
                let token = generateToken(user);
                res.cookie("token", token, { httpOnly: true });
                res.redirect("/shop");
            } else {
                req.flash("error", "Email or password is incorrect, please try again.");
                res.redirect("/");
            }
        });
    }
};

module.exports.logout = function (req, res) {
    res.cookie("token", "");
    res.redirect("/");
};