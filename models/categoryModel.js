const mongoose = require("mongoose");

const categoryModel = new mongoose.Schema({
  category: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
  },
});

module.exports = mongoose.model("Category", categoryModel);
