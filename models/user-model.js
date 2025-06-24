const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    fullname: {
        type: String,
        minlength: 3,
        trim: true,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true, // Ensures no duplicate emails
        trim: true
    },
    password: {
        type: String,
        required: true
    },
    cart: [
        {
            product: { type: mongoose.Schema.Types.ObjectId, ref: "product", required: true },
            quantity: { type: Number, default: 1, min: 1 }
        }
    ],
    orders: {
        type: Array,
        default: [],
    },
    contact: {
        type: Number
    },
    photo: {
        type: Buffer // Store profile photo as Buffer
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    }
}, { timestamps: true }); // Adds createdAt and updatedAt fields

module.exports = mongoose.model('User', userSchema);