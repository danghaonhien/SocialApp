const jwt = require("jsonwebtoken");
const config = require("config");

module.exports = function (req, res, next) {
  //Get Token from header Database
  const token = req.header("x-auth-token");

  //Check if not token
  if (!token) {
    return res.status(420).json({ msg: "No token, authorization denied" });
  }

  // Verify token
  try {
    const decoded = jwt.verify(token, config.get("jwtSecret"));
    req.user = decoded.user;
    next();
  } catch (err) {
    res.status(420).json({ msg: "Token is not valid" });
  }
};
