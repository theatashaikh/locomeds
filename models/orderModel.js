const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  userContactNumber: { type: String, required: true },
  items: [
    {
      product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true,
      },
      quantity: { type: Number, required: true },
    },
  ],
  totalAmount: { type: Number, required: true },
  status: {
    type: String,
    enum: ["pending", "shipped", "out for delivery", "delivered", "canceled"],
    default: "pending",
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  shippingAddress: { type: Object, required: true }, // Can use address from the user model
  zone: { type: String, required: true, lowercase: true },
  paymentMethod: {
    type: String,
    enum: ["upi", "cash on delivery", "debit card", "credit card"],
    required: true,
  },
  paymentStatus: {
    type: String,
    enum: ["pending", "completed"],
    default: "pending",
  },
  prescriptionsUrls: [{ type: String }],
  discountPercentage: { type: Number, default: 0, min: 0, max: 20 },
  discountAmount: { type: Number, default: 0 },
  totalAmountAfterDiscount: { type: Number, default: 0 },
  deliveryCharge: { type: Number, default: 0 },
});

module.exports = mongoose.model("Order", orderSchema);
