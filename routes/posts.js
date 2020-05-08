const express = require('express');

const Post = require('../models/Posts');

const ErrorResponse = require('../utils/errorResponse');

const asyncHandler = require('express-async-handler');
const advanceQuery = require('../middleware/advancedQuery')


const router = express.Router();

router.get(
  '/',
  advanceQuery(Post),
  asyncHandler(async (req, res, next) => {
    res.status(200).json({ success: true, count: res.advancedResult.length, data: res.advancedResult });
  })
);

router.get(
  '/:id',
  asyncHandler(async (req, res, next) => {
    const Post = await Post.findById(req.params.id);
    if (!Post) return next(new ErrorResponse('Post not found', 404));
    res.status(200).json({
      success: true,
      data: Post,
    });
  })
);

router.post(
  '/',
  asyncHandler(async (req, res, next) => {
    const Post = await Post.create(req.body);
    res.status(200).json({
      success: true,
      data: Post,
    });
  })
);

router.put('/:id', async (req, res, next) => {
  const Post = await Post.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!Post) return next(new ErrorResponse('Post not found', 404));
  res.status(200).json({
    success: true,
    data: Post,
  });
});

router.delete('/:id', async (req, res, next) => {
  const Post = await Post.findByIdAndDelete(req.params.id);
  if (!Post) return next(new ErrorResponse('Post not found', 404));
  res.status(200).json({
    success: true,
    data: {},
  });
});

module.exports = router;
