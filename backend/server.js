require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

// ============================================================
// MIDDLEWARE GLOBAL
// ============================================================

// Di production, ganti dengan URL domain Next.js Anda
const allowedOrigins = [
  'http://localhost:3000', // Untuk lokal testing
  'http://localhost:5173', // Vite dev server default
  'http://localhost:5174', // Vite dev server fallback
  'https://unpam-space.vercel.app' // URL frontend setelah deploy
];

app.use(cors({
  origin: function (origin, callback) {
    // Izinkan request tanpa origin (seperti mobile apps atau curl)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'Akses CORS diblokir oleh kebijakan keamanan backend.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true
}));

// Parse JSON body
app.use(express.json());

// Parse URL-encoded body (untuk form biasa)
app.use(express.urlencoded({ extended: true }));

// ============================================================
// ROUTES
// ============================================================

// Middleware Keamanan Berlapis untuk Rute API
app.use('/api', (req, res, next) => {
  // --- Lapisan 1: UX Filter (Blokir Navigasi Langsung dari Browser) ---
  const acceptHeader = req.headers.accept || '';
  const secFetchDest = req.headers['sec-fetch-dest'];
  
  if (req.method === 'GET' && (acceptHeader.includes('text/html') || secFetchDest === 'document')) {
    return res.status(403).json({
      success: false,
      message: 'Akses langsung ke API tidak diizinkan. Silakan akses melalui aplikasi utama.'
    });
  }

  // --- Lapisan 2: Hard Security (Validasi API Key) ---
  const apiKey = req.headers['x-api-key'];
  const validApiKey = process.env.KODE_RAHASIA_BACKEND;

  // Jika API Key tidak disertakan atau salah
  if (!apiKey || apiKey !== validApiKey) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized: Akses ditolak. API Key tidak valid atau tidak disertakan.'
    });
  }

  next();
});

const eventRoutes = require('./routes/event');
const forumRoutes = require('./routes/forum');
const kosRoutes = require('./routes/kos');
const marketplaceRoutes = require('./routes/marketplace');
const authRoutes = require('./routes/auth');
const boostRoutes = require('./routes/boost');
const subscriptionRoutes = require('./routes/subscription');
const userRoutes = require('./routes/user');
const temuanRoutes = require('./routes/temuan');

app.use('/api/event', eventRoutes);
app.use('/api/forum', forumRoutes);
app.use('/api/kos', kosRoutes);
app.use('/api/marketplace', marketplaceRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/boost', boostRoutes);
app.use('/api/subscription', subscriptionRoutes);
app.use('/api/user', userRoutes);
app.use('/api/temuan', temuanRoutes);

// ============================================================
// HEALTH CHECK
// ============================================================
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'UNPAM Space API is running.',
    data: { timestamp: new Date().toISOString() },
  });
});

// ============================================================
// 404 HANDLER
// ============================================================
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} tidak ditemukan.`,
    data: null,
  });
});

// ============================================================
// GLOBAL ERROR HANDLER
// ============================================================
app.use((err, req, res, _next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    message: 'Terjadi kesalahan internal pada server.',
    data: null,
  });
});

// ============================================================
// START SERVER
// ============================================================
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`🚀 UNPAM Space API running on http://localhost:${PORT}`);
  });
}
module.exports = app;