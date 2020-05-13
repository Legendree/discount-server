const express = require('express');

const Post = require('../models/Posts');

const ErrorResponse = require('../utils/errorResponse');

const asyncHandler = require('express-async-handler');
const advanceQuery = require('../middleware/advancedQuery');

const auth = require('../middleware/auth');
const role = require('../middleware/role');

const path = require('path');
const fs = require('fs');

const router = express.Router();

// @desc    Get all available posts
// @route   GET /api/v1/posts
// @access  Public
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

// @desc    Get available post by id
// @route   GET /api/v1/posts/:id
// @access  Public
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

// @desc    Create a new post
// @route   POST /api/v1/posts
// @access  Private
router.post(
  '/',
  [auth, role('admin')],
  asyncHandler(async (req, res, next) => {
    const post = await Post.create(req.body);
    res.status(200).json({
      success: true,
      data: post,
    });
  })
);

router.put(
  '/:id',
  [auth, role('admin')],
  asyncHandler(async (req, res, next) => {
    const post = await Post.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!post) return next(new ErrorResponse('Post not found', 404));
    res.status(200).json({
      success: true,
      data: post,
    });
  })
);

router.delete(
  '/:id',
  [auth, role('admin')],
  asyncHandler(async (req, res, next) => {
    const post = await Post.findByIdAndDelete(req.params.id);
    if (!post) return next(new ErrorResponse('Post not found', 404));
    res.status(200).json({
      success: true,
      data: {},
    });
  })
);

router.put(
  '/:id/photo',
  [auth, role('admin')],
  asyncHandler(async (req, res, next) => {
    const post = await Post.findById(req.params.id);
    if (!post) return next(new ErrorResponse('The post does not exist', 404));
    // Check if an image exists and delete it
    if (post.image) {
      let photoPath = __dirname;
      photoPath = photoPath.substr(0, photoPath.length - 7);
      fs.unlink(`${photoPath}/public/uploads/${post.image}`, (err) => {
        if (err) return next(new ErrorResponse('Something went wrong', 500));
      });
    }

    if (!req.files) return next(new ErrorResponse('Please add a photo', 400));
    const file = req.files.file;
    // Make sure image is a photo
    if (!file.mimetype.startsWith('image'))
      return next(new ErrorResponse('Please upload an image file', 400));
    if (file.size > process.env.MAX_FILE_UPLOAD)
      return next(new ErrorResponse(`Please upload image less then 1MB`, 400));
    file.name = `photo_${post.storeName}_${Date.now()}${
      path.parse(file.name).ext
      }`;

    file.mv(`${process.env.FILE_UPLOAD_PATH}/${file.name}`, async (err) => {
      if (err) return next(new ErrorResponse('Problem with file upload', 500));
      await Post.findByIdAndUpdate(req.params.id, { image: file.name });
      res.json({ success: true, data: file.name });
    });
  })
);

router.put(
  '/:id/like',
  auth,
  asyncHandler(async (req, res, next) => {
    const post = await Post.findById(req.params.id).populate('usersLiked');
    const like = post.usersLiked.find(
      (userLiked) => userLiked._id.toString() === req.user._id.toString()
    );
    if (like)
      return next(new ErrorResponse('You already liked this post', 400));
    post.usersLiked.push(req.user._id);
    await post.save();
    res.status(200).json({ success: true, data: post });
  })
);

router.put(
  '/:id/unlike',
  auth,
  asyncHandler(async (req, res, next) => {
    const post = await Post.findById(req.params.id).populate('usersLiked');
    const like = post.usersLiked.find(
      (userLiked) => userLiked._id.toString() === req.user._id.toString()
    );
    if (like) {
      const index = post.usersLiked.indexOf(req.user._id);
      post.usersLiked.splice(index, 1);
    } else return next(new ErrorResponse('You already unliked this post', 400));
    await post.save();
    res.status(200).json({ success: true, data: post });
  })
);

module.exports = router;
