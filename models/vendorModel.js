const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

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

const vendorSchema = new mongoose.Schema(
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
    businessName: {
      type: String,
      required: true,
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
      default: "vendor",
    },
    password: {
      type: String,
      required: true,
      min: 6,
      max: 18,
    },
    address: addressSchema,
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

// Hasing the password before saving the vendor. The hashing algortihms will also work when the vendor updates the password.
vendorSchema.pre("save", async function (next) {
  // this refers to the vendor object
  const vendor = this;
  // Check if the password is modified
  if (vendor.isModified("password")) {
    // Hash the password
    vendor.password = await bcrypt.hash(vendor.password, 8);
  }
  next();
});

vendorSchema.methods.generateAuthToken = async function () {
  try {
    const vendor = this;
    const token = jwt.sign(
      { _id: vendor._id.toString() },
      process.env.JWT_AUTH_TOKEN
    );
    vendor.tokens = vendor.tokens.concat({ token });
    await vendor.save();
    return token;
  } catch (error) {
    console.log(error);
  }
};

module.exports = mongoose.model("vendor", vendorSchema);
