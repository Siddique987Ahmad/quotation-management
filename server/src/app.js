const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');

// Import middleware
const { globalErrorHandler, notFoundHandler } = require('./middleware/errorHandler');
const { validateEnvironmentConfig } = require('./utils/validators');

// Import services
const { connectDatabase } = require('./config/database');
const { initializeTransporter } = require('./services/emailService');
const { initializePDFService } = require('./services/pdfService');
const { startBackgroundTasks } = require('./services/notificationService');

// Initialize Express app
const app = express();

// app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// app.use('/uploads', (req, res, next) => {
//   res.header('Access-Control-Allow-Origin', 'http://localhost:3000');
//   res.header('Access-Control-Allow-Methods', 'GET');
//   res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
//   next();
// }, express.static(path.join(__dirname, 'public/uploads')));
app.use('/uploads', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'http://localhost:3000');
  res.header('Access-Control-Allow-Methods', 'GET');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
}, express.static(path.join(__dirname, '../public/uploads')));
// app.use('/api/uploads', express.static(path.join(__dirname, 'public/uploads')));

// Validate environment configuration
try {
  validateEnvironmentConfig();
  console.log('Environment configuration validated');
} catch (error) {
  console.error('Environment validation failed:', error.message);
  process.exit(1);
}

// Trust proxy (for deployment behind reverse proxy)
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      fontSrc: ["'self'"],
      connectSrc: ["'self'"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
  crossOriginEmbedderPolicy: false
}));

// CORS configuration
// const corsOptions = {
//   origin: function (origin, callback) {
//     // Allow requests with no origin (like mobile apps or curl requests)
//     if (!origin) return callback(null, true);
    
//     const allowedOrigins = [
//       'http://localhost:3000',
//       'http://localhost:3001', 
//       'http://127.0.0.1:3000',
//       process.env.FRONTEND_URL,
//       process.env.CLIENT_URL
//     ].filter(Boolean);
    
//     if (allowedOrigins.indexOf(origin) !== -1) {
//       callback(null, true);
//     } else {
//       console.warn(`CORS blocked origin: ${origin}`);
//       callback(new Error('Not allowed by CORS'));
//     }
//   },
//   credentials: true,
//   methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
//   allowedHeaders: [
//     'Origin', 
//     'X-Requested-With', 
//     'Content-Type', 
//     'Accept', 
//     'Authorization',
//     'Cache-Control',
//     'Pragma'
//   ],
//   exposedHeaders: ['X-Total-Count', 'X-Page-Count'],
//   maxAge: 86400 // 24 hours
// };

// Configure CORS. In development we allow the requesting origin so the
// browser receives Access-Control-Allow-Origin and related headers. In
// production we use a stricter allow-list.
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://127.0.0.1:3000',
  process.env.FRONTEND_URL,
  process.env.CLIENT_URL
].filter(Boolean);

const corsOptions = {
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'Cache-Control',
    'Pragma'
  ],
  exposedHeaders: ['X-Total-Count', 'X-Page-Count'],
  maxAge: 86400
};

// Development: allow any origin (but echo it back) so credentials and headers work
if (process.env.NODE_ENV === 'development') {
  app.use(cors({
    origin: true,
    credentials: true,
    methods: corsOptions.methods,
    allowedHeaders: corsOptions.allowedHeaders,
    exposedHeaders: corsOptions.exposedHeaders,
    maxAge: corsOptions.maxAge
  }));
  // Ensure preflight (OPTIONS) requests always get a CORS response
  app.options('*', cors({ origin: true, credentials: true }));
} else {
  // Production: only allow whitelisted origins. Do NOT throw an exception from
  // the origin callback because that bubbles up as a 500 and prevents CORS headers
  // being sent. Instead, return false so the response will not include CORS headers.
  corsOptions.origin = function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) return callback(null, true);
    // Debug log for rejected origins - include environment and timestamp to aid troubleshooting
    const timestamp = new Date().toISOString();
    console.warn(`[CORS] Rejected origin: ${origin} | env: ${process.env.NODE_ENV || 'unknown'} | time: ${timestamp}`);
    // Optionally include client info when available
    try {
      const reqInfo = (this && this.headers && this.headers['user-agent']) ? ` ua=${this.headers['user-agent']}` : '';
      if (reqInfo) console.debug(`[CORS] Request info:${reqInfo}`);
    } catch (e) {
      // ignore
    }
    return callback(null, false);
  };

  app.use(cors(corsOptions));
  app.options('*', cors(corsOptions));
}

