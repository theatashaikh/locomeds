const Admin = require("../models/adminModel");
const jwt = require("jsonwebtoken");

async function adminAuth(req, res, next) {
  try {
    const token = req.header("Authorization");
    const decoded = jwt.verify(token, process.env.JWT_AUTH_TOKEN);

    const admin = await Admin.findOne({
      _id: decoded._id,
      "tokens.token": token,
    });

    if (!admin) {
      throw new Error();
    }

    req.token = token;
    req.admin = admin;
    next();
  } catch (error) {
    res.status(401).json({ message: "Unauthorized, Please Authenticate" });
  }
}

module.exports = adminAuth;
