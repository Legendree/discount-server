const express = require('express');
const asyncHandler = require('express-async-handler');
const User = require('../models/user');
const ErrorResponse = require('../utils/errorResponse');
const role = require('../middleware/role');

const router = express.Router();

router.post(
  '/register',
  asyncHandler(async (req, res, next) => {
    const { name, email, password, role } = req.body;
    const user = await User.create({
      name,
      email,
      password,
      role,
    });

    sendTokenResponse(user, 200, res);
  })
);

router.post(
  '/login',
  asyncHandler(async (req, res, next) => {
    const { email, password } = req.body;

    // Validate email and password
    if (!email || !password)
      return next(new ErrorResponse('Please enter email and password', 400));

    // Check for user
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return next(new ErrorResponse('Invalid email or password', 401));
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);
    if (!isMatch)
      return next(new ErrorResponse('Invalid email or password', 401));

    sendTokenResponse(user, 200, res);
  })
);

router.get(
  '/profile',
  role(['user']),
  asyncHandler(async (req, res, next) => {
    const user = await User.findById(req.user.id);
    res.json({
      success: true,
      date: user,
    });
  })
);

// Get token form model, and add as a cookie
const sendTokenResponse = (user, statusCode, res) => {
  const token = user.getSignedJwtToken();

  const options = {
    httpOnly: true,
  };
  res.status(statusCode).cookie('token', token, options).json({
    success: true,
    token,
  });
};

module.exports = router;
