const express = require('express');

const Store = require('../models/Store');
const User = require('../models/User');

const ErrorResponse = require('../utils/errorResponse');
const advancedQuery = require('../middleware/advancedQuery');
const asyncHandler = require('express-async-handler');

const auth = require('../middleware/auth');
const role = require('../middleware/role');

const path = require('path');

const { uploadPhoto } = require('../middleware/imageManager');

const router = express.Router();

router.use('/:storeId/posts', require('./posts'));

router.get(
  '/',
  advancedQuery(Store),
  asyncHandler(async (req, res, next) => {
    res.status(200).json({
      success: true,
      count: res.advancedResult.length,
      data: res.advancedResult,
    });
  })
);

router.get(
  '/:storeName',
  asyncHandler(async (req, res, next) => {
    const storeName = req.params.storeName;
    const store = await Store.findOne({ storeName });
    if (!store) return next(new ErrorResponse('Store not found', 404));
    res.status(200).json({
      success: true,
      data: store,
    });
  })
);

router.post(
  '/',
  [auth, role('admin')],
  asyncHandler(async (req, res, next) => {
    const { storeName, image } = req.body;
    const store = await Store.create({
      storeName,
    });
    const ext = path.extname(image);
    if (ext !== '.png' && ext !== '.jpg')
      return next(new ErrorResponse('File format is not supported', 400));
    const file = {
      location: image,
      name: `${Date.now()}_${storeName}_${store._id}${ext}`,
    };
    await uploadPhoto(file);
    store.image = `http://cloud.discountapp.net/stores/${file.name}`;
    await store.save();
    res.status(200).json({
      success: true,
      data: store,
    });
  })
);

router.put(
  '/:id',
  [auth, role('admin')],
  asyncHandler(async (req, res, next) => {
    const store = await Store.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!store) return next(new ErrorResponse('Store not found', 404));
    res.status(200).json({
      success: true,
      data: store,
    });
  })
);

router.delete(
  '/:id',
  [auth, role('admin')],
  asyncHandler(async (req, res, next) => {
    const store = await Store.findById(req.params.id);
    if (!store) return next(new ErrorResponse('Store not found', 404));
    if (store.image) await deletePhoto(store.image);
    await store.remove();
    res.status(200).json({
      success: true,
      data: {},
    });
  })
);

router.put(
  '/:storeName/subscribe',
  auth,
  asyncHandler(async (req, res, next) => {
    const user = await User.findById(req.user._id);
    if (!user) return next(new ErrorResponse('You are not logged in', 404));

    const storeName = req.params.storeName;
    const store = await Store.findOne({ storeName });

    console.log(store);

    if (!store) return next(new ErrorResponse('No store found', 404));

    const subscribed = user.subscribedStores.find(
      (sub) => sub.toString() === store._id.toString()
    );

    if (subscribed) {
      // Remove store from subscribedStores array
      const userIndex = user.subscribedStores.indexOf(store._id);
      if (userIndex >= 0) user.subscribedStores.splice(userIndex, 1);
    } else {
      // Add to user subscribed stores
      if (!subscribed) user.subscribedStores.push(store._id);
    }
    await user.save({ validateBeforeSave: false });
    res.status(200).json({ success: true, data: user });
  })
);

module.exports = router;