// In production behind a CDN or reverse proxy, responses that include
// CORS headers should also include `Vary: Origin` so caches don't serve
// a response for one origin to a different origin. Add middleware to set
// the Vary header for production environments.
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    try {
      // Append Vary: Origin without overwriting existing Vary header
      const existing = res.getHeader('Vary');
      if (!existing) {
        res.setHeader('Vary', 'Origin');
      } else if (!String(existing).includes('Origin')) {
        res.setHeader('Vary', String(existing) + ', Origin');
      }
    } catch (e) {
      // ignore header errors
    }
    next();
  });
}

// Rate limiting
const createRateLimit = (windowMs, max, message, skip = []) => {
  return rateLimit({
    windowMs,
    max,
    message: {
      success: false,
      message,
      retryAfter: Math.ceil(windowMs / 1000)
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
      return skip.some(path => req.path.startsWith(path));
    }
  });
};

// Different rate limits for different endpoints
// const generalLimiter = createRateLimit(
//   15 * 60 * 1000, // 15 minutes
//   100, // max requests per windowMs
//   'Too many requests, please try again later'
// );

// const authLimiter = createRateLimit(
//   15 * 60 * 1000, // 15 minutes
//   5, // max login attempts per windowMs
//   'Too many authentication attempts, please try again later'
// );

// // const apiLimiter = createRateLimit(
// //   15 * 60 * 1000, // 15 minutes
// //   1000, // max API requests per windowMs
// //   'API rate limit exceeded'
// // );

// const apiLimiter = createRateLimit(
//   15 * 60 * 1000, // 15 minutes
//   process.env.NODE_ENV === 'development' ? 10000 : 1000, // Much higher for dev
//   'API rate limit exceeded'
// );

// // Apply rate limiting
// app.use('/api/auth/login', authLimiter);
// app.use('/api/auth/register', authLimiter);
// app.use('/api/auth/forgot-password', authLimiter);
// app.use('/api/', apiLimiter);
// app.use(generalLimiter);

// Different rate limits for different endpoints
const generalLimiter = createRateLimit(
  15 * 60 * 1000, // 15 minutes
  process.env.NODE_ENV === 'development' ? 10000 : 100, // Higher in dev
  'Too many requests, please try again later'
);

const authLimiter = createRateLimit(
  15 * 60 * 1000, // 15 minutes
  process.env.NODE_ENV === 'development' ? 50 : 5, // More lenient in dev
  'Too many authentication attempts, please try again later'
);

const apiLimiter = createRateLimit(
  15 * 60 * 1000, // 15 minutes
  process.env.NODE_ENV === 'development' ? 10000 : 1000,
  'API rate limit exceeded'
);

// Apply rate limiting
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/auth/forgot-password', authLimiter);
app.use('/api/', apiLimiter);

// Apply general limiter ONLY to non-API routes
if (process.env.NODE_ENV !== 'development') {
  app.use((req, res, next) => {
    if (!req.path.startsWith('/api/')) {
      return generalLimiter(req, res, next);
    }
    next();
  });
}

// Body parsing middleware
app.use(express.json({ 
  limit: '10mb',
  verify: (req, res, buf) => {
    // Store raw body for webhook verification if needed
    req.rawBody = buf;
  }
}));

app.use(express.urlencoded({ 
  extended: true, 
  limit: '10mb' 
}));

// Static files
// app.use('/uploads', express.static(path.join(__dirname, '../uploads'), {
//   maxAge: '1d',
//   etag: true,
//   lastModified: true
// }));

// app.use('/public', express.static(path.join(__dirname, '../public'), {
//   maxAge: '7d',
//   etag: true,
//   lastModified: true
// }));

