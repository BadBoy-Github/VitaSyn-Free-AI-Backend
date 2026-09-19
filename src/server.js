import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import hairRoutes from './routes/hairRoutes.js';
import eyeRoutes from './routes/eyeRoutes.js';
import historyRoutes from './routes/historyRoutes.js';
import authRoutes from './routes/authRoutes.js';

const app = express();
const PORT = process.env.PORT || 5000;

// CORS setup
const corsOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim())
  : ['http://localhost:5173', 'http://127.0.0.1:5173'];

app.use(
  cors({
    origin: (origin, callback) => {
      // allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      if (corsOrigins.includes('*') || corsOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(null, true); // Permissive for local preview and testing
    },
    credentials: true,
  })
);

// Body parsers with generous limits for image upload
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Root route
app.get('/', (req, res) => {
  res.json({
    name: 'VitaSyn Free AI API',
    company: 'VitaSyn Pvt Ltd',
    version: '1.0.0',
    status: 'online',
    endpoints: ['/api/health', '/api/auth', '/api/hair', '/api/eye', '/api/history'],
    website: 'https://vitasyn.in',
  });
});

// Health and Diagnostics API
app.get('/api/health', (req, res) => {
  const mongoStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected/in-memory-fallback';
  res.json({
    status: 'online',
    appName: 'VitaSyn Free AI API',
    company: 'VitaSyn Pvt Ltd',
    website: 'https://vitasyn.in',
    database: mongoStatus,
    hfReady: Boolean(process.env.HF_API_KEY),
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/hair', hairRoutes);
app.use('/api/eye', eyeRoutes);
app.use('/api/history', historyRoutes);
app.use('/api/auth', authRoutes);

// Fallback error handler
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({
    success: false,
    message: err.message || 'Internal server error',
  });
});

// MongoDB Connection Handling
const mongoUri = process.env.MONGODB_URI;
if (mongoUri && mongoUri.trim() !== '') {
  console.log('Connecting to MongoDB...');
  mongoose
    .connect(mongoUri)
    .then(() => {
      console.log('Connected to MongoDB successfully.');
    })
    .catch((err) => {
      console.warn('MongoDB connection error. Falling back to internal memory cache:', err.message);
    });
} else {
  console.log('No MONGODB_URI provided in .env - Running with high-speed in-memory store.');
}

// Error and Process Handlers
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Start server if run directly
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`VitaSyn Free AI Backend running on http://localhost:${PORT}`);
  });
}

export default app;
