const express = require('express');
const router = express.Router();    
const isloggedin = require("../middlewares/isLoggedIn");
const productModel = require("../models/product-model");
const userModel = require('../models/user-model');
const multer = require("multer");
const upload = multer();
const bcrypt = require("bcrypt");
const sharp = require('sharp');
const isAdmin = require("../middlewares/isAdmin");
const contactModel = require('../models/contact-model');

// Home page
router.get("/", (req, res) => {
    let error = req.flash("error");
    res.render("index", { error, loggedin: !!req.user, user: req.user });
});

// Shop page
router.get("/shop", isloggedin, async (req, res) => {
    const sortby = req.query.sortby || "popular";
    const discount = req.query.discount;
    const collection = req.query.collection; // 👈 New query param for "New Collection"
    const success = req.flash("success");

    let products = [];

    try {
        // Step 1: Get all products with price > 0
        products = await productModel.find({ price: { $gt: 0 } });

        // Step 2: Filter by discount range
        if (discount) {
            let min = 0;
            let max = 100;

            if (discount.includes("-")) {
                [min, max] = discount.split("-").map(Number);
            } else {
                min = Number(discount);
                max = 100;
            }

            products = products.filter(p => {
                const price = Number(p.price);
                const disc = Number(p.discount);
                if (!price || !disc) return false;

                const percent = (disc / price) * 100;
                return percent >= min && percent <= max;
            });
        } else if (discount === "1") {
            products = products.filter(p => p.discount && p.discount > 0);
        }

        // Step 3: Apply New Collection Filter
        if (collection === "new") {
            products = products
                .sort((a, b) => b.createdAt - a.createdAt) // Newest first
                .slice(0, 6); // Top 6 only
        } else {
            // Step 4: Apply sorting if not in 'new collection'
            if (sortby === "newest") {
                products = products.sort((a, b) => b.createdAt - a.createdAt);
            } else if (sortby === "popular") {
                products = products.sort((a, b) => b.price - a.price); // Example logic
            }
        }

        // Step 5: Render with all filters
        res.render("shop", {
            products,
            success,
            user: req.user,
            sortby,
            discount,
            collection,
        });

    } catch (err) {
        console.error("Shop error:", err);
        res.render("shop", {
            products: [],
            success,
            user: req.user,
            sortby,
            discount,
            collection,
        });
    }
});

// Cart page
router.get("/cart", isloggedin, async function(req, res) {
    try {
        let user = await userModel
            .findOne({ email: req.user.email })
            .populate("cart.product");
        if (!user) {
            req.flash("error", "User not found.");
            return res.redirect("/shop");
        }
        res.render("cart", { user });
    } catch (err) {
        res.status(500).send("Error: " + err.message);
    }
});

// Add to cart
router.get("/addtocart/:id", isloggedin, async function(req, res) {
    let user = await userModel.findOne({ email: req.user.email });
    if (!user || !user.cart) {
        req.flash("error", "User not found or cart not initialized.");
        return res.redirect("/shop");
    }
    // Check if already in cart
    let cartItem = user.cart.find(item => item.product && item.product.toString() === req.params.id);
    if (cartItem) {
        cartItem.quantity = (cartItem.quantity || 1) + 1;
    } else {
        user.cart.push({ product: req.params.id, quantity: 1 });
    }
    await user.save();
    req.flash("success", "Added to cart");
    res.redirect("/shop");
});

// Increase quantity
router.post('/cart/increase/:id', isloggedin, async (req, res) => {
    let user = await userModel.findOne({ email: req.user.email });
    const itemId = req.params.id;
    const cartItem = user.cart.find(item => item.product && item.product.toString() === itemId);
    if (cartItem) {
        cartItem.quantity = (cartItem.quantity || 1) + 1;
        await user.save();
    }
    res.redirect('/cart');
});

// Decrease quantity
router.post('/cart/decrease/:id', isloggedin, async (req, res) => {
    let user = await userModel.findOne({ email: req.user.email });
    const itemId = req.params.id;
    const cartItem = user.cart.find(item => item.product && item.product.toString() === itemId);
    if (cartItem && (cartItem.quantity || 1) > 1) {
        cartItem.quantity = (cartItem.quantity || 1) - 1;
        await user.save();
    }
    res.redirect('/cart');
});

// Delete product from cart
router.post('/cart/delete/:id', isloggedin, async (req, res) => {
    let user = await userModel.findOne({ email: req.user.email });
    const itemId = req.params.id;
    user.cart = user.cart.filter(item => !(item.product && item.product.toString() === itemId));
    await user.save();
    res.redirect('/cart');
});

