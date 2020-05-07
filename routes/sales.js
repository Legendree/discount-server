const express = require('express');
const asyncHandler = require('express-async-handler');

const router = express.Router();


router.get('/', asyncHandler(async (req, res, next) => {
    res.status(200).json({ success: true });
}))

module.exports = router;