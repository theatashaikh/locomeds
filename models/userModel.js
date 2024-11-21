const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// Address Schema for vendor
const addressSchema = new mongoose.Schema({
  addressLine: {
    type: String,
    required: true,
    lowercase: true,
  },
  zone: {
    type: String,
    required: true,
    lowercase: true,
  },
  district: {
    type: String,
    required: true,
    lowercase: true,
  },
  city: {
    type: String,
    required: true,
    lowercase: true,
  },
  state: {
    type: String,
    required: true,
    lowercase: true,
  },
  country: {
    type: String,
    required: true,
    lowercase: true,
    default: "india",
  },
  pincode: {
    type: Number,
    required: true,
    lowercase: true,
  },
});

// Base base User Schema
const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    phoneNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    userType: {
      type: String,
      required: true,
      enum: ["Admin", "Vendor", "GeneralUser"],
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
  {
    timestamps: true,
    discriminatorKey: "userType",
  }
);

// Hash the password before saving the user
userSchema.pre("save", async function (next) {
  const user = this;
  if (user.isModified("password")) {
    user.password = await bcrypt.hash(user.password, 8);
  }
  next();
});

// Generate an authentication token
userSchema.methods.generateAuthToken = async function () {
  try {
    const user = this;
    const token = jwt.sign(
      { _id: user._id.toString() },
      process.env.JWT_AUTH_TOKEN
    );
    user.tokens = user.tokens.concat({ token });
    await user.save();
    return token;
  } catch (error) {
    console.log(error);
  }
};

// Base User Model
const User = mongoose.model("User", userSchema);

// Discriminator for Admin
const Admin = User.discriminator(
  "Admin",
  new mongoose.Schema({
    role: {
      type: String,
      required: true,
      default: "admin",
    },
  })
);

// Discriminator for Vendor
const Vendor = User.discriminator(
  "Vendor",
  new mongoose.Schema({
    businessName: {
      type: String,
      required: true,
      trim: true,
    },
    verificationStatus: {
      type: String,
      enum: ["pending", "verified", "rejected"],
      default: "pending",
    },
    address: addressSchema,
  })
);

// Discriminator for Regular User
const RegularUser = User.discriminator(
  "GeneralUser",
  new mongoose.Schema({
    address: addressSchema,
    alternativePhoneNumber: {
      type: String,
      trim: true,
    },
  })
);

module.exports = { User, Admin, Vendor, RegularUser };
