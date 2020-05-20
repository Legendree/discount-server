const express = require('express');

const Post = require('../models/Posts');
const Comment = require('../models/Comment');

const ErrorResponse = require('../utils/errorResponse');
const advacedQuery = require('../middleware/advancedQuery');
const asyncHandler = require('express-async-handler');

const auth = require('../middleware/auth');

const router = express.Router({ mergeParams: true });

router.get(
  '/',
  advacedQuery(Post),
  asyncHandler(async (req, res) => {
    if (req.params.postId) {
      const comments = await Comment.find({ post: req.params.postId });
      return res.json({
        success: true,
        count: comments.length,
        data: comments,
      });
    }
    res.json(res.advacedQuery);
  })
);

router.get(
  '/:id',
  asyncHandler(async (req, res, next) => {
    const comment = await Comment.findById(req.params.id).populate({
      path: 'Posts',
      select: 'storeName',
    });
    if (!comment) return next(new ErrorResponse('Comment does not exist', 404));
    res.json({
      success: true,
      data: comment,
    });
  })
);

router.post(
  '/',
  auth,
  asyncHandler(async (req, res, next) => {
    req.body.post = req.params.postId;
    req.body.user = req.user.id;

    const post = Post.findById(req.params.postId);
    if (!post) return next(new ErrorResponse('Post does not exist', 404));

    const comment = await Comment.create(req.body);
    res.json({
      success: true,
      data: comment,
    });
  })
);

router.put(
  '/:id',
  auth,
  asyncHandler(async (req, res, next) => {
    let comment = await Comment.findById(req.params.id);
    if (!comment) next(new ErrorResponse('Comment not found', 404));

    if (req.user.id !== comment.user.toString() && req.user.role !== 'admin') {
      return next(
        new ErrorResponse('User not authorized to update this comment', 401)
      );
    }
    comment = await Comment.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    res.json({
      success: true,
      data: comment,
    });
  })
);

router.delete(
  '/:id',
  auth,
  asyncHandler(async (req, res, next) => {
    let comment = await Comment.findById(req.params.id);
    if (!comment) next(new ErrorResponse('Comment not found', 404));

    if (req.user.id !== comment.user.toString() && req.user.role !== 'admin') {
      return next(
        new ErrorResponse('User not authorized to delete this comment', 401)
      );
    }
    await comment.remove();
    res.json({
      success: true,
      data: {},
    });
  })
);

module.exports = router;
