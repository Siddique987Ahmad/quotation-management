// const { PrismaClient } = require('@prisma/client');

// // Create Prisma client instance
// const prisma = new PrismaClient({
//   log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
//   errorFormat: 'pretty',
// });

// // Database connection helper
// const connectDatabase = async () => {
//   try {
//     await prisma.$connect();
//     console.log('✅ Database connected successfully');
//     return true;
//   } catch (error) {
//     console.error('❌ Database connection failed:', error);
//     return false;
//   }
// };

// // Database disconnect helper
// const disconnectDatabase = async () => {
//   try {
//     await prisma.$disconnect();
//     console.log('🔄 Database disconnected');
//   } catch (error) {
//     console.error('❌ Error disconnecting database:', error);
//   }
// };

// // Database health check
// const checkDatabaseHealth = async () => {
//   try {
//     await prisma.$queryRaw`SELECT 1`;
//     return { status: 'healthy', timestamp: new Date().toISOString() };
//   } catch (error) {
//     return { 
//       status: 'unhealthy', 
//       error: error.message,
//       timestamp: new Date().toISOString()
//     };
//   }
// };

// // Transaction helper
// const executeTransaction = async (operations) => {
//   try {
//     const result = await prisma.$transaction(operations);
//     return { success: true, data: result };
//   } catch (error) {
//     console.error('Transaction failed:', error);
//     return { success: false, error: error.message };
//   }
// };

// // Database statistics
// const getDatabaseStats = async () => {
//   try {
//     const [userCount, clientCount, quotationCount, invoiceCount] = await Promise.all([
//       prisma.user.count(),
//       prisma.client.count(), 
//       prisma.quotation.count(),
//       prisma.invoice.count()
//     ]);

//     return {
//       users: userCount,
//       clients: clientCount,
//       quotations: quotationCount,
//       invoices: invoiceCount,
//       timestamp: new Date().toISOString()
//     };
//   } catch (error) {
//     console.error('Error getting database stats:', error);
//     return null;
//   }
// };

// // Graceful shutdown handler
// const gracefulShutdown = async () => {
//   console.log('🔄 Starting graceful database shutdown...');
//   await disconnectDatabase();
//   process.exit(0);
// };

// // Handle shutdown signals
// process.on('SIGINT', gracefulShutdown);
// process.on('SIGTERM', gracefulShutdown);

// module.exports = {
//   prisma,
//   connectDatabase,
//   disconnectDatabase,
//   checkDatabaseHealth,
//   executeTransaction,
//   getDatabaseStats
// };


const { PrismaClient } = require('@prisma/client');

// =============================================================================
// SINGLETON PATTERN - Prevents multiple instances
// =============================================================================

const globalForPrisma = global;

// Create or reuse existing Prisma instance
const prisma = globalForPrisma.prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development' 
    ? ['query', 'info', 'warn', 'error'] 
    : ['error'],
  errorFormat: 'pretty',
  // Optional: Add connection pool configuration
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

// In development, save to global to prevent multiple instances during hot reload
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// =============================================================================
// DATABASE HELPERS
// =============================================================================

// Database connection helper
const connectDatabase = async () => {
  try {
    // Note: Prisma connects automatically on first query
    // This is mainly for testing the connection
    await prisma.$connect();
    console.log('✅ Database connected successfully');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
};

// Database disconnect helper
const disconnectDatabase = async () => {
  try {
    await prisma.$disconnect();
    console.log('🔄 Database disconnected');
  } catch (error) {
    console.error('❌ Error disconnecting database:', error);
  }
};

// Database health check
const checkDatabaseHealth = async () => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { status: 'healthy', timestamp: new Date().toISOString() };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
};

// Transaction helper
const executeTransaction = async (operations) => {
  try {
    const result = await prisma.$transaction(operations);
    return { success: true, data: result };
  } catch (error) {
    console.error('Transaction failed:', error);
    return { success: false, error: error.message };
  }
};

// Database statistics
const getDatabaseStats = async () => {
  try {
    const [userCount, clientCount, quotationCount, invoiceCount] = await Promise.all([
      prisma.user.count(),
      prisma.client.count(),
      prisma.quotation.count(),
      prisma.invoice.count()
    ]);

    return {
      users: userCount,
      clients: clientCount,
      quotations: quotationCount,
      invoices: invoiceCount,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error getting database stats:', error);
    return null;
  }
};

// =============================================================================
// GRACEFUL SHUTDOWN
// =============================================================================

const gracefulShutdown = async (signal) => {
  console.log(`\n🔄 Received ${signal}. Starting graceful database shutdown...`);
  
  try {
    await prisma.$disconnect();
    console.log('✅ Database disconnected successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during shutdown:', error);
    process.exit(1);
  }
};

// Handle shutdown signals
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

// Handle uncaught errors
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

module.exports = {
  prisma,
  connectDatabase,
  disconnectDatabase,
  checkDatabaseHealth,
  executeTransaction,
  getDatabaseStats
};