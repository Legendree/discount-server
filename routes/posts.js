const express = require('express');

const Post = require('../models/Posts');
const User = require('../models/User');
const Store = require('../models/Store');

const ErrorResponse = require('../utils/errorResponse');

const asyncHandler = require('express-async-handler');
const advanceQuery = require('../middleware/advancedQuery');

const { uploadPhoto, deletePhoto } = require('../middleware/imageManager');

const auth = require('../middleware/auth');
const role = require('../middleware/role');

const sizeOf = require('image-size');

const firebaseAdmin = require('../firebase/admin');

const router = express.Router({ mergeParams: true });

router.use('/:postId/comments', require('./comments'));

// @desc    Get all available posts
// @route   GET /api/v1/posts
// @access  Public
router.get(
  '/',
  advanceQuery(Post, 'storeName'),
  asyncHandler(async (req, res, next) => {
    res.status(200).json({
      success: true,
      count: res.advancedResult.length,
      data: res.advancedResult,
    });
  })
);

// @desc    Get all available posts for logged-in users
// @route   GET /api/v1/posts/logged
// @access  Private
router.get(
  '/logged',
  [auth, advanceQuery(Post, 'storeName')],
  asyncHandler(async (req, res, next) => {
    let result = res.advancedResult;

    result.forEach((post) => {
      post['isPostLiked'] = req.user.favoritePosts.includes(post._id);
    });

    console.log(result);

    res.status(200).json({
      success: true,
      count: result.length,
      data: result,
    });
  })
);

// @desc    Get available post by id
// @route   GET /api/v1/posts/:id
// @access  Public
router.get(
  '/:id',
  asyncHandler(async (req, res, next) => {
    const post = await Post.findById(req.params.id).populate('storeName');
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
    const { storeName, description, category, expiresAt, url } = req.body;

    const store = await Store.findOne({ storeName });
    if (!store)
      return next(
        new ErrorResponse(
          'No such store exist, please create the store and try again',
          404
        )
      );

    const storeId = store._id;

    // Check if user subscribed to store
    const users = await User.find({
      fcmToken: { $exists: true },
      subscribedStores: { $exists: true },
    }); //.select('fcmToken subscribedStores');
    const subscribedUsers = users.filter((user) =>
      user.subscribedStores.includes(storeId)
    );

    //console.log(subscribedUsers[0].fcmToken);

    if (subscribedUsers !== undefined && subscribedUsers.length > 0) {
      var registrationTokens = []; //An array of tokens
      const time = 60 * 60 * 4 * 1000;
      console.log(subscribedUsers);
      subscribedUsers.forEach(async (user) => {
        if (user.lastNotification !== undefined) {
          if (Date.now() - user.lastNotification > time) {
            registrationTokens.push(user.fcmToken);
            user.lastNotification = Date.now();
          }
        } else {
          registrationTokens.push(user.fcmToken);
          user.lastNotification = Date.now();
        }
        await user.save();
      });
      if (registrationTokens !== undefined && registrationTokens.length > 0) {
        console.log(registrationTokens);

        const message = {
          notification: {
            title: 'New discounts',
            body: `${storeName} and more of your favorite stores have new discounts`,
          },
        };
        const options = {
          priority: 'high',
          timeToLive: 60 * 60 * 24,
        };
        const messaging = await firebaseAdmin
          .messaging()
          .sendToDevice(registrationTokens, message, options);

        if (!messaging)
          return next(new ErrorResponse('Messages not sent to the users', 500));
      }
    }

    let file = req.files.file;

    const info = sizeOf(file.data);
    if (file.size > 1024000)
      return next(new ErrorResponse('File size exceed its limit', 400));

    const alias = storeName.toLowerCase().replace(/[!@#$%^&*(). ]/gi, '');

    const post = await Post.create({
      storeName: storeId,
      description,
      category,
      expiresAt,
      alias,
      url,
    });

    file.name = `${post._id}_${Date.now()}.${info.type}`;
    const upload = await uploadPhoto(file);
    if (!upload) return next(new ErrorResponse('Failed uploading a photo'));

    post.image = `http://cloud.discountapp.net/posts/${file.name}`;

    await post.save();

    res.status(200).json({
      success: true,
      data: post,
      notifications: 'Notifications sent to relevant users',
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
  '/cron_deletion',
  [auth, role('admin')],
  asyncHandler(async (req, res, next) => {
    const currentDate = Date.now();
    const posts = await Post.find({ expiresAt: { $lt: currentDate } });
    if (!posts)
      return next(new ErrorResponse('Could not delete the posts', 500));
    posts.forEach(async (post) => await deletePhoto(post.image.substr(0, 29)));
    await Post.deleteMany({ expiresAt: { $lt: currentDate } });

    res.status(200).json({
      success: true,
      data: 'Expired posts are deleted succsefully.',
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

    if (like && favorites) {
      // Remove post from favoritesPosts array
      const userIndex = user.favoritePosts.indexOf(req.params.id);
      if (userIndex >= 0) user.favoritePosts.splice(userIndex, 1);
      // Remove like from usersLiked array
      const postIndex = post.usersLiked.indexOf(req.user._id);
      if (postIndex >= 0) post.usersLiked.splice(postIndex, 1);
    } else {
      // Like the post
      if (!like) post.usersLiked.push(req.user._id);
      // Add to user favorites
      if (!favorites) user.favoritePosts.push(req.params.id);
    }
    await post.save();
    await user.save();
    res.status(200).json({ success: true, data: post });
  })
);

router.post(
  '/firebase/notify',
  [auth, role('admin')],
  asyncHandler(async (req, res, next) => {
    const usersFcm = await User.find({ fcmToken: { $exists: true } }).select(
      'fcmToken'
    );
    var registrationTokens = []; //An array of tokens
    usersFcm.forEach((user) => {
      registrationTokens.push(user.fcmToken);
    });

    console.log(registrationTokens);
    const message = req.body.message;
    const options = {
      priority: 'high',
      timeToLive: 60 * 60 * 24,
    };
    const messaging = await firebaseAdmin
      .messaging()
      .sendToDevice(registrationTokens, message, options);
    if (!messaging)
      return next(new ErrorResponse('Messages not sent to the users', 500));

    res.status(200).json({ success: true, data: 'Messages sent' });
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
