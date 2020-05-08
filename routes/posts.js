const express = require('express');

const Post = require('../models/Posts');

const ErrorResponse = require('../utils/errorResponse');

const asyncHandler = require('express-async-handler');
const advanceQuery = require('../middleware/advancedQuery');

const router = express.Router();

router.get(
  '/',
  advanceQuery(Post),
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
  asyncHandler(async (req, res, next) => {
    const post = await Post.findById(req.params.id);
    if (!post) return next(new ErrorResponse('Post not found', 404));
    res.status(200).json({
      success: true,
      data: post,
    });
  })
);

router.post(
  '/',
  asyncHandler(async (req, res, next) => {
    const post = await Post.create(req.body);
    res.status(200).json({
      success: true,
      data: post,
    });
  })
);

router.put('/:id', async (req, res, next) => {
  const post = await Post.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!post) return next(new ErrorResponse('Post not found', 404));
  res.status(200).json({
    success: true,
    data: post,
  });
});

router.delete('/:id', async (req, res, next) => {
  const post = await Post.findByIdAndDelete(req.params.id);
  if (!post) return next(new ErrorResponse('Post not found', 404));
  res.status(200).json({
    success: true,
    data: {},
  });
});

module.exports = router;
