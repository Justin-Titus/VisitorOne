const ApiError = require('../utils/ApiError');

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      next(new ApiError(403, `User role '${req.user?.role}' is not authorized to access this route`));
    } else {
      next();
    }
  };
};

module.exports = authorize;
