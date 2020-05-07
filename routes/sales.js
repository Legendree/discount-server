const express = require('express');

const Sale = require('../models/Sale');

const ErrorResponse = require('../utils/errorResponse');

const asyncHandler = require('express-async-handler');
const advanceQuery = require('../middleware/advancedQuery')


const router = express.Router();

router.get(
  '/',
  advanceQuery(Sale),
  asyncHandler(async (req, res, next) => {
    res.status(200).json({ success: true, count: res.advancedResult.length, data: res.advancedResult });
  })
);

router.get(
  '/:id',
  asyncHandler(async (req, res, next) => {
    const sale = await Sale.findById(req.params.id);
    if (!sale) return next(new ErrorResponse('Sale not found', 404));
    res.status(200).json({
      success: true,
      data: sale,
    });
  })
);

router.post(
  '/',
  asyncHandler(async (req, res, next) => {
    const sale = await Sale.create(req.body);
    res.status(200).json({
      success: true,
      data: sale,
    });
  })
);

router.put('/:id', async (req, res, next) => {
  const sale = await Sale.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!sale) return next(new ErrorResponse('Sale not found', 404));
  res.status(200).json({
    success: true,
    data: sale,
  });
});

router.delete('/:id', async (req, res, next) => {
  const sale = await Sale.findByIdAndDelete(req.params.id);
  if (!sale) return next(new ErrorResponse('Sale not found', 404));
  res.status(200).json({
    success: true,
    data: {},
  });
});

module.exports = router;
