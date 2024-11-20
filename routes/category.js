const router = require("express").Router();
const Category = require("../models/categoryModel");
const adminAuth = require("../middlewares/adminAuth");

// Get all categories
router.get("/get-categories", async (req, res) => {
  try {
    const categories = await Category.find();
    res.status(200).json(categories);
  } catch (error) {
    res.status(500).json(error);
  }
});

// Add category
router.post("/add-category", adminAuth, async (req, res) => {
  try {
    const { category } = req.body;

    const doesCategoryExists = Category.findOne({ category });
    if (doesCategoryExists) {
      return res.status(400).json({ message: "Category already exists" });
    }

    if (!category) {
      return res.status(400).json({ message: "Category name is required" });
    }

    const newCategory = new Category({
      category,
    });

    const savedCategory = await newCategory.save();
    res.status(200).json(savedCategory);
  } catch (error) {
    res.status(500).json(error);
  }
});

// insert many categories
router.post("/add-many-categories", adminAuth, async (req, res) => {
  try {
    const { categories } = req.body;

    if (categories.length === 0) {
      return res.status(400).json({ message: "Category name is required" });
    }

    for (let i = 0; i < categories.length; i++) {
      const newCategory = new Category({
        category: categories[i],
      });

      await newCategory.save();
    }

    res.status(200).json({ message: "Categories added successfully" });
  } catch (error) {
    res.status(500).json(error);
  }
});

// Delete category
router.delete("/delete-category/:category", adminAuth, async (req, res) => {
  try {
    const { category } = req.params;

    const deletedCategory = await Category.findOneAndDelete({ category });
    if (!deletedCategory) {
      return res.status(400).json({ message: "Category does not exist" });
    }

    res
      .status(200)
      .json({ message: `Category ${category} deleted successfully` });
  } catch (error) {
    res.status(500).json(error);
  }
});

module.exports = router;
