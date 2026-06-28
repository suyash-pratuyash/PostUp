import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initDb, closeDb, queryOne } from './db/database.js';
import projectRoutes from './routes/projects.js';
import dailyLogRoutes from './routes/dailyLogs.js';
import postRoutes from './routes/posts.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));

// API Routes
app.use('/api/projects', projectRoutes);
app.use('/api/logs', dailyLogRoutes);
app.use('/api/posts', postRoutes);

// Health check
app.get('/api/health', (req, res) => {
  try {
    const projectCount = queryOne('SELECT COUNT(*) as count FROM projects')?.count || 0;
    const logCount = queryOne('SELECT COUNT(*) as count FROM daily_logs')?.count || 0;
    const postCount = queryOne('SELECT COUNT(*) as count FROM generated_posts')?.count || 0;

    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      stats: {
        projects: projectCount,
        daily_logs: logCount,
        generated_posts: postCount
      },
      gemini_configured: !!(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_api_key_here')
    });
  } catch (error) {
    res.status(500).json({ status: 'error', error: error.message });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, error: `Route ${req.method} ${req.path} not found` });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ success: false, error: 'Internal server error' });
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down PostUp server...');
  closeDb();
  process.exit(0);
});

process.on('SIGTERM', () => {
  closeDb();
  process.exit(0);
});

// Initialize database and start server
async function start() {
  try {
    await initDb();

    app.listen(PORT, () => {
      console.log(`
  ╔══════════════════════════════════════════╗
  ║                                          ║
  ║   🚀 PostUp Backend Server Running       ║
  ║                                          ║
  ║   Local:  http://localhost:${PORT}          ║
  ║   API:    http://localhost:${PORT}/api      ║
  ║                                          ║
  ╚══════════════════════════════════════════╝
      `);

      // Check Gemini API key
      if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_api_key_here') {
        console.log('  ⚠️  Gemini API key not configured!');
        console.log('  📋 To get your free API key:');
        console.log('     1. Go to https://aistudio.google.com/');
        console.log('     2. Sign in with Google');
        console.log('     3. Click "Get API Key" → "Create API Key"');
        console.log('     4. Paste it in backend/.env file');
        console.log('');
      } else {
        console.log('  ✅ Gemini API key configured');
        console.log('');
      }
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

start();
