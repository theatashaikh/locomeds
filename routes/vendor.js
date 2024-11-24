const router = require("express").Router();
const { Vendor } = require("../models/userModel");
const { isEmail } = require("validator");
const auth = require("../middlewares/auth");
const bcrypt = require("bcryptjs");
const Order = require("../models/orderModel");
const Product = require("../models/productModel");
const {
  sendEmailToUserForOrderStatusUpdate,
} = require("../utils/emailNotification");

// Regiter a new vendor
router.post("/register", async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      businessName,
      email,
      password,
      phoneNumber,
      address,
      zone,
    } = req.body;

    if (!firstName) {
      return res.status(400).json({ message: "First name is required" });
    }

    if (firstName.length < 3) {
      return res
        .status(400)
        .json({ message: "First name must be at least 3 characters" });
    }

    if (!lastName) {
      return res.status(400).json({ message: "Last name is required" });
    }

    if (lastName.length < 3) {
      return res
        .status(400)
        .json({ message: "Last name must be at least 3 characters" });
    }

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    if (!phoneNumber) {
      return res.status(400).json({ message: "Phone number is required" });
    }

    if (String(phoneNumber).length != 10) {
      return res.status(400).json({ message: "Invalid phone number" });
    }

    if (!businessName) {
      return res.status(400).json({ message: "Bussiness name is required" });
    }

    if (!address) {
      return res.status(400).json({ message: "Address is required" });
    }

    if (
      !address.addressLine ||
      !address.district ||
      !address.city ||
      !address.state ||
      !address.pincode
    ) {
      return res.status(400).json({ message: "Address is incomplete" });
    }

    if (!zone) {
      return res.status(400).json({ message: "Zone is required" });
    }

    if (isEmail(email) === false) {
      return res.status(400).json({ message: "Invalid email address" });
    }

    const isEmailAlreadyUsed = await Vendor.findOne({ email });

    if (isEmailAlreadyUsed) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const isPhoneNumberAlreadyUsed = await Vendor.findOne({
      phoneNumber,
    });

    if (isPhoneNumberAlreadyUsed) {
      return res.status(400).json({ message: "Phone number already exists" });
    }

    if (!password) {
      return res.status(400).json({ message: "Password is required" });
    }

    if (password.length < 6 || password.length > 18) {
      return res.status(400).json({
        message: "Password must be between 6 and 18 characters long",
      });
    }

    const vendor = new Vendor({
      firstName,
      lastName,
      email,
      password,
      phoneNumber,
      businessName,
      address,
      zone,
    });

    const token = await vendor.generateAuthToken();

    await vendor.save();
    res.status(200).json({ vendor, token });
  } catch (error) {
    if (
      error.errorResponse.keyPattern.phoneNumber ||
      error.errorResponse.keyValue.phoneNumber
    ) {
      return res.status(400).json({ message: "Phone number already exists" });
    }
    if (
      error.errorResponse.keyPattern.email ||
      error.errorResponse.keyValue.email
    ) {
      return res.status(400).json({ message: "Email already exists" });
    }
    res.status(500).json(error);
  }
});

// Login an admin
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    if (!password) {
      return res.status(400).json({ message: "Password is required" });
    }

    const vendor = await Vendor.findOne({ email });
    if (!vendor) {
      return res.status(400).json({ message: "Invalid email" });
    }

    const isPasswordCorrect = await bcrypt.compare(password, vendor.password);

    if (!isPasswordCorrect) {
      return res.status(400).json({ message: "Invalid password" });
    }

    const token = await vendor.generateAuthToken();
    res.status(200).json({ vendor, token });
  } catch (error) {
    res.status(500).json(error);
  }
});

