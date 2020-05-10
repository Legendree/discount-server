const express = require('express');
const asyncHandler = require('express-async-handler');
const User = require('../models/user');
const ErrorResponse = require('../utils/errorResponse');
const auth = require('../middleware/auth')
const role = require('../middleware/role');
const sendEmail = require('../utils/sendemail');

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
  [auth, role(['user'])],
  asyncHandler(async (req, res, next) => {
    const user = await User.findById(req.user.id);
    res.json({
      success: true,
      date: user,
    });
  })
);

router.post(
  '/forgotpassword',
  asyncHandler(async (req, res, next) => {
    const user = await User.findOne({ email: req.body.email });
    if (!user) next(new ErrorResponse('Invalid Email', 400));

    //Get reset token
    const resetToken = user.getResetPasswordToken();

    await user.save({ validateBeforeSave: false });

    //Create reset URL
    const resetUrl = `${req.protocol}://${req.get(
      'host'
    )}/api/v1/auth/resetpassword/${resetToken}`;

    const message = `You are recieving this email because you or someone else has requested to reset your password, please make a put request to \n\n ${resetUrl}`;

    try {
      await sendEmail({
        email: user.email,
        subject: 'Discount - Reset your password',
        html: `<p style="font-size:12px; color:MediumSeaGreen;"><b>${message}</b></p>`,
      });
      res.json({
        success: true,
        data: 'Check out your Email son',
      });
    } catch (error) {
      console.log(error);
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;

      await user.save({ validateBeforeSave: false });

      return next(new ErrorResponse('Email could not be sent', 500));
    }
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
