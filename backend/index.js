const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const app = express();

/* ---------------- SECURITY ---------------- */
app.use(helmet());
app.use(express.json());

/* ---------------- TRUST PROXY (IMPORTANT FOR RAILWAY) ---------------- */
app.set('trust proxy', 1);

/* ---------------- CORS CONFIG ---------------- */
const allowedOrigins = [
  process.env.Client_url,
  'http://localhost:3000',
  'http://localhost:4173',
  'http://localhost:5173'
];

app.use(cors({
  origin: function (origin, callback) {
    // allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    // TEMP SAFE MODE (prevents Railway CORS crashes)
    return callback(null, true);
  },
  credentials: true,
}));

/* ---------------- ROUTES ---------------- */
app.use('/api/auth', require('./routes/auth'));
app.use('/api/projects', require('./routes/projects'));
app.use('/api/tasks', require('./routes/tasks'));
app.use('/api/users', require('./routes/users'));

/* ---------------- ROOT ROUTE ---------------- */
app.get('/', (req, res) => {
  res.json({ message: 'TaskFlow API running ✅' });
});

/* ---------------- TOKEN BLACKLIST (if used) ---------------- */
const tokenBlacklist = new Set();
app.locals.tokenBlacklist = tokenBlacklist;

/* ---------------- ENV CHECK ---------------- */
if (!process.env.MONGO_URI) {
  console.error("❌ MONGO_URI is missing in environment variables");
  process.exit(1);
}

/* ---------------- DATABASE CONNECTION ---------------- */
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => {
    console.error('❌ MongoDB error:', err.message);
  });

/* ---------------- GLOBAL ERROR HANDLER ---------------- */
app.use((err, req, res, next) => {
  console.error('[Error]', err.message);

  const status = err.status || 500;
  const message = status < 500
    ? err.message
    : 'Internal Server Error';

  res.status(status).json({ message });
});

/* ---------------- START SERVER ---------------- */
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});