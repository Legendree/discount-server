const express = require('express');

const User = require('../models/user');

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

module.exports = router;
