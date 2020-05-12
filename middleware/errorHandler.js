const ErrorResponse = require('../utils/errorResponse');

module.exports = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Mongoose duplicate key
  if (err.code === 11000) {
    const message = `This name is already used, please use other name`;
    error = new ErrorResponse(message, 400);
  }

  if (err.name === 'CastError') {
    const message = `Id formatted poorly, please format correct your id`;
    error = new ErrorResponse(message, 400);
  }

  res
    .status(error.statusCode || 500)
    .json({ success: false, errorMsg: error.message || 'Server error' });
};
