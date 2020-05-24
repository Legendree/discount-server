// Express require
const express = require('express');
const app = express();
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const fileupload = require('express-fileupload');

const mongoSenitize = require('express-mongo-sanitize');

// App security require
const helmet = require('helmet');
const xss = require('xss-clean');
const hpp = require('hpp');

const dotenv = require('dotenv');
const morgan = require('morgan');

// Error handler require
const errorHandler = require('./middleware/errorHandler');

// Routes require
const posts = require('./routes/posts');
const auth = require('./routes/auth');
const user = require('./routes/users');
const comments = require('./routes/comments');
const stores = require('./routes/stores');

// Database connection require
const connectDb = require('./config/db');

// Coloring for the console output
require('colors');

// Config setup
dotenv.config({ path: './config/config.env' });
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

/// Middleware
// Rate limiting for the api call
// app.set('trust proxy', 1); // Should be enabled when behind a reverse proxy (Heroku, Bluemix, AWS ELB, Nginx, etc)

const apiLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 250,
});

app.use(apiLimiter);
// Set security headers
app.use(helmet());
// Prevent possible XSS attacks
app.use(xss());
// Prevent HTTP polution
app.use(hpp());
// Senitize mongo injections
app.use(mongoSenitize());
// Express essentials
app.use(express.json());
// Cookie parser
app.use(cookieParser());
// File upload
app.use(fileupload());

// Connecting to db after security is established above
connectDb();

// Routes
app.use('/v1/api/posts', posts);
app.use('/v1/api/auth', auth);
app.use('/v1/api/users', user);
app.use('/v1/api/comments', comments);
app.use('/v1/api/stores', stores);

// Error handling
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () =>
  console.log(`Server running on port ${PORT}`.green.bold)
);

process.on('unhandledRejection', (err, promise) => {
  console.log(`Unhandled rejection: ${err.message}`);
  server.close(() => process.exit(1));
});
