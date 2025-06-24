const mongoose = require('mongoose');

const productSchema = mongoose.Schema({
    image: Buffer,
    name: { type: String, required: true },
    price: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    bgcolor: String,
    panelcolor: String,
    textcolor: String
}, { timestamps: true });

module.exports = mongoose.model('product', productSchema);