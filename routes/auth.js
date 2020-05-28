const express = require('express');
const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const ErrorResponse = require('../utils/errorResponse');
const auth = require('../middleware/auth');
const role = require('../middleware/role');
const sendEmail = require('../utils/sendemail');
const crypto = require('crypto');
const path = require('path');
const router = express.Router();
const fs = require('fs');

router.post(
  '/register',
  asyncHandler(async (req, res, next) => {
    const { name, email, password, role, fcmToken } = req.body;
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
  auth,
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

    const htmlEmail = fs.readFileSync(
      'C:UsersDanmiOneDriveDesktopDiscount\backenddiscount-serverhtml\resetpassword.html',
      {
        encoding: 'utf-8',
      }
    );
    console.log(htmlEmail);

    try {
      await sendEmail({
        email: user.email,
        subject: 'Reset your password',
        html: htmlEmail,
      });
      res.json({
        success: true,
        data: 'Email sent.',
      });
    } catch (error) {
      //   console.log(error);
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;

      await user.save({ validateBeforeSave: false });

      return next(new ErrorResponse('Email could not be sent.', 500));
    }
  })
);

router.post(
  '/resetpassword/:resettoken',
  asyncHandler(async (req, res, next) => {
    //Get reset password token
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(req.params.resettoken)
      .digest('hex');

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() },
    });
    if (!user) return next(new ErrorResponse('Invalid reset password link'));

    //Set new password
    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    sendTokenResponse(user, 200, res);
  })
);

router.put(
  '/updateinfo',
  [auth, role('user')],
  asyncHandler(async (req, res, next) => {
    const fieldsToUpdate = {
      name: req.body.name,
      email: req.body.email,
    };

    const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
      new: true,
      runValidators: true,
    });

    res.json({
      success: true,
      date: user,
    });
  })
);

router.put(
  '/updatepassword',
  [auth, role('user')],
  asyncHandler(async (req, res, next) => {
    const user = await User.findById(req.user.id).select('+password');

    if (!(await user.matchPassword(req.body.currentPassword)))
      return next(new ErrorResponse('Password is incorrect', 401));

    user.password = req.body.newPassword;
    await user.save();

    sendTokenResponse(user, 200, res);
  })
);

router.get(
  '/logout',
  [auth, role('user', 'admin')],
  asyncHandler(async (req, res, next) => {
    res.cookie('token', 'none', {
      expires: new Date(Date.now + 10 * 1000),
      httpOnly: true,
    });
    res.json({
      success: true,
      date: {},
    });
  })
);

router.get(
  '/favorites',
  auth,
  asyncHandler(async (req, res, next) => {
    const user = await User.findById(req.user.id).populate({
      path: 'favoritePosts',
      select: 'storeName image',
    });
    if (user.favoritePosts === undefined || user.favoritePosts.length == 0)
      return next(new ErrorResponse('No favorites', 404));
    res.status(200).json({
      success: true,
      data: user.favoritePosts,
    });
  })
);

router.put(
  '/updatefcm',
  auth,
  asyncHandler(async (req, res, next) => {
    const user = await User.findById(req.user.id);
    const { token } = req.body;
    if (!user)
      return next(new ErrorResponse('No user found to perform this task', 404));
    user.fcmToken = token;
    await user.save({ validateBeforeSave: false });
    res.status(200).json({ success: true, data: user });
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