// Updating a vendor profile
router.put("/update-profile", auth, async (req, res) => {
  try {
    if (req.user.userType !== "Vendor") {
      return res
        .status(401)
        .json({ message: "Unauthorized!!! Only vendor has this permission" });
    }
    const vendor = req.user;
    let availableUpdates = [
      "firstName",
      "lastName",
      "phoneNumber",
      "address",
      "businessName",
    ];

    const vendorUpdating = Object.keys(req.body);
    const isValidOperation = vendorUpdating.every((update) =>
      availableUpdates.includes(update)
    );

    if (!isValidOperation) {
      return res.json({ message: "Invalid updates" });
    }
    vendorUpdating.forEach((update) => {
      vendor[update] = req.body[update];
    });

    await vendor.save();
    res.json({ message: "Profile updated successfully" });
  } catch (error) {
    if (
      error.errorResponse.keyPattern.phoneNumber ||
      error.errorResponse.keyValue.phoneNumber
    ) {
      return res.status(400).json({ message: "Phone number already exists" });
    }
    res.status(500).json(error);
  }
});

// Change password
router.put("/change-password", auth, async (req, res) => {
  try {
    if (req.user.userType !== "Vendor") {
      return res
        .status(401)
        .json({ message: "Unauthorized!!! Only vendor has this permission" });
    }
    const { currentPassword, newPassword } = req.body;
    const vendor = req.user;

    if (!currentPassword) {
      return res.status(400).json({ message: "Current password is required" });
    }

    if (!newPassword) {
      return res.status(400).json({ message: "New password is required" });
    }

    if (currentPassword === newPassword) {
      return res.status(400).json({
        message: "New password must be different from the current password",
      });
    }

    const isCurrentPasswordCorrect = await bcrypt.compare(
      currentPassword,
      vendor.password
    );

    if (!isCurrentPasswordCorrect) {
      return res.status(400).json({ message: "Invalid current password" });
    }

    if (newPassword.length < 6 || newPassword.length > 18) {
      return res.status(400).json({
        message: "Password must be between 6 and 18 characters long",
      });
    }

    vendor.password = newPassword;
    await vendor.save();
    res.json({ message: "Password changed successfully" });
  } catch (error) {
    res.status(500).json(error);
  }
});

// Logout a vendor
router.post("/logout", auth, async (req, res) => {
  try {
    if (req.user.userType !== "Vendor") {
      return res
        .status(401)
        .json({ message: "Unauthorized!!! Only vendor has this permission" });
    }
    req.user.tokens = req.user.tokens.filter((token) => {
      return token.token !== req.token;
    });
    await req.user.save();
    res.json({ message: "Logged out successfully" });
  } catch (error) {
    res.status(500).send(error);
  }
});

// Read their orders
router.get("/orders/all", auth, async (req, res) => {
  try {
    if (req.user.userType !== "Vendor") {
      return res
        .status(401)
        .json({ message: "Unauthorized!!! only Vendor has the permission" });
    }

    const orders = await Order.find({ zone: req.user.zone });
    res.json(orders);
  } catch (error) {
    return res.status(500).send(error.message);
  }
});

// Read their order by ID
router.get("/order/:id", auth, async (req, res) => {
  try {
    if (req.user.userType !== "Vendor") {
      return res
        .status(401)
        .json({ message: "Unauthorized!!! only Vendor has the permission" });
    }

    const order = await Order.findOne({
      _id: req.params.id,
      zone: req.user.zone,
    });

    if (!order) {
      return res.status(400).send("Order not found");
    }

    res.json(order);
  } catch (error) {
    return res.status(500).send(error.message);
  }
});

// Change status of the order
router.put("/order/:id", auth, async (req, res) => {
  try {
    const { status } = req.body;

    const order = await Order.findOne({
      _id: req.params.id,
      zone: req.user.zone,
    }).populate("user");

    const product_ids = order.items.map((item) => item.product.toString());

    const products = await Product.find({ _id: { $in: product_ids } });

    if (!order) {
      return res.status(400).send("Order not found");
    }

    order.status = status;

    // send email and push notification to the user for status update
    sendEmailToUserForOrderStatusUpdate(order, req.user, products);

    await order.save();
    res.send("Order status changes");
  } catch (error) {
    return res.status(500).send(error.message);
  }
});

module.exports = router;
