const router = require("express").Router();
const { GeneralUser, Vendor } = require("../models/userModel");
const { isEmail } = require("validator");
const bcrypt = require("bcryptjs");
const auth = require("../middlewares/auth");
const Cart = require("../models/cartModel");
const Order = require("../models/orderModel");
const Product = require("../models/productModel");
const nodeMailer = require("nodemailer");
const capitalizeFirstLetter = require("../utils/capitalizeFirstLetter");

// Regiter a new user
router.post("/register", async (req, res) => {
  try {
    const { firstName, lastName, email, password, phoneNumber } = req.body;

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

    if (isEmail(email) === false) {
      return res.status(400).json({ message: "Invalid email address" });
    }

    if (!phoneNumber) {
      return res.status(400).json({ message: "Phone number is required" });
    }

    if (String(phoneNumber).length != 10) {
      return res.status(400).json({ message: "Invalid phone number" });
    }

    if (!password) {
      return res.status(400).json({ message: "Password is required" });
    }

    if (password.length < 6 || password.length > 18) {
      return res.status(400).json({
        message: "Password must be between 6 and 18 characters long",
      });
    }

    const isEmailAlreadyUsed = await GeneralUser.findOne({ email });

    if (isEmailAlreadyUsed) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const isPhoneNumberAlreadyUsed = await GeneralUser.findOne({
      phoneNumber,
    });

    if (isPhoneNumberAlreadyUsed) {
      return res.status(400).json({ message: "Phone number already exists" });
    }

    const user = new GeneralUser({
      firstName,
      lastName,
      email,
      password,
      phoneNumber,
    });

    const token = await user.generateAuthToken();
    await user.save();

    res.status(201).json({ user, token });
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
    res.status(500).json({ message: error.message });
  }
});

// Login a user
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    if (!password) {
      return res.status(400).json({ message: "Password is required" });
    }

    const user = await GeneralUser.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid email" });
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);

    if (!isPasswordCorrect) {
      return res.status(400).json({ message: "Invalid password" });
    }

    const token = await user.generateAuthToken();
    res.status(200).json({ user, token });
  } catch (error) {
    res.status(500).json(error);
  }
});

