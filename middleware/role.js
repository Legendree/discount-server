const asyncHandler = require('./asyncHandler');
const ErrorResponse = require('../utils/errorResponse');

module.exports = (role) => asyncHandler((req, res, next) => {
    if (role.includes(req.user.role)) next();
    else return next(new ErrorResponse(`You are not a authorized ${req.user.role}`, 401));
});