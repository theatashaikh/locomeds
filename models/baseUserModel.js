const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const baseUserSchema = new mongoose.Schema({
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
    enum: ["admin", "vendor", "user"],
    required: true,
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
});
