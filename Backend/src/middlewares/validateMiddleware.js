const ApiError = require('../utils/apiError');
const { isValidObjectId } = require('../utils/validators');

/**
 * Higher-order middleware to run a validator function on req.body
 * @param {Function} validatorFn - Function accepting (req.body, isUpdate) and returning string[] errors
 * @param {boolean} isUpdate - Flag passed to validator
 */
const validateBody = (validatorFn, isUpdate = false) => {
  return (req, res, next) => {
    const errors = validatorFn(req.body, isUpdate);
    if (errors && errors.length > 0) {
      return next(new ApiError(400, errors[0], errors));
    }
    next();
  };
};

/**
 * Middleware to validate that req.params.id is a valid MongoDB ObjectId
 */
const validateTaskIdParam = (req, res, next) => {
  const { id } = req.params;
  if (!isValidObjectId(id)) {
    return next(new ApiError(400, `Invalid task ID format: "${id}". Must be a 24-character hexadecimal string.`));
  }
  next();
};

module.exports = {
  validateBody,
  validateTaskIdParam
};
