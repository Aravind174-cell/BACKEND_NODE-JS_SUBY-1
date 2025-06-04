const mongoose = require('mongoose');
const path = require('path');
const multer = require('multer');
const Product = require("../models/Product");
const Firm = require('../models/Firm');

// Multer setup for file storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// Add a new product
const addProduct = async (req, res) => {
    try {
        const { productName, price, category, bestSeller, description } = req.body;
        const image = req.file ? req.file.filename : undefined;

        const firmId = req.params.firmId;

        if (!mongoose.Types.ObjectId.isValid(firmId)) {
            return res.status(400).json({ error: "Invalid firm ID" });
        }

        const firm = await Firm.findById(firmId);

        if (!firm) {
            return res.status(404).json({ error: "No firm found" });
        }

        const product = new Product({
            productName,
            price,
            category,
            bestSeller,
            description,
            image,
            firm: firm._id
        });

        const savedProduct = await product.save();

        firm.products.push(savedProduct._id);
        await firm.save();

        res.status(200).json(savedProduct);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
};

// Get all products by firm
const getProductByFirm = async (req, res) => {
    try {
        const firmId = req.params.firmId;

        if (!mongoose.Types.ObjectId.isValid(firmId)) {
            return res.status(400).json({ error: "Invalid firm ID" });
        }

        const firm = await Firm.findById(firmId).lean();

        if (!firm) {
            return res.status(404).json({ error: "No firm found" });
        }

        const restaurantName = firm.firmName;
        const products = await Product.find({ firm: firmId }).lean();

        res.status(200).json({
            message: "Products fetched successfully",
            restaurantName,
            products
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
};

// Delete product by ID
const deleteProductById = async (req, res) => {
    try {
        const productId = req.params.productId;

        if (!mongoose.Types.ObjectId.isValid(productId)) {
            return res.status(400).json({ error: "Invalid product ID" });
        }

        const deletedProduct = await Product.findByIdAndDelete(productId);

        if (!deletedProduct) {
            return res.status(404).json({ error: "No product found" });
        }

        res.status(200).json({ message: "Product deleted successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
};

// Export controller functions
module.exports = {
    addProduct: [upload.single('image'), addProduct],
    getProductByFirm,
    deleteProductById
};
