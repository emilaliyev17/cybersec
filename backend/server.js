require('dotenv').config();
const express = require('express');
const cors = require('cors');

// Import routes
const authRoutes = require('./routes/auth');
const modulesRoutes = require('./routes/modules');
const quizRoutes = require('./routes/quiz');
const adminRoutes = require('./routes/admin');
const tracksRoutes = require('./routes/tracks');
const checklistRoutes = require('./routes/checklist');
const checklistsV2Routes = require('./routes/checklistsV2');
const bioRoutes = require('./routes/bio');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware - CORS configuration
const allowedOrigins = [
  'http://localhost:3000',
  'https://security-frontend-893690776887.us-central1.run.app',
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));

// Trust proxy for Cloud Run
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', true);
}
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/modules', modulesRoutes);
app.use('/api/quiz', quizRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/tracks', tracksRoutes);
app.use('/api/checklist', checklistRoutes);
app.use('/api/v2/checklists', checklistsV2Routes);
app.use('/api/bio', bioRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`Security Onboarding API running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});
