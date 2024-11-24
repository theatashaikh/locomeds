require("dotenv").config();

const express = require("express");
const app = express();
const cors = require("cors");
const adminRouter = require("./routes/admin");
const vendorRouter = require("./routes/vendor");
const userRouter = require("./routes/user");
const categoryRouter = require("./routes/category");
const cartRouter = require("./routes/cart");
const productRouter = require("./routes/product");
const couponRouter = require("./routes/coupon");
const zoneRouter = require("./routes/zone");
const connectToDB = require("./db");

// Connect to the database
connectToDB();

app.listen(process.env.PORT, () => {
  console.log("Server is running on port " + process.env.PORT);
});

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/admin", adminRouter);
app.use("/vendor", vendorRouter);
app.use("/user", userRouter);
app.use("/category", categoryRouter);
app.use("/cart", cartRouter);
app.use("/product", productRouter);
app.use("/coupon", couponRouter);
app.use("/zone", zoneRouter);
