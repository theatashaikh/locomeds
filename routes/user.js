const router = require("express").Router();
const { GeneralUser, Vendor } = require("../models/userModel");
const { isEmail } = require("validator");
const bcrypt = require("bcryptjs");
const auth = require("../middlewares/auth");
const Cart = require("../models/cartModel");
const Order = require("../models/orderModel");
const Product = require("../models/productModel");
const Coupon = require("../models/couponModel");
const nodeMailer = require("nodemailer");
const {
  sendEmailToVendorForNewOrder,
  sendEmailToUserForOrderConfirmation,
} = require("../utils/emailNotification");
const upload = require("../middlewares/uploads");
const { uploadToFirebase } = require("../utils/firebase.utils");

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

// checkout
router.post(
  "/checkout",
  auth,
  upload.array("prescriptions", 4),
  async (req, res) => {
    try {
      const {
        zone,
        userContactNumber,
        paymentMethod,
        shippingAddress,
        couponCode,
      } = req.body;

      if (!zone) {
        return res.status(400).json({ message: "Zone is required" });
      }

      if (!userContactNumber) {
        return res
          .status(400)
          .json({ message: "User contact number is required" });
      }

      if (!paymentMethod) {
        return res.status(400).json({ message: "Payment method is required" });
      }

      if (!shippingAddress) {
        return res
          .status(400)
          .json({ message: "Shipping address is required" });
      }

      const cart = await Cart.findOne({ user: req.user._id }).populate(
        "items.product"
      );

      if (!cart) return res.status(404).json({ message: "Cart not found" });

      // if cart.items.product.quantity < cart.items.quantity
      for (let item of cart.items) {
        if (item.product.quantity < item.quantity) {
          return res.status(400).json({
            message: `${item.product.name} is out of stock only ${item.product.quantity} left`,
          });
        }
      }

      // Calculate the total amount by summing up the price of all the products in the cart
      const totalAmount = cart.items.reduce(
        (acc, item) => acc + item.product.price * item.quantity,
        0
      );

      let coupon;

      if (couponCode) {
        coupon = await Coupon.findOne({ code: couponCode });

        if (!coupon) {
          return res.status(404).json({ message: "Coupon not found" });
        }
      }

      let discountPercentage = 0;
      let discountAmount = 0;
      let totalAmountAfterDiscount = totalAmount;

      // If the coupon is valid, calculate the discount amount
      if (coupon) {
        discountPercentage = coupon.discountPercentage;
        discountAmount = (totalAmount * discountPercentage) / 100;
        // If the discount amount is greater than the max discount amount, set the discount amount to the max discount amount
        if (discountAmount > coupon.maxDiscount) {
          discountAmount = coupon.maxDiscount;
        }

        totalAmountAfterDiscount = totalAmount - discountAmount;
      }

      let prescriptionsUrls = [];

      const prescriptionsUrlsNeeded = cart.items.some(
        (item) => item.product.isPrescriptionNecessary === true
      );

      if (prescriptionsUrlsNeeded && req.files.length > 0) {
        for (const file of req.files) {
          const imageUrl = await uploadToFirebase(file, "prescriptions");
          prescriptionsUrls.push(imageUrl);
        }
      }

      // if cart.items.product.isPrescriptionNecessary === true
      for (let item of cart.items) {
        if (
          item.product.isPrescriptionNecessary === true &&
          prescriptionsUrls.length === 0
        ) {
          return res.status(400).json({
            message: `${item.product.name} requires a prescription`,
          });
        }
      }

      const order = new Order({
        user: req.user._id,
        items: cart.items,
        totalAmount,
        discountPercentage,
        totalAmountAfterDiscount,
        discountAmount,
        shippingAddress: JSON.parse(shippingAddress),
        zone: zone,
        userContactNumber: userContactNumber,
        paymentMethod: paymentMethod,
        prescriptionsUrls,
      });

      // Update the stock of the products
      for (let item of cart.items) {
        const product = await Product.findOne({ _id: item.product });
        product.quantity -= item.quantity;
        await product.save();
      }

      const vendor = await Vendor.findOne({
        zone: zone,
        userType: "Vendor",
      });

      if (vendor) {
        await order.save();
        // Delete the cart
        await Cart.findOneAndDelete({ user: req.user._id });

        // send email and push notification to the vendor
        sendEmailToVendorForNewOrder(vendor, order, req.user);
        // send email and push notification to the user
        sendEmailToUserForOrderConfirmation(req.user, order);
      } else {
        return res.status(404).json({ message: "Vendor not found" });
      }

      res.status(201).json(order);
    } catch (error) {
      res.status(500).json(error.message);
    }
  }
);

