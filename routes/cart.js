const router = require("express").Router();
const auth = require("../middlewares/auth");
const Cart = require("../models/cartModel");

// Add a product to the cart
router.post("/add-to-cart", auth, async (req, res) => {
  let { productId, quantity } = req.body;

  if (!productId) {
    return res.status(400).json({ message: "Product ID is required" });
  }

  if (!quantity) {
    quantity = 1;
  }

  try {
    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      cart = new Cart({ user: req.user._id, items: [] });
    }

    // Check if the product is already in the cart
    const itemIndex = cart.items.findIndex(
      (item) => item.product.toString() === productId
    );

    // If the product is already in the cart, update the quantity
    if (itemIndex > -1) {
      cart.items[itemIndex].quantity += quantity;
    } else {
      // If the product is not in the cart, add it
      cart.items.push({ product: productId, quantity });
    }

    cart.updatedAt = Date.now();
    await cart.save();
    res.status(200).json(cart);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error adding to cart", error: err.message });
  }
});

// Get the cart
router.get("/user-cart", auth, async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id }).populate(
      "items.product"
    );
    if (!cart) return res.status(404).json({ message: "Cart not found" });
    res.status(200).json(cart);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error fetching cart", error: err.message });
  }
});

// Remove a product from the cart
router.delete("/user-cart/:productId", auth, async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) return res.status(404).json({ message: "Cart not found" });

    cart.items = cart.items.filter(
      (item) => item.product.toString() !== req.params.productId
    );
    cart.updatedAt = Date.now();
    await cart.save();

    res.status(200).json(cart);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error removing product", error: err.message });
  }
});

// Clear the cart

router.delete("/clear-cart", auth, async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) return res.status(404).json({ message: "Cart not found" });

    cart.items = [];
    cart.updatedAt = Date.now();
    await cart.save();

    res.status(200).json(cart);
  } catch (error) {
    res.status(500).json(error);
  }
});

module.exports = router;
