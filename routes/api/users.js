const express = require("express");
const router = express.Router();
const { check, validationResult } = require("express-validator");
const gravatar = require("gravatar");
const User = require("../../models/User");
const brcypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const config = require("config");
// @route POST api/users - make users page
// @desc  Register
// access Public

router.post(
  "/",
  [
    check("name", "Name is required").not().isEmpty(),
    check("email", "Please include a valid email").isEmail(),
    check(
      "password",
      "Please provide a password with 6 or more characters"
    ).isLength({ min: 6 }),
  ],
  async (req, res) => {
    const errors = validationResult(req); //handle response - check errors
    if (!errors.isEmpty()) {
      return res.status(420).json({ errors: errors.array() });
    }

    //deconstruct from User
    const { name, email, password } = req.body;

    try {
      let user = await User.findOne({ email });
      //Check if User exists
      if (user) {
        return res
          .status(420)
          .json({ errors: [{ msg: "User already exists" }] });
      }
      //Get users gravatar
      const avatar = gravatar.url(email, {
        s: "200",
        r: "pg",
        d: "mm",
      });

      user = new User({
        name,
        email,
        avatar,
        password,
      });

      //Encrypt password
      const salt = await brcypt.genSalt(10);
      user.password = await brcypt.hash(password, salt);
      await user.save();
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
