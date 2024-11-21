const { User } = require("../models/userModel");
const jwt = require("jsonwebtoken");

async function auth(req, res, next) {
  try {
    const token = req.header("Authorization");
    const decoded = jwt.verify(token, process.env.JWT_AUTH_TOKEN);

    const user = await User.findOne({
      _id: decoded._id,
      "tokens.token": token,
    });

    if (!user) {
      throw new Error();
    }

    req.token = token;
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: "Unauthorized, Please Authenticate" });
  }
}

module.exports = auth;
