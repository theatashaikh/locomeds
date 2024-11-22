const mongoose = require("mongoose");

// The product schema is defined for pharma products
const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
  },
  price: {
    type: Number,
    required: true,
  },
  composition: {
    type: String,
    trim: true,
  },
  quantity: {
    type: Number,
    required: true,
  },
  description: {
    type: String,
    required: true,
    trim: true,
  },
  usage: {
    type: String,
    trim: true,
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Category",
  },
  imageUrls: [{ type: String }],
  manufacturer: {
    type: String,
    trim: true,
  },
  isPrescriptionNecessary: {
    type: Boolean,
    required: true,
    default: false,
  },
  isFeatured: {
    type: Boolean,
    default: false,
  },
});

module.exports = mongoose.model("Product", productSchema);
