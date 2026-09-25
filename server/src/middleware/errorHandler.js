const AppError = require('../utils/AppError');

function notFoundHandler(req, res, next) {
  next(new AppError(`Route not found: ${req.originalUrl}`, 404));
}

function errorHandler(err, req, res, next) {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal server error';
  let errorCode = err.name || 'INTERNAL_SERVER_ERROR';

  if (err.name === 'MulterError') {
    statusCode = 400;
    errorCode = 'FILE_UPLOAD_ERROR';
    if (err.code === 'LIMIT_FILE_SIZE') {
      statusCode = 413;
      message = 'File is too large. Maximum allowed size is 5 MB.';
      errorCode = 'FILE_TOO_LARGE';
    }
  }

  const payload = {
    error: {
      code: errorCode,
      message,
      details: err.details || [],
    },
  };

  if (statusCode >= 500) {
    console.error('[SERVER_ERROR]', {
      url: req.originalUrl,
      method: req.method,
      stack: err.stack,
    });
  }

  res.status(statusCode).json(payload);
}

module.exports = {
  notFoundHandler,
  errorHandler,
};
