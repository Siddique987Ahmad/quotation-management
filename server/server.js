const dotenv = require('dotenv');

// Load environment variables first
dotenv.config();

const { app, initializeServices } = require('./src/app');

// Server startup
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Initialize all services
    const servicesInitialized = await initializeServices();
    
    if (!servicesInitialized) {
      console.error('Failed to initialize services');
      process.exit(1);
    }
    
    // Start HTTP server - bind to all interfaces (0.0.0.0) for VPS deployment
    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log('🚀 ================================');
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`🚀 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🚀 Binding to: 0.0.0.0:${PORT} (all interfaces)`);
      console.log('🚀 ================================');
      console.log(`📖 API Documentation: http://localhost:${PORT}/api`);
      console.log(`💊 Health check: http://localhost:${PORT}/health`);
      console.log('🚀 ================================');
    });

    // Handle server errors
    server.on('error', (error) => {
      if (error.syscall !== 'listen') {
        throw error;
      }

      switch (error.code) {
        case 'EACCES':
          console.error(`Port ${PORT} requires elevated privileges`);
          process.exit(1);
          break;
        case 'EADDRINUSE':
          console.error(`Port ${PORT} is already in use`);
          process.exit(1);
          break;
        default:
          throw error;
      }
    });

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
startServer();