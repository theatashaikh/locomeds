const router = require("express").Router();
const Admin = require("../models/adminModel");
const Vendor = require("../models/vendorModel");
const { isEmail } = require("validator");
const adminAuth = require("../middlewares/adminAuth");
const bcrypt = require("bcryptjs");

// Regiter a new admin
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

    if (!phoneNumber) {
      return res.status(400).json({ message: "Phone number is required" });
    }

    if (String(phoneNumber).length != 10) {
      return res.status(400).json({ message: "Invalid phone number" });
    }

    if (isEmail(email) === false) {
      return res.status(400).json({ message: "Invalid email address" });
    }

    const isEmailAlreadyUsedAsAdmin = await Admin.findOne({ email });
    const isEmailAlreadyUsedAsVendor = await Vendor.findOne({ email });

    if (isEmailAlreadyUsedAsAdmin || isEmailAlreadyUsedAsVendor) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const isPhoneNumberAlreadyUsedAsAdmin = await Admin.findOne({
      phoneNumber,
    });
    const isPhoneNumberAlreadyUsedAsVendor = await Vendor.findOne({
      phoneNumber,
    });

    if (isPhoneNumberAlreadyUsedAsAdmin || isPhoneNumberAlreadyUsedAsVendor) {
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

    const admin = new Admin({
      firstName,
      lastName,
      email,
      password,
      phoneNumber,
    });

    const token = await admin.generateAuthToken();

    await admin.save();
    res.status(200).json({ admin, token });
  } catch (err) {
    res.status(500).json(err);
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

    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(400).json({ message: "Invalid email" });
    }

    const isPasswordCorrect = await bcrypt.compare(password, admin.password);

    if (!isPasswordCorrect) {
      return res.status(400).json({ message: "Invalid password" });
    }

    const token = await admin.generateAuthToken();
    res.status(200).json({ admin, token });
  } catch (error) {
    res.status(500).json(error);
  }
});

// Updating an admin profile
router.put("/update-profile", adminAuth, async (req, res) => {
  try {
    const admin = req.admin;
    let availableUpdates = ["firstName", "lastName", "phoneNumber"];

    const adminUpdating = Object.keys(req.body);
    const isValidOperation = adminUpdating.every((update) =>
      availableUpdates.includes(update)
    );

    if (!isValidOperation) {
      return res.json({ message: "Invalid updates" });
    }
    adminUpdating.forEach((update) => {
      req.admin[update] = req.body[update];
    });

    console.log();

    await admin.save();
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
router.put("/change-password", adminAuth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const admin = req.admin;

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
      admin.password
    );

    if (!isCurrentPasswordCorrect) {
      return res.status(400).json({ message: "Invalid current password" });
    }

    if (newPassword.length < 6 || newPassword.length > 18) {
      return res.status(400).json({
        message: "Password must be between 6 and 18 characters long",
      });
    }

    admin.password = newPassword;
    await admin.save();
    res.json({ message: "Password changed successfully" });
  } catch (error) {
    res.status(500).json(error);
  }
});

// Logout an admin
router.post("/logout", adminAuth, async (req, res) => {
  try {
    req.admin.tokens = req.admin.tokens.filter((token) => {
      return token.token !== req.token;
    });
    await req.admin.save();
    res.json({ message: "Logged out successfully" });
  } catch (error) {
    res.status(500).send(error);
  }
});

module.exports = router;