// Request logging middleware (development)
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    const method = req.method;
    const url = req.originalUrl;
    const userAgent = req.get('User-Agent') || 'Unknown';
    const ip = req.ip || req.connection.remoteAddress;
    
    console.log(`[${timestamp}] ${method} ${url} - ${ip} - ${userAgent}`);
    next();
  });
}

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    const { checkDatabaseHealth } = require('./config/database');
    const dbHealth = await checkDatabaseHealth();
    
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: process.env.APP_VERSION || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      uptime: process.uptime(),
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB',
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + ' MB'
      },
      database: dbHealth
    };
    
    // If database is unhealthy, return 503
    if (dbHealth.status !== 'healthy') {
      return res.status(503).json({
        ...health,
        status: 'unhealthy'
      });
    }
    
    res.json(health);
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// API documentation endpoint
app.get('/api', (req, res) => {
  res.json({
    name: 'Quotation Management System API',
    version: process.env.APP_VERSION || '1.0.0',
    description: 'RESTful API for managing quotations, invoices, clients, and users',
    documentation: process.env.API_DOCS_URL || 'https://api-docs.example.com',
    endpoints: {
      authentication: '/api/auth',
      users: '/api/users',
      clients: '/api/clients',
      quotations: '/api/quotations',
      invoices: '/api/invoices',
      notifications: '/api/notifications'
    },
    support: {
      email: process.env.SUPPORT_EMAIL || 'support@example.com',
      documentation: process.env.DOCS_URL || 'https://docs.example.com'
    }
  });
});

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/clients', require('./routes/clients'));
app.use('/api/quotations', require('./routes/quotations'));
app.use('/api/invoices', require('./routes/invoices'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/settings', require('./routes/settings'));

// Webhook endpoints (for future integrations)
app.use('/webhooks', (req, res, next) => {
  // Add webhook-specific middleware here
  next();
});

// Development routes
if (process.env.NODE_ENV === 'development') {
  // Test email endpoint
  app.get('/dev/test-email', async (req, res) => {
    try {
      const { testEmailConnection, sendTestEmail } = require('./services/emailService');
      
      const connectionTest = await testEmailConnection();
      if (!connectionTest.success) {
        return res.status(500).json({
          success: false,
          message: 'Email connection failed',
          error: connectionTest.message
        });
      }

      const result = await sendTestEmail(req.query.email || 'test@example.com');
      res.json({
        success: true,
        message: 'Test email sent successfully',
        data: result
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to send test email',
        error: error.message
      });
    }
  });

  // Test PDF endpoint
  app.get('/dev/test-pdf', async (req, res) => {
    try {
      const { testPDFGeneration, downloadPDFResponse } = require('./services/pdfService');
      const result = await testPDFGeneration();
      downloadPDFResponse(res, result.pdf, result.filename);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to generate test PDF',
        error: error.message
      });
    }
  });

  // Database stats endpoint
  app.get('/dev/db-stats', async (req, res) => {
    try {
      const { getDatabaseStats } = require('./config/database');
      const stats = await getDatabaseStats();
      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });
}

// 404 handler - must be before error handler
app.use(notFoundHandler);

// Global error handler - must be last
app.use(globalErrorHandler);

// Initialize services
const initializeServices = async () => {
  try {
    console.log('Initializing services...');
    
    // Initialize database
    const dbConnected = await connectDatabase();
    if (!dbConnected) {
      throw new Error('Failed to connect to database');
    }
    
    // Initialize email service
    try {
      initializeTransporter();
      console.log('Email service initialized');
    } catch (error) {
      console.warn('Email service initialization failed:', error.message);
    }
    
    // Initialize PDF service
    try {
      await initializePDFService();
      console.log('PDF service initialized');
    } catch (error) {
      console.warn('PDF service initialization failed:', error.message);
    }
    
    // Start background tasks
    try {
      startBackgroundTasks();
      console.log('Background tasks started');
    } catch (error) {
      console.warn('Background tasks initialization failed:', error.message);
    }
    
    console.log('All services initialized successfully');
    return true;
  } catch (error) {
    console.error('Service initialization failed:', error.message);
    return false;
  }
};

// Graceful shutdown
const gracefulShutdown = async (signal) => {
  console.log(`Received ${signal}. Starting graceful shutdown...`);
  
  try {
    // Close database connections
    const { prisma } = require('./config/database');
    await prisma.$disconnect();
    console.log('Database connections closed');
    
    // Cleanup PDF service
    const { cleanup } = require('./services/pdfService');
    await cleanup();
    console.log('PDF service cleaned up');
    
    console.log('Graceful shutdown completed');
    process.exit(0);
  } catch (error) {
    console.error('Error during shutdown:', error);
    process.exit(1);
  }
};

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  gracefulShutdown('UNHANDLED_REJECTION');
});

module.exports = { app, initializeServices };