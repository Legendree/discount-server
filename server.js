const express = require('express');
const app = express();

const dotenv = require('dotenv');
const morgan = require('morgan');

//get error handler
const errorHandler = require('./middleware/errorHandler');

// Routes require
const posts = require('./routes/posts');

// Database connection require
const connectDb = require('./config/db');

require('colors');

dotenv.config({ path: './config/config.env' });

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

connectDb();

app.use(express.json());

app.use('/v1/api/posts', posts);

app.use(errorHandler);

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () =>
  console.log(`Server running on port ${PORT}`.green.bold)
);

process.on('unhandledRejection', (err, promise) => {
  console.log(`Unhandled rejection: ${err.message}`);
  server.close(() => process.exit(1));
});
