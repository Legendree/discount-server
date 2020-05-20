const express = require('express');

const User = require('../models/User');

const ErrorResponse = require('../utils/errorResponse');

const role = require('../middleware/role');
const auth = require('../middleware/auth');
const asyncHandler = require('express-async-handler');
const advanceQuery = require('../middleware/advancedQuery');

const router = express.Router();

router.get(
  '/',
  advanceQuery(User),
  [auth, role('admin')],
  asyncHandler(async (req, res, next) => {
    res.status(200).json({
      success: true,
      count: res.advancedResult.length,
      data: res.advancedResult,
    });
  })
);

router.get(
  '/:id',
  [auth, role('admin')],
  asyncHandler(async (req, res, next) => {
    const user = await User.findById(req.params.id);
    if (!user) return next(new ErrorResponse('User not found', 404));
    res.send({
      success: true,
      data: user,
    });
  })
);

router.post(
  '/',
  [auth, role('admin')],
  asyncHandler(async (req, res, next) => {
    const user = await User.create(req.body);
    res.send({
      success: true,
      data: user,
    });
  })
);

router.put(
  '/:id',
  [auth, role('admin')],
  asyncHandler(async (req, res, next) => {
    const user = await User.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!user) return next(new ErrorResponse('User not found', 404));
    res.send({
      success: true,
      data: user,
    });
  })
);

router.delete(
  '/:id',
  [auth, role('admin')],
  asyncHandler(async (req, res, next) => {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return next(new ErrorResponse('User not found', 404));
    res.send({
      success: true,
      data: user,
    });
  })
);

module.exports = router;
