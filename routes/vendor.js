const router = require("express").Router();
const Vendor = require("../models/vendorModel");
const Admin = require("../models/adminModel");
const { isEmail } = require("validator");
const vendorAuth = require("../middlewares/vendorAuth");
const bcrypt = require("bcryptjs");

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
      !address.pincode ||
      !address.zone
    ) {
      return res.status(400).json({ message: "Address is incomplete" });
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

    const vendor = new Vendor({
      firstName,
      lastName,
      email,
      password,
      phoneNumber,
      businessName,
      address,
    });

    const token = await vendor.generateAuthToken();

    await vendor.save();
    res.status(200).json({ vendor, token });
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
router.put("/update-profile", vendorAuth, async (req, res) => {
  try {
    const vendor = req.vendor;
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
      req.vendor[update] = req.body[update];
    });

    console.log();

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
router.put("/change-password", vendorAuth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const vendor = req.vendor;

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
router.post("/logout", vendorAuth, async (req, res) => {
  try {
    req.vendor.tokens = req.vendor.tokens.filter((token) => {
      return token.token !== req.token;
    });
    await req.vendor.save();
    res.json({ message: "Logged out successfully" });
  } catch (error) {
    res.status(500).send(error);
  }
});

module.exports = router;
