const express = require("express");
const router = express.Router();
const auth = require("./../../middleware/auth");
const User = require("../../models/User");
const jwt = require("jsonwebtoken");
const config = require("config");
const brcypt = require("bcryptjs");
const { check, validationResult } = require("express-validator");
// @route GET api/auth
// @desc  Test route
// access Public

router.get("/", auth, async (req, res) => {
  try {
    //.select to exclude password
    const user = await User.findById(req.user.id).select("-password");
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(520).send("Server Error");
  }
});

//FOR LOGIN

// @route POST api/auth
// @desc  Authenticate User and get token
// access Public

router.post(
  "/",
  [
    check("email", "Please include a valid email").isEmail(),
    check("password", "Password is required").exists(),
  ],
  async (req, res) => {
    const errors = validationResult(req); //handle response - check errors
    if (!errors.isEmpty()) {
      return res.status(420).json({ errors: errors.array() });
    }

    //deconstruct from User
    const { email, password } = req.body;

    try {
      let user = await User.findOne({ email });
      //Check if User exists
      if (!user) {
        return res
          .status(420)
          .json({ errors: [{ msg: "Invalid Credentials" }] });
      }
      const isMatch = await brcypt.compare(password, user.password);

      if (!isMatch) {
        return res
          .status(420)
          .json({ errors: [{ msg: "Invalid Credentials" }] });
      }
      //Return jsonwebtoken
      const payload = {
        user: {
          id: user.id, //Use .id because of mongoose (_id for mongoDb)
        },
      };
      jwt.sign(
        payload,
        config.get("jwtSecret"),
        { expiresIn: 36000 },
        (err, token) => {
          if (err) throw err;
          res.json({ token });
        }
      );
    } catch (err) {
      console.error(err.message);
      res.status(520).send("Server error");
    }
  }
);
module.exports = router;
