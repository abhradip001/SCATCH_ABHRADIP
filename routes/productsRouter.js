const express = require('express');
const productsRouter = express.Router();
const upload = require("../config/multer-config");
const productModel = require("../models/product-model");

// Show the product creation form (GET)
productsRouter.get("/create", (req, res) => {
    let success = req.flash("success");
    res.render("createproducts", { success });
});

// Handle product creation (POST)
productsRouter.post("/create", upload.single("image"), async (req, res) => {
    try {
        let { name, price, discount, bgcolor, panelcolor, textcolor } = req.body;
        let product = await productModel.create({
            image: req.file.buffer,
            name,
            price,
            discount,
            bgcolor,
            panelcolor,
            textcolor,
        });

        req.flash("success", "Successfully created product");
        res.redirect("/owners/admin");
    } catch (err) {
        res.send(err.message);
    }
});

module.exports = productsRouter;