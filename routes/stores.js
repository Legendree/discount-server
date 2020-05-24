const express = require('express');

const Store = require('../models/Store');

const ErrorResponse = require('../utils/errorResponse');
const advacedQuery = require('../middleware/advancedQuery');
const asyncHandler = require('express-async-handler');

const auth = require('../middleware/auth');

const router = express.Router();

router.get(
  '/',
  advacedQuery(Store),
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
    const store = await Store.findById(req.params.id);
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
