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
// PERMISSIVE static file serving - allows all origins
app.use('/uploads', (req, res, next) => {
  // Set CORS headers for static files - ALLOW ALL ORIGINS
  const origin = req.headers.origin;
  
  // Always allow the requesting origin or use wildcard
  res.header('Access-Control-Allow-Origin', origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Max-Age', '86400');
  
  console.log(`[CORS] Static file request from origin: ${origin || 'no-origin'}`);
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
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

// Enhanced CORS configuration for VPS deployment
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://127.0.0.1:3000',
  'http://localhost:5000',
  'http://127.0.0.1:5000',
  process.env.FRONTEND_URL,
  process.env.CLIENT_URL,
  process.env.REACT_APP_API_URL?.replace('/api', ''),
  // Add common VPS domains
  process.env.DOMAIN_NAME,
  `https://${process.env.DOMAIN_NAME}`,
  `http://${process.env.DOMAIN_NAME}`,
  // Add IP addresses for VPS
  process.env.VPS_IP,
  `http://${process.env.VPS_IP}`,
  `https://${process.env.VPS_IP}`,
  `http://${process.env.VPS_IP}:3000`,
  `http://${process.env.VPS_IP}:5000`
].filter(Boolean);

// Enhanced CORS options
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
    'Pragma',
    'X-API-Key',
    'X-Request-ID'
  ],
  exposedHeaders: ['X-Total-Count', 'X-Page-Count', 'X-Request-ID'],
  maxAge: 86400,
  optionsSuccessStatus: 200 // Some legacy browsers choke on 204
};

// PERMISSIVE CORS CONFIGURATION - ALLOWS ALL ORIGINS
// ⚠️ WARNING: This is less secure but resolves CORS issues immediately
// TODO: Restrict origins in production for better security

console.log('🔓 Using PERMISSIVE CORS configuration - allowing all origins');

// Universal CORS configuration that allows all origins
app.use(cors({
  origin: function (origin, callback) {
    // Allow ALL origins - this resolves CORS issues immediately
    console.log(`[CORS] Allowing origin: ${origin || 'no-origin'}`);
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'Cache-Control',
    'Pragma',
    'X-API-Key',
    'X-Request-ID'
  ],
  exposedHeaders: ['X-Total-Count', 'X-Page-Count', 'X-Request-ID'],
  maxAge: 86400,
  optionsSuccessStatus: 200
}));

// Ensure ALL OPTIONS requests get CORS response
app.options(/.*/, cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'Cache-Control',
    'Pragma',
    'X-API-Key',
    'X-Request-ID'
  ]
}));

// FALLBACK CORS middleware - ensures CORS headers are ALWAYS present
app.use((req, res, next) => {
  const origin = req.headers.origin;
  
  // Always set CORS headers regardless of origin
  res.header('Access-Control-Allow-Origin', origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control, Pragma, X-API-Key, X-Request-ID');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Max-Age', '86400');
  
  console.log(`[CORS FALLBACK] Request from origin: ${origin || 'no-origin'} to ${req.path}`);
  
  // Handle preflight requests immediately
  if (req.method === 'OPTIONS') {
    console.log(`[CORS FALLBACK] Handling OPTIONS request for ${req.path}`);
    return res.status(200).end();
  }
  
  next();
});

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
// app.use('/uploads', expresasdss.static(path.join(__dirname, '../uploads'), {
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

// CORS test endpoint
app.get('/cors-test', (req, res) => {
  const origin = req.headers.origin;
  res.json({
    success: true,
    message: 'CORS test successful',
    origin: origin || 'no-origin',
    timestamp: new Date().toISOString(),
    corsHeaders: {
      'Access-Control-Allow-Origin': res.get('Access-Control-Allow-Origin'),
      'Access-Control-Allow-Methods': res.get('Access-Control-Allow-Methods'),
      'Access-Control-Allow-Headers': res.get('Access-Control-Allow-Headers')
    }
  });
});

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