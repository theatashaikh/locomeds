const Vendor = require("../models/vendorModel");
const jwt = require("jsonwebtoken");

async function vendorAuth(req, res, next) {
  try {
    const token = req.header("Authorization");
    const decoded = jwt.verify(token, process.env.JWT_AUTH_TOKEN);

    const vendor = await Vendor.findOne({
      _id: decoded._id,
      "tokens.token": token,
    });

    if (!vendor) {
      throw new Error();
    }

    req.token = token;
    req.vendor = vendor;
    next();
  } catch (error) {
    res.status(401).json({ message: "Unauthorized, Please Authenticate" });
  }
}

module.exports = vendorAuth;
