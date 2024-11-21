const router = require("express").Router();
const Category = require("../models/categoryModel");
const auth = require("../middlewares/auth");

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
router.post("/add-category", auth, async (req, res) => {
  try {
    if (req.user.userType !== "Admin") {
      return res
        .status(401)
        .json({ message: "Unauthorized!!! only Admin has the permission" });
    }
    const { category } = req.body;

    if (!category) {
      return res.status(400).json({ message: "Category name is required" });
    }

    const doesCategoryExists = await Category.findOne({ category });

    console.log(doesCategoryExists);
    if (doesCategoryExists) {
      return res.status(400).json({ message: "Category already exists" });
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
router.post("/add-many-categories", auth, async (req, res) => {
  try {
    if (req.user.userType !== "Admin") {
      return res
        .status(401)
        .json({ message: "Unauthorized!!! only Admin has the permission" });
    }
    const { categories } = req.body;

    if (categories.length === 0) {
      return res.status(400).json({ message: "Category name is required" });
    }

    for (let category of categories) {
      const newCategory = new Category({
        category,
      });

      await newCategory.save();
    }

    res.status(200).json({ message: "Categories added successfully" });
  } catch (error) {
    res.status(500).json(error);
  }
});

// Update category
router.put("/update-category/:category", auth, async (req, res) => {
  try {
    if (req.user.userType !== "Admin") {
      return res
        .status(401)
        .json({ message: "Unauthorized!!! only Admin has the permission" });
    }
    const { category } = req.params;
    const { newCategory } = req.body;

    const updatedCategory = await Category.findOne({ category });

    if (!updatedCategory) {
      return res.status(400).json({ message: "Category does not exist" });
    }

    updatedCategory.category = newCategory;
    await updatedCategory.save();

    res.status(200).json({ message: "Category updated successfully" });
  } catch (error) {
    res.status(500).json(error);
  }
});

// Delete category
router.delete("/delete-category/:category", auth, async (req, res) => {
  try {
    if (req.user.userType !== "Admin") {
      return res
        .status(401)
        .json({ message: "Unauthorized!!! only Admin has the permission" });
    }
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