// buy now

router.post(
  "/buy-now/:productId",
  auth,
  upload.array("prescriptions", 4),
  async (req, res) => {
    try {
      const {
        quantity,
        shippingAddress,
        zone,
        userContactNumber,
        paymentMethod,
        couponCode,
      } = req.body;

      const productId = req.params.productId;

      if (!quantity) {
        return res.status(400).json({ message: "Quantity is required" });
      }

      if (!shippingAddress) {
        return res
          .status(400)
          .json({ message: "Shipping address is required" });
      }

      if (!zone) {
        return res.status(400).json({ message: "Zone is required" });
      }

      if (!userContactNumber) {
        return res
          .status(400)
          .json({ message: "User contact number is required" });
      }

      if (!paymentMethod) {
        return res.status(400).json({ message: "Payment method is required" });
      }

      const product = await Product.findOne({ _id: productId });

      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      if (product.quantity < quantity) {
        return res.status(400).json({
          message: `Product is out of stock only ${product.quantity} left`,
        });
      }

      let coupon;

      if (couponCode) {
        coupon = await Coupon.findOne({ code: couponCode });

        if (!coupon) {
          return res.status(404).json({ message: "Coupon not found" });
        }
      }

      const totalAmount = product.price * quantity;

      let discountPercentage = 0;
      let discountAmount = 0;
      let totalAmountAfterDiscount = totalAmount;

      // If the coupon is valid, calculate the discount amount
      if (coupon) {
        discountPercentage = coupon.discountPercentage;
        discountAmount = (totalAmount * discountPercentage) / 100;
        // If the discount amount is greater than the max discount amount, set the discount amount to the max discount amount
        if (discountAmount > coupon.maxDiscount) {
          discountAmount = coupon.maxDiscount;
        }

        totalAmountAfterDiscount = totalAmount - discountAmount;
      }

      const prescriptionsUrls = [];

      const prescriptionsUrlsNeeded = product.isPrescriptionNecessary;

      if (prescriptionsUrlsNeeded && req.files.length > 0) {
        for (const file of req.files) {
          const imageUrl = await uploadToFirebase(file, "prescriptions");
          prescriptionsUrls.push(imageUrl);
        }
      }

      if (prescriptionsUrlsNeeded && prescriptionsUrls.length === 0) {
        return res.status(400).json({
          message: `${product.name} requires a prescription`,
        });
      }

      const order = new Order({
        user: req.user._id,
        items: [{ product: productId, quantity }],
        totalAmount,
        discountPercentage,
        totalAmountAfterDiscount,
        discountAmount,
        shippingAddress: JSON.parse(shippingAddress),
        zone,
        userContactNumber,
        paymentMethod,
        prescriptionsUrls,
      });

      // Update the stock of the product
      product.quantity -= quantity;
      await product.save();

      const vendor = await Vendor.findOne({
        zone,
        userType: "Vendor",
      });

      if (vendor) {
        await order.save();

        await order.populate("items.product");
        // send email and push notification to the vendor
        sendEmailToVendorForNewOrder(vendor, order, req.user);
        // send email and push notification to the user
        sendEmailToUserForOrderConfirmation(req.user, order);
      } else {
        return res.status(404).json({ message: "Vendor not found" });
      }

      res.status(201).json(order);
    } catch (error) {
      res.status(500).json(error.message);
    }
  }
);

// Get an order by ID
router.get("/orders/:orderId", auth, async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.orderId,
      user: req.user._id,
    });
    if (!order) return res.status(404).json({ message: "Order not found" });
    res.status(200).json(order);
  } catch (error) {
    res.status(500).json(error);
  }
});

// Get all orders
router.get("/orders", auth, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id });
    res.status(200).json(orders);
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