// My Account page
router.get("/myaccount", isloggedin, async (req, res) => {
    const user = await userModel.findOne({ email: req.user.email });
    res.render("myaccount", { user, success: req.flash("success"), error: req.flash("error") });
});

router.post("/myaccount/edit", isloggedin, upload.single("photo"), async (req, res) => {
    try {
        const { fullname, email, password } = req.body;
        const update = { fullname, email };

        // Hash password if provided
        if (password) {
            const salt = await bcrypt.genSalt(10);
            update.password = await bcrypt.hash(password, salt);
        }

        // Resize and save photo if uploaded
        if (req.file) {
            const resized = await sharp(req.file.buffer)
                .resize(256, 256)
                .jpeg({ quality: 80 })
                .toBuffer();
            update.photo = resized;
        }

        await userModel.updateOne({ email: req.user.email }, update);
        req.flash("success", "Profile updated!");
        res.redirect("/myaccount");
    } catch (err) {
        req.flash("error", "Update failed.");
        res.redirect("/myaccount");
    }
});

// Logout (example: destroys session and redirects to home)
router.get("/logout", isloggedin, function(req, res) {
    req.session.destroy(() => {
        res.redirect("/");
    });
});
router.get("/admin", isloggedin, isAdmin, async (req, res) => {
    const products = await productModel.find();
    res.render("admin", { products, user: req.user });
});


// Show the create product form
router.get("/products/create", isloggedin, isAdmin, (req, res) => {
    res.render("create-products", { user: req.user, error: req.flash("error"), success: req.flash("success") });
});
// Handle the form submission
router.post("/products/create", isloggedin, isAdmin, upload.single("image"), async (req, res) => {
    console.log("Form submitted:", req.body, req.file);
    try {
        const { name, price, discount, bgcolor, panelcolor, textcolor } = req.body;
        const productData = { name, price, discount, bgcolor, panelcolor, textcolor };
        if (req.file) {
            productData.image = req.file.buffer;
        }
        await productModel.create(productData);
        req.flash("success", "Product created successfully!");
        res.redirect("/admin");
    } catch (err) {
        console.error("Product creation error:", err);
        req.flash("error", "Failed to create product.");
        res.redirect("/products/create");
    }
});``


//delete product
router.post("/admin/delete/:id", isloggedin, isAdmin, async (req, res) => {
    await productModel.findByIdAndDelete(req.params.id);
    req.flash("success", "Product deleted!");
    res.redirect("/admin");
});


//delete all product
router.post("/admin/delete-all", isloggedin, isAdmin, async (req, res) => {
    await productModel.deleteMany({});
    req.flash("success", "All products deleted!");
    res.redirect("/admin");
});

// Show edit product form
router.get("/admin/edit/:id", isloggedin, isAdmin, async (req, res) => {
    const product = await productModel.findById(req.params.id);
    res.render("edit-product", { product, user: req.user, error: req.flash("error"), success: req.flash("success") });
});

// Handle edit product form submission
router.post("/admin/edit/:id", isloggedin, isAdmin, upload.single("image"), async (req, res) => {
    try {
        const { name, price, discount, bgcolor, panelcolor, textcolor } = req.body;
        const update = { name, price, discount, bgcolor, panelcolor, textcolor };
        if (req.file) {
            update.image = req.file.buffer;
        }
        await productModel.findByIdAndUpdate(req.params.id, update);
        req.flash("success", "Product updated successfully!");
        res.redirect("/admin");
    } catch (err) {
        req.flash("error", "Failed to update product.");
        res.redirect(`/admin/edit/${req.params.id}`);
    }
});


// Contact page
router.get('/contact', (req, res) => {
    res.render('contact', { 
        user: req.user,
        success: req.flash('success'),
        error: req.flash('error')
    });
});

// contact form submission
router.post('/contact', async (req, res) => {
    const { name, email, message } = req.body;
    try {
        await contactModel.create({ name, email, message });
        req.flash('success', 'Thank you for contacting us! We will get back to you soon.');
        res.redirect('/contact');
    } catch (err) {
        req.flash('error', 'Something went wrong. Please try again.');
        res.redirect('/contact');
    }
});

//about
router.get('/about', (req, res) => {
    res.render('about', { user: req.user });
});

//help
router.get('/help', (req, res) => {
    res.render('help', { user: req.user });
});




module.exports = router;