const express = require('express');
const User = require('../models/User')
const router = express.Router()
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
var jwt = require('jsonwebtoken');
var fetchuser = require('../middleware/fetchuser')

const JWT_SECRET = 'Sh@bbeerPandaa'

// Route 1 :Create a User using a POST "/api/auth/createuser" dosn't required Auth
router.post('/createuser', [
  body('name', 'Enter a valid Name').isLength({ min: 3 }),
  body('email', 'Enter a valid Email').isEmail(),
  body('password', 'Password must be 5 degit').isLength({ min: 5 }),
], async (req, res) => {
  let success = false;
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success, errors: errors.array() });
  }


  // check email with same email exist

  try {
    let user = await User.findOne({ email: req.body.email });
    if (user) {
      return res.status(400).json({ success, error: 'This email already exists' })
    }

    const salt = await bcrypt.genSalt(10);
    const secPass = await bcrypt.hash(req.body.password, salt);

    // create a  new user
    user = await User.create({
      name: req.body.name,
      email: req.body.email,
      password: secPass,
    })

    const data = {
      user: {
        id: user.id
      }
    }
    const authToken = jwt.sign(data, JWT_SECRET)


    // res.json(user)
    success = true;
    res.json({success, authToken})

  } catch (error) {
    console.error(error.message);
    res.status(500).send("Internal server Error");
  }
})


// Route 2 : Authentication a User using a POST "/api/auth/login" no login required
router.post('/login', [
  body('email', 'Enter a valid Email').isEmail(),
  body('password', 'Enter a unique password').exists(),
], async (req, res) => {
  let success = false
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password } = req.body;
  try {

    let user = await User.findOne({ email });
    if (!user) {
      success = false
      return res.status(400).json({ error: "Please login with correct email and password" })
    }

    const passwordCompare = await bcrypt.compare(password, user.password);
    if (!passwordCompare) {
      success = false
      return res.status(400).json({ success, error: "Please login with correct email and password" })
    }

    const data = {
      user: {
        id: user.id
      }
    }
    success = true
    const authToken = jwt.sign(data, JWT_SECRET)
    res.json({ success, authToken })

  } catch (error) {
    console.error(error.message);
    res.status(500).send("Internal server Error");
  }

})

// Route 2 : Get loggedin User user detail using a POST "/api/auth/getuser" no login required

router.post('/getuser', fetchuser, async (req, res) => {

  try {
    userId = req.user.id;
    const user = await User.findById(userId).select("-password")
    res.send(user)
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Internal server Error");
  }
})

module.exports = router