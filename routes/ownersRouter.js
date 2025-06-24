const express = require('express');
const ownersRouter = express.Router();
const ownerModel = require("../models/owner-model");
const multer = require("multer");
const upload = multer();
const productModel = require("../models/product-model");

if(process.env.NODE_ENV === "development") {
    ownersRouter.post("/create", async (req, res) => {
        let owners = await ownerModel.find();
        if(owners.length > 0 ) return res.status(503).send("You don't have permission to create an owner");

        let { fullname, email, password } = req.body;
        let createdOwner = await ownerModel.create({
            fullname,
            email,
            password,
        });

        res.status(201).send("Creating owner");
    });
}

ownersRouter.get("/admin", (req, res) => {
    let success = req.flash("success");
    res.render("createproducts", { success });
});

ownersRouter.post("/products/create", upload.single("image"), async (req, res) => {
    try {
        const { name, price, bgcolor, panelcolor, textcolor } = req.body;
        const image = req.file.buffer;

        await productModel.create({
            name,
            price,
            bgcolor,
            panelcolor,
            textcolor,
            image
        });

        req.flash("success", "Product created!");
        res.redirect("/owners/products");
    } catch (err) {
        req.flash("success", "Error creating product.");
        res.redirect("/owners/admin");
    }
});

// Optional: Show all products for owners
ownersRouter.get("/products", async (req, res) => {
    const products = await productModel.find();
    let success = req.flash("success");
    res.render("products", { products, success });
});

module.exports = ownersRouter;