// Updating a user profile
router.put("/update-profile", auth, async (req, res) => {
  try {
    if (req.user.userType !== "GeneralUser") {
      return res
        .status(401)
        .json({ message: "Unauthorized!!! Only user has this permission" });
    }
    const user = req.user;
    let availableUpdates = ["firstName", "lastName", "phoneNumber"];

    const userUpdating = Object.keys(req.body);
    const isValidOperation = userUpdating.every((update) =>
      availableUpdates.includes(update)
    );

    if (!isValidOperation) {
      return res.json({ message: "Invalid updates" });
    }
    userUpdating.forEach((update) => {
      user[update] = req.body[update];
    });

    await user.save();
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

// Add shipping address
router.put("/add-shipping-address", auth, async (req, res) => {
  try {
    if (req.user.userType !== "GeneralUser") {
      return res
        .status(401)
        .json({ message: "Unauthorized!!! Only user has this permission" });
    }

    const user = req.user;
    const { shippingAddress } = req.body;

    if (!shippingAddress) {
      return res.status(400).json({ message: "Shipping address is required" });
    }

    if (
      !shippingAddress.addressLine ||
      !shippingAddress.district ||
      !shippingAddress.city ||
      !shippingAddress.state ||
      !shippingAddress.pincode ||
      !shippingAddress.zone
    ) {
      return res
        .status(400)
        .json({ message: "Shipping address is incomplete" });
    }

    user.shippingAddresses.push(shippingAddress);
    await user.save();
    res.json({ message: "Shipping address added successfully" });
  } catch (error) {
    res.status(500).json(error);
  }
});

// Get all shipping addresses
router.get("/shipping-addresses", auth, async (req, res) => {
  try {
    if (req.user.userType !== "GeneralUser") {
      return res
        .status(401)
        .json({ message: "Unauthorized!!! Only user has this permission" });
    }

    res.json(req.user.shippingAddresses);
  } catch (error) {
    res.status(500).json(error);
  }
});

// Update shipping address
router.put("/update-shipping-address/:addressId", auth, async (req, res) => {
  try {
    if (req.user.userType !== "GeneralUser") {
      return res
        .status(401)
        .json({ message: "Unauthorized!!! Only user has this permission" });
    }

    const user = req.user;
    const { shippingAddress } = req.body;

    if (!shippingAddress) {
      return res.status(400).json({ message: "Shipping address is required" });
    }

    if (
      !shippingAddress.addressLine ||
      !shippingAddress.district ||
      !shippingAddress.city ||
      !shippingAddress.state ||
      !shippingAddress.pincode ||
      !shippingAddress.zone
    ) {
      return res
        .status(400)
        .json({ message: "Shipping address is incomplete" });
    }

    const addressIndex = user.shippingAddresses.findIndex(
      (address) => address._id == req.params.addressId
    );
    if (addressIndex == -1) {
      return res.status(404).json({ message: "Address not found" });
    }

    user.shippingAddresses[addressIndex] = shippingAddress;
    await user.save();
    res.json({ message: "Shipping address updated successfully" });
  } catch (error) {
    res.status(500).json(error);
  }
});

// Delete shipping address
router.delete("/delete-shipping-address/:addressId", auth, async (req, res) => {
  try {
    if (req.user.userType !== "GeneralUser") {
      return res
        .status(401)
        .json({ message: "Unauthorized!!! Only user has this permission" });
    }

    const user = req.user;
    const addressIndex = user.shippingAddresses.findIndex(
      (address) => address._id == req.params.addressId
    );

    if (addressIndex == -1) {
      return res.status(404).json({ message: "Address not found" });
    }

    user.shippingAddresses.splice(addressIndex, 1);
    await user.save();
    res.json({ message: "Shipping address deleted successfully" });
  } catch (error) {
    res.status(500).json(error);
  }
});

// Change password
router.put("/change-password", auth, async (req, res) => {
  try {
    if (req.user.userType !== "GeneralUser") {
      return res
        .status(401)
        .json({ message: "Unauthorized!!! Only user has this permission" });
    }
    const { currentPassword, newPassword } = req.body;
    const user = req.user;

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
      user.password
    );

    if (!isCurrentPasswordCorrect) {
      return res.status(400).json({ message: "Invalid current password" });
    }

    if (newPassword.length < 6 || newPassword.length > 18) {
      return res.status(400).json({
        message: "Password must be between 6 and 18 characters long",
      });
    }

    user.password = newPassword;
    await user.save();
    res.json({ message: "Password changed successfully" });
  } catch (error) {
    res.status(500).json(error);
  }
});

// Get user profile
router.get("/profile", auth, async (req, res) => {
  try {
    if (req.user.userType !== "GeneralUser") {
      return res
        .status(401)
        .json({ message: "Unauthorized!!! Only user has this permission" });
    }
    res.json(req.user);
  } catch (error) {
    res.status(500).json(error);
  }
});

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
router.get("/cart", auth, async (req, res) => {
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
router.delete("/cart/:productId", auth, async (req, res) => {
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

// checkout
router.post("/checkout", auth, async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id }).populate(
      "items.product"
    );

    if (!cart) return res.status(404).json({ message: "Cart not found" });

    const totalAmount = cart.items.reduce(
      (acc, item) => acc + item.product.price * item.quantity,
      0
    );

    const discountPercentage = req.body.discountPercentage;
    const discountAmount = (totalAmount * discountPercentage) / 100;
    const totalAmountAfterDiscount = totalAmount - discountAmount;

    const order = new Order({
      user: req.user._id,
      items: cart.items,
      totalAmount,
      discountPercentage,
      totalAmountAfterDiscount,
      discountAmount,
      shippingAddress: req.body.shippingAddress,
      zone: req.body.zone,
      userContactNumber: req.body.userContactNumber,
      paymentMethod: req.body.paymentMethod,
    });

    // Update the stock of the products

    for (let item of cart.items) {
      const product = await Product.findOne({ _id: item.product });
      product.quantity -= item.quantity;
      await product.save();
    }

    await order.save();
    // Delete the cart
    await Cart.findOneAndDelete({ user: req.user._id });

    // send email and push notification to the vendor
    const vendor = await Vendor.findOne({
      zone: req.body.zone,
      userType: "Vendor",
    });
    if (vendor) {
      const transporter = nodeMailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.GOOGLE_APP_EMAIL_FOR_NODEMAILER,
          pass: process.env.GOOGLE_APP_PASSWORD_FOR_NODEMAILER,
        },
      });

      const vendorMailOptions = {
        from: process.env.GOOGLE_APP_EMAIL_FOR_NODEMAILER,
        to: vendor.email,
        subject: "New Order Received",
        html: `
        Dear <b>${vendor.firstName}</b>,

        You have received a new order from <b>${capitalizeFirstLetter(
          req.user.firstName
        )} ${capitalizeFirstLetter(
          req.user.lastName
        )}</b>. Please find the order details below:

        <b>Order ID:</b> ${order._id}
        <b>Total Amount:</b> ${order.totalAmount}
        <b>Total Amount after discount:</b> ${order.totalAmountAfterDiscount}
        <b>Shipping Address:</b> ${order.shippingAddress.addressLine}, ${
          order.shippingAddress.district
        }, ${order.shippingAddress.city}, ${order.shippingAddress.state} - ${
          order.shippingAddress.pincode
        }
        <b>Contact Number:</b> ${order.userContactNumber}

        Please process this order at your earliest convenience.

        Best regards,
        <b>Locomeds</b>`,
      };

      transporter.sendMail(vendorMailOptions, (error, info) => {
        if (error) {
          console.error("Error sending email to vendor:", error);
        } else {
          console.log("Email sent to vendor:", info.response);
        }
      });

      // send email and push notification to the user
      const userMailOptions = {
        from: process.env.GOOGLE_APP_EMAIL_FOR_NODEMAILER,
        to: req.user.email,
        subject: "Order Confirmation",
        html: `
        Dear <b>${capitalizeFirstLetter(req.user.firstName)}</b>,

        Your order has been placed successfully. Please find the order details below:

        <b>Order ID:</b> ${order._id}
        <b>Total Amount:</b> ${order.totalAmount}
        <b>Total Amount after discount:</b> ${order.totalAmountAfterDiscount}
        <b>Shipping Address:</b> ${order.shippingAddress.addressLine}, ${
          order.shippingAddress.district
        }, ${order.shippingAddress.city}, ${order.shippingAddress.state} - ${
          order.shippingAddress.pincode
        }
        <b>Contact Number:</b> ${order.userContactNumber}

        You will receive a notification once the order is processed.

        Best regards,
        <b>Locomeds</b>`,
      };

      transporter.sendMail(userMailOptions, (error, info) => {
        if (error) {
          console.error("Error sending email to user:", error);
        } else {
          console.log("Email sent to user:", info.response);
        }
      });
    }

    res.status(201).json(order);
  } catch (error) {
    res.status(500).json(error);
  }
});

// Logout a user
router.post("/logout", auth, async (req, res) => {
  try {
    if (req.user.userType !== "GeneralUser") {
      return res
        .status(401)
        .json({ message: "Unauthorized!!! Only user has this permission" });
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

module.exports = router;
