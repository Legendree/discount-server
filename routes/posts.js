const express = require('express');

const Post = require('../models/Posts');
const User = require('../models/user');

const ErrorResponse = require('../utils/errorResponse');

const asyncHandler = require('express-async-handler');
const advanceQuery = require('../middleware/advancedQuery');

const { uploadPhoto, deletePhoto } = require('../middleware/imageManager');

const auth = require('../middleware/auth');
const role = require('../middleware/role');

const path = require('path');

const router = express.Router();

router.use('/:postId/comments', require('./comments'));

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
    const {
      storeName,
      description,
      category,
      expiresAt,
      storeColor,
      image,
    } = req.body;
    const post = await Post.create({
      storeName,
      description,
      category,
      expiresAt,
      storeColor,
    });
    const ext = path.extname(image);
    if (ext !== '.png' && ext !== '.jpg')
      return next(new ErrorResponse('File format is not supported', 400));
    const upload = await uploadPhoto({
      location: image,
      name: `${Date.now()}_${storeName}_${post._id}${ext}`,
    });
    post.image = upload.Location;
    await post.save();
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
    const post = await Post.findById(req.params.id);
    if (!post) return next(new ErrorResponse('Post not found', 404));
    if (post.image) await deletePhoto(post.image);
    await post.remove();
    res.status(200).json({
      success: true,
      data: {},
    });
  })
);

router.put(
  '/:id/like',
  auth,
  asyncHandler(async (req, res, next) => {
    const user = await User.findById(req.user._id);
    if (!user) return next(new ErrorResponse('You are not logged in', 404));

    const post = await Post.findById(req.params.id).populate('usersLiked');
    if (!post) return next(new ErrorResponse('Post not found', 404));

    const like = post.usersLiked.find(
      (userLiked) => userLiked._id.toString() === req.user._id.toString()
    );
    const favorites = user.favoritePosts.find(
      (favoritePost) => favoritePost.toString() === req.params.id.toString()
    );

    if (like || favorites) {
      // Remove post from favoritesPosts array
      const userIndex = user.favoritePosts.indexOf(req.params.id);
      if (userIndex)
        user.favoritePosts.splice(userIndex, 1);
      // Remove like from usersLiked array
      const postIndex = post.usersLiked.indexOf(req.user._id);
      if (postIndex)
        post.usersLiked.splice(postIndex, 1);
    } else {
      // Like the post
      if (!like)
        post.usersLiked.push(req.user._id);
      // Add to user favorites
      if (!favorites)
        user.favoritePosts.push(req.params.id);
    }
    await post.save();
    await user.save({ validateBeforeSave: false });
    res.status(200).json({ success: true, data: post });
  })
);

// router.put(
//   '/:id/unlike',
//   auth,
//   asyncHandler(async (req, res, next) => {
//     const user = await User.findById(req.user._id);
//     if (!user) return next(new ErrorResponse('You are not logged in', 404));

//     const post = await Post.findById(req.params.id).populate('usersLiked');
//     const like = post.usersLiked.find(
//       (userLiked) => userLiked._id.toString() === req.user._id.toString()
//     );
//     if (like) {
//       // Remove post from favoritesPosts array
//       const userIndex = user.favoritePosts.indexOf(req.user._id);
//       user.favoritePosts.splice(userIndex, 1);
//       // Remove like from usersLiked array
//       const postIndex = post.usersLiked.indexOf(req.params.id);
//       post.usersLiked.splice(postIndex, 1);
//     } else return next(new ErrorResponse('You already unliked this post', 400));
//     await post.save();
//     await user.save({ validateBeforeSave: false });
//     res.status(200).json({ success: true, data: post });
//   })
// );

module.exports = router;
