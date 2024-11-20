const router = require("express").Router();
const adminAuth = require("../middlewares/adminAuth");
const Product = require("../models/productModel");
const upload = require("../middlewares/uploads");

const {
  uploadToFirebase,
  deleteFromFirebase,
} = require("../utils/firebase.utils");

router.post(
  "/add-product",
  adminAuth,
  upload.array("productImages", 4),
  async (req, res) => {
    try {
      const {
        name,
        price,
        quantity,
        description,
        category,
        manufacturer,
        isAvailable,
        isPrescriptionNecessary,
        isFeatured,
      } = req.body;

      if (!name) {
        return res.status(400).json({ message: "Name is required" });
      }

      if (!price) {
        return res.status(400).json({ message: "Price is required" });
      }

      if (price < 1) {
        return res
          .status(400)
          .json({ message: "Price must be greater than 0" });
      }

      if (!quantity) {
        return res.status(400).json({ message: "Quantity is required" });
      }

      if (quantity < 1) {
        return res
          .status(400)
          .json({ message: "Quantity must be greater than 0" });
      }

      if (!description) {
        return res.status(400).json({ message: "Description is required" });
      }

      if (!category) {
        return res.status(400).json({ message: "Category is required" });
      }

      if (!manufacturer) {
        return res.status(400).json({ message: "Manufacturer is required" });
      }

      const files = req.files;

      // Upload images to Firebase if files exist
      const imageUrls = [];
      if (files && files.length > 0) {
        for (const file of files) {
          const imageUrl = await uploadToFirebase(file);
          imageUrls.push(imageUrl);
        }
      }

      const product = new Product({
        name,
        price,
        quantity,
        description,
        category,
        imageUrls: imageUrls,
        manufacturer,
        isAvailable,
        isPrescriptionNecessary,
        isFeatured,
      });

      await product.save();
      res.status(201).json({ message: "Product added successfully", product });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

// Get all products
router.get("/all-products", async (req, res) => {
  try {
    const products = await Product.find();
    res.status(200).json({
      success: true,
      data: products,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching products",
      error: error.message,
    });
  }
});

// Get a single product by ID
router.get("/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }
    res.status(200).json({
      success: true,
      data: product,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching product",
      error: error.message,
    });
  }
});

// Update a product by ID
router.put("/:id", upload.array("productImages", 4), async (req, res) => {
  try {
    const productId = req.params.id;
    const updateData = req.body;
    const files = req.files;

    // Upload new images if provided
    if (files && files.length > 0) {
      const newImageUrls = [];
      for (const file of files) {
        const imageUrl = await uploadToFirebase(file);
        newImageUrls.push(imageUrl);
      }

      updateData.imagesUrl = [...(updateData.imagesUrl || []), ...newImageUrls];
    }

    const product = await Product.findByIdAndUpdate(productId, updateData, {
      new: true,
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Product updated successfully",
      data: product,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating product",
      error: error.message,
    });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    // First find the product to get image URLs
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // Delete images from Firebase if they exist
    if (product.imageUrls && product.imageUrls.length > 0) {
      const deletePromises = product.imageUrls.map(async (imageUrl) => {
        try {
          await deleteFromFirebase(imageUrl);
        } catch (error) {
          console.error(`Failed to delete image: ${imageUrl}`, error);
          // Continue with deletion even if one image fails
        }
      });

      // Wait for all image deletions to complete
      await Promise.all(deletePromises);
    }

    // Delete the product from MongoDB
    await Product.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "Product and associated images deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error deleting product",
      error: error.message,
    });
  }
});

module.exports = router;
