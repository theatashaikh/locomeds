const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const adminSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
      min: 3,
      max: 25,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      min: 3,
      max: 25,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
    },
    phoneNumber: {
      type: String,
      trim: true,
      unique: true,
      required: true,
    },
    userType: {
      type: String,
      default: "admin",
    },
    password: {
      type: String,
      required: true,
      min: 6,
      max: 18,
    },
    tokens: [
      {
        token: {
          type: String,
          required: true,
        },
      },
    ],
  },
  { timestamps: true }
);

// Hasing the password before saving the admin. The hashing algortihms will also work when the admin updates the password.
adminSchema.pre("save", async function (next) {
  // this refers to the admin object
  const admin = this;
  // Check if the password is modified
  if (admin.isModified("password")) {
    // Hash the password
    admin.password = await bcrypt.hash(admin.password, 8);
  }
  next();
});

adminSchema.methods.generateAuthToken = async function () {
  try {
    const admin = this;
    const token = jwt.sign(
      { _id: admin._id.toString() },
      process.env.JWT_AUTH_TOKEN
    );
    admin.tokens = admin.tokens.concat({ token });
    await admin.save();
    return token;
  } catch (error) {
    console.log(error);
  }
};

module.exports = mongoose.model("Admin", adminSchema);
