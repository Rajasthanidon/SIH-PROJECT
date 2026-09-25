const express = require('express');
const session = require('express-session');
const cors = require('cors');
const path = require('path');
const env = require('./config/env');
const routes = require('./routes');
const securityHeaders = require('./middleware/securityHeaders');
const fileController = require('./controllers/fileController');
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');

const app = express();
app.disable('x-powered-by');
app.use(securityHeaders);

const allowedOrigins = env.CLIENT_ORIGINS || [env.CLIENT_ORIGIN];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error('Origin not allowed by CORS policy.'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }),
);

app.set('trust proxy', 1);
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
const pgSession = require('connect-pg-simple')(session);
const { getPool } = require('./config/database');

app.use(
  session({
    store: new pgSession({
      pool: getPool(),
      tableName: 'session',
      createTableIfMissing: false
    }),
    secret: env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    proxy: env.NODE_ENV === 'production',
    cookie: {
      httpOnly: true,
      secure: env.NODE_ENV === 'production' ? Boolean(env.SESSION_COOKIE_SECURE) : false,
      sameSite: env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: env.SESSION_MAX_AGE,
    },
  }),
);

// Protected resume downloads and safe static photos
app.get('/uploads/resumes/:filename', fileController.getResumeFile);
app.use('/uploads/photos', express.static(path.join(__dirname, '../uploads/photos')));

app.get('/', (req, res) => {
  res.json({
    name: 'Academia–Industry Collaboration Portal API',
    status: 'ok',
    version: '0.1.0-foundation',
  });
});

app.use('/api', routes);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
