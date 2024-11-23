const router = require("express").Router();
const auth = require("../middlewares/auth");
const Coupon = require("../models/couponModel");

// Add a new coupon
router.post("/add-coupon", auth, async (req, res) => {
  try {
    if (req.user.userType !== "Admin") {
      return res
        .status(403)
        .json({ message: "Unauthorized only Admin can add coupon " });
    }

    const { code, discountPercentage, maxDiscount, isActive } = req.body;

    if (!code) {
      return res.status(400).json({ message: "Code is required" });
    }

    if (!discountPercentage) {
      return res
        .status(400)
        .json({ message: "Discount percentage is required" });
    }

    if (discountPercentage < 0 || discountPercentage > 100) {
      return res
        .status(400)
        .json({ message: "Discount percentage must be between 0 and 100" });
    }

    if (!maxDiscount) {
      return res.status(400).json({ message: "Max discount is required" });
    }

    const coupon = new Coupon({
      code,
      discountPercentage,
      maxDiscount,
      isActive,
    });

    await coupon.save();

    res.status(201).json({ message: "Coupon added successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Get all coupons
router.get("/all-coupons", async (req, res) => {
  try {
    const coupons = await Coupon.find();
    res.json(coupons);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Get a coupon by id
router.get("/coupon/:id", async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) {
      return res.status(404).json({ message: "Coupon not found" });
    }
    res.json(coupon);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Update a coupon by id
router.put("/update-coupon/:id", auth, async (req, res) => {
  try {
    if (req.user.userType !== "Admin") {
      return res
        .status(403)
        .json({ message: "Unauthorized only Admin can update coupon " });
    }

    const { discountPercentage, maxDiscount, isActive } = req.body;

    if (!discountPercentage) {
      return res
        .status(400)
        .json({ message: "Discount percentage is required" });
    }

    if (discountPercentage < 0 || discountPercentage > 100) {
      return res
        .status(400)
        .json({ message: "Discount percentage must be between 0 and 100" });
    }

    if (!maxDiscount) {
      return res.status(400).json({ message: "Max discount is required" });
    }

    const coupon = await Coupon.findById(req.params.id);

    if (!coupon) {
      return res.status(404).json({ message: "Coupon not found" });
    }

    coupon.discountPercentage = discountPercentage;
    coupon.maxDiscount = maxDiscount;
    coupon.isActive = isActive;

    await coupon.save();

    res.json({ message: "Coupon updated successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Delete a coupon by id
router.delete("/delete-coupon/:id", auth, async (req, res) => {
  try {
    const coupon = await Coupon.findByIdAndDelete(req.params.id);
    if (!coupon) {
      return res.status(404).json({ message: "Coupon not found" });
    }
    res.json({ message: "Coupon deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;
