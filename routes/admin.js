const router = require("express").Router();
const { Admin } = require("../models/userModel");
const { isEmail } = require("validator");
const bcrypt = require("bcryptjs");
const auth = require("../middlewares/auth");

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

    const isEmailAlreadyUsed = await Admin.findOne({ email });

    if (isEmailAlreadyUsed) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const isPhoneNumberAlreadyUsed = await Admin.findOne({
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
router.put("/update-profile", auth, async (req, res) => {
  try {
    if (req.user.userType !== "Admin") {
      return res
        .status(401)
        .json({ message: "Unauthorized!!! only Admin has the permission" });
    }

    const admin = req.user;
    let availableUpdates = ["firstName", "lastName", "phoneNumber"];

    const adminUpdating = Object.keys(req.body);
    const isValidOperation = adminUpdating.every((update) =>
      availableUpdates.includes(update)
    );

    if (!isValidOperation) {
      return res.json({ message: "Invalid updates" });
    }

    adminUpdating.forEach((update) => {
      admin[update] = req.body[update];
    });

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
router.put("/change-password", auth, async (req, res) => {
  try {
    if (req.user.userType !== "Admin") {
      return res
        .status(401)
        .json({ message: "Unauthorized!!! only Admin has the permission" });
    }
    const { currentPassword, newPassword } = req.body;
    const admin = req.user;

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
router.post("/logout", auth, async (req, res) => {
  try {
    if (req.user.userType !== "Admin") {
      return res
        .status(401)
        .json({ message: "Unauthorized!!! only Admin has the permission" });
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
