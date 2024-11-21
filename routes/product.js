const router = require("express").Router();
const auth = require("../middlewares/auth");
const Product = require("../models/productModel");
const upload = require("../middlewares/uploads");

const {
  uploadToFirebase,
  deleteFromFirebase,
} = require("../utils/firebase.utils");

router.post(
  "/add-product",
  auth,
  upload.array("productImages", 4),
  async (req, res) => {
    if (req.user.userType !== "Admin") {
      return res.status(403).json({ message: "Unauthorized" });
    }

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

      if (quantity < 0) {
        return res
          .status(400)
          .json({ message: "Quantity must not be in negative" });
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

      if (!files || files.length <= 0) {
        return res
          .status(400)
          .json({ message: "At least one image is required" });
      }

      // Upload images to Firebase if files exist
      const imageUrls = [];
      for (const file of files) {
        const imageUrl = await uploadToFirebase(file);
        imageUrls.push(imageUrl);
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
router.get("/all-products", auth, async (req, res) => {
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
router.get("/:id", auth, async (req, res) => {
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

// Middleware to check if user is authorized to update product
const checkProductUpdateAuthorization = (req, res, next) => {
  const allowedUserTypes = ["Admin", "Vendor"];
  if (!allowedUserTypes.includes(req.user.userType)) {
    return res.status(403).json({ message: "Unauthorized" });
  }
  next();
};

// Handle image uploads
const processImageUploads = async (files) => {
  if (!files || files.length === 0) return [];

  return Promise.all(files.map((file) => uploadToFirebase(file)));
};

// Handle image deletions
const processImageDeletions = async (imagesToRemove) => {
  if (!imagesToRemove || imagesToRemove.length === 0) return;

  return Promise.all(
    imagesToRemove.map(async (imageUrl) => {
      try {
        await deleteFromFirebase(imageUrl);
      } catch (error) {
        console.error(`Failed to delete image: ${imageUrl}`, error);
      }
    })
  );
};

router.put(
  "/:id",
  auth,
  upload.array("productImages", 4),
  checkProductUpdateAuthorization,
  async (req, res) => {
    try {
      // destructuring the id from the params as alias productId
      const { id: productId } = req.params;
      const updateData = req.body;
      const files = req.files;

      // Find the product
      const product = await Product.findById(productId);
      if (!product) {
        return res.status(404).json({
          success: false,
          message: "Product not found",
        });
      }

      // Process image removals
      const imagesToRemove = req.body.removeTheseImages
        ? JSON.parse(req.body.removeTheseImages)
        : [];

      if (imagesToRemove.length > 0) {
        await processImageDeletions(imagesToRemove);

        // Remove deleted images from product
        product.imageUrls = product.imageUrls.filter(
          (imageUrl) => !imagesToRemove.includes(imageUrl)
        );
      }

      // Process new image uploads
      const newImageUrls = await processImageUploads(files);

      if (newImageUrls.length > 0) {
        product.imageUrls = [...(product.imageUrls || []), ...newImageUrls];
      }

      // Update product fields
      Object.keys(updateData).forEach((key) => {
        product[key] = updateData[key];
      });

      // Save updated product
      await product.save();

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
  }
);

router.delete("/:id", auth, async (req, res) => {
  try {
    if (req.user.userType !== "Admin") {
      return res.status(403).json({ message: "Unauthorized" });
    }

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
