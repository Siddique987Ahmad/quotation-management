# Technical Documentation - Quotation Management System

## 📋 Table of Contents
1. [System Architecture](#system-architecture)
2. [Database Schema](#database-schema)
3. [API Documentation](#api-documentation)
4. [Frontend Architecture](#frontend-architecture)
5. [Backend Architecture](#backend-architecture)
6. [Security Implementation](#security-implementation)
7. [Deployment Guide](#deployment-guide)
8. [Development Setup](#development-setup)
9. [Testing Strategy](#testing-strategy)
10. [Performance Optimization](#performance-optimization)

## 🏗️ System Architecture

### High-Level Architecture
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   Database      │
│   (React)       │◄──►│   (Node.js)      │◄──►│   (PostgreSQL)  │
│                 │    │                 │    │                 │
│ - React Router  │    │ - Express.js    │    │ - Prisma ORM    │
│ - TypeScript    │    │ - JWT Auth      │    │ - Migrations    │
│ - Tailwind CSS  │    │ - REST API      │    │ - Indexes       │
│ - Axios         │    │ - File Upload   │    │ - Constraints   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Technology Stack

#### Frontend
- **Framework**: React 18 with TypeScript
- **Routing**: React Router v6
- **State Management**: React Context API + Custom Hooks
- **Styling**: Tailwind CSS
- **HTTP Client**: Axios
- **Build Tool**: Create React App
- **Testing**: Jest + React Testing Library

#### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: PostgreSQL 14+
- **ORM**: Prisma
- **Authentication**: JWT
- **File Upload**: Multer
- **Email**: Nodemailer
- **PDF**: Puppeteer
- **Validation**: Express-validator

#### Database
- **Primary**: PostgreSQL
- **ORM**: Prisma Client
- **Migrations**: Prisma Migrate
- **Seeding**: Prisma Seed

## 🗄️ Database Schema

### Core Entities

#### User Model
```prisma
model User {
  id               String   @id @default(uuid())
  email            String   @unique
  password         String
  firstName        String
  lastName         String
  role             Role     @default(USER)
  customPermissions Json?
  isActive         Boolean  @default(true)
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt
  
  // Relations
  quotations       Quotation[]
  invoices         Invoice[]
  passwordResets   PasswordReset[]
  createdEmailTemplates EmailTemplate[]
  updatedEmailTemplates EmailTemplate[]
}
```

#### Client Model
```prisma
model Client {
  id            String   @id @default(uuid())
  companyName   String
  contactPerson String
  email         String   @unique
  phone         String?
  address       String?
  city          String?
  state         String?
  zipCode       String?
  country       String?
  taxId         String?
  customFields  Json?
  isActive      Boolean  @default(true)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  // Relations
  quotations    Quotation[]
  invoices      Invoice[]
}
```

#### Quotation Model
```prisma
model Quotation {
  id                String          @id @default(uuid())
  quotationNumber   String          @unique
  title             String
  description       String?
  clientId          String
  userId            String
  status            QuotationStatus @default(DRAFT)
  formData          Json
  subtotal          Decimal         @db.Decimal(12, 2)
  taxPercentage     Decimal         @db.Decimal(5, 2) @default(0)
  taxAmount         Decimal         @db.Decimal(12, 2)
  gstPercentage     Decimal         @db.Decimal(5, 2) @default(0)
  gstAmount         Decimal         @db.Decimal(12, 2)
  pstPercentage     Decimal         @db.Decimal(5, 2) @default(0)
  pstAmount         Decimal         @db.Decimal(12, 2)
  combinedTaxAmount Decimal         @db.Decimal(12, 2)
  totalAmount       Decimal         @db.Decimal(12, 2)
  validUntil        DateTime?
  notes             String?
  emailSent         Boolean         @default(false)
  emailSentAt       DateTime?
  createdAt         DateTime        @default(now())
  updatedAt         DateTime        @updatedAt
  
  // Relations
  client            Client          @relation(fields: [clientId], references: [id])
  user              User            @relation(fields: [userId], references: [id])
  invoices          Invoice[]
}
```

### Database Relationships
- **User → Quotations**: One-to-Many
- **User → Invoices**: One-to-Many
- **Client → Quotations**: One-to-Many
- **Client → Invoices**: One-to-Many
- **Quotation → Invoices**: One-to-Many

### Indexes and Constraints
- **Primary Keys**: UUID-based
- **Foreign Keys**: Referential integrity
- **Unique Constraints**: Email addresses, quotation numbers
- **Indexes**: Performance optimization on frequently queried fields

## 🔌 API Documentation

### Authentication Endpoints

#### POST /api/auth/login
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "jwt_token_here",
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "USER"
    }
  }
}
```

#### POST /api/auth/register
```json
{
  "email": "user@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe",
  "role": "USER"
}
```

### Client Management Endpoints

#### GET /api/clients
**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)
- `search`: Search term
- `status`: Filter by status

**Response:**
```json
{
  "success": true,
  "data": {
    "clients": [...],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 100,
      "pages": 10
    }
  }
}
```

#### POST /api/clients
```json
{
  "companyName": "Acme Corp",
  "contactPerson": "John Doe",
  "email": "contact@acme.com",
  "phone": "+1234567890",
  "address": "123 Main St",
  "city": "New York",
  "state": "NY",
  "zipCode": "10001",
  "country": "USA",
  "taxId": "TAX123456"
}
```

### Quotation Management Endpoints

#### GET /api/quotations
**Query Parameters:**
- `page`: Page number
- `limit`: Items per page
- `status`: Filter by status
- `clientId`: Filter by client
- `userId`: Filter by user

#### POST /api/quotations
```json
{
  "title": "Website Development",
  "description": "Complete website development project",
  "clientId": "client-uuid",
  "formData": {
    "items": [
      {
        "name": "Frontend Development",
        "description": "React frontend development",
        "quantity": 1,
        "unitPrice": 5000,
        "taxRate": 10
      }
    ]
  },
  "validUntil": "2024-12-31T23:59:59Z",
  "notes": "Additional project notes"
}
```

### Invoice Management Endpoints

#### POST /api/invoices
```json
{
  "quotationId": "quotation-uuid",
  "type": "TAX_INVOICE_1",
  "dueDate": "2024-12-31T23:59:59Z"
}
```

### System Settings Endpoints

#### GET /api/settings
**Response:**
```json
{
  "success": true,
  "data": {
    "company": {
      "name": "Your Company",
      "address": "123 Main St",
      "phone": "+1234567890",
      "email": "info@company.com"
    },
    "email": {
      "host": "smtp.gmail.com",
      "port": 587,
      "username": "email@company.com"
    },
    "tax": {
      "gstRate": 10,
      "pstRate": 5
    }
  }
}
```

## 🎨 Frontend Architecture

### Component Structure
```
src/
├── components/           # Reusable components
│   ├── Layout.tsx       # Main layout wrapper
│   ├── Sidebar.tsx      # Navigation sidebar
│   ├── Header.tsx       # Top header
│   └── LoadingSpinner.tsx
├── pages/               # Page components
│   ├── DashboardPage.tsx
│   ├── Clients/
│   ├── Quotations/
│   ├── Invoices/
│   └── SystemSettings/
├── contexts/            # React contexts
│   ├── CompanyContext.tsx
│   └── CurrencyContext.tsx
├── services/            # API services
│   └── api.ts
├── utils/               # Utility functions
│   └── auth.ts
└── types/               # TypeScript types
    └── index.ts
```

### State Management
- **Context API**: Global state management
- **Local State**: Component-level state with useState
- **Custom Hooks**: Reusable state logic
- **API Integration**: Axios for HTTP requests

### Routing Structure
```typescript
const routes = [
  { path: '/', component: DashboardPage },
  { path: '/clients', component: ClientsPage },
  { path: '/quotations', component: QuotationsPage },
  { path: '/invoices', component: InvoicesPage },
  { path: '/settings', component: SystemSettingsPage },
  { path: '/profile', component: ProfilePage }
];
```

### Protected Routes
```typescript
const ProtectedRoute = ({ children, requiredPermissions }) => {
  const { user, hasPermission } = useAuth();
  
  if (!user) return <Navigate to="/login" />;
  
  if (requiredPermissions && !hasPermission(requiredPermissions)) {
    return <AccessDenied />;
  }
  
  return children;
};
```

## ⚙️ Backend Architecture

### Project Structure
```
server/
├── src/
│   ├── controllers/     # Route controllers
│   │   ├── authController.js
│   │   ├── clientController.js
│   │   ├── quotationController.js
│   │   └── invoiceController.js
│   ├── middleware/      # Custom middleware
│   │   ├── auth.js
│   │   ├── permissions.js
│   │   └── validation.js
│   ├── routes/          # API routes
│   │   ├── auth.js
│   │   ├── clients.js
│   │   ├── quotations.js
│   │   └── invoices.js
│   ├── services/        # Business logic
│   │   ├── emailService.js
│   │   ├── pdfService.js
│   │   └── settingsService.js
│   ├── utils/           # Utility functions
│   │   ├── helpers.js
│   │   └── jwt.js
│   └── config/          # Configuration
│       ├── database.js
│       └── constants.js
├── prisma/              # Database schema
│   ├── schema.prisma
│   └── migrations/
└── uploads/             # File uploads
```

### Middleware Stack
```javascript
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static('uploads'));
app.use('/api/auth', authRoutes);
app.use('/api', authenticateToken);
app.use('/api', requirePermission);
```

### Error Handling
```javascript
const errorHandler = (err, req, res, next) => {
  console.error(err.stack);
  
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation Error',
      errors: err.errors
    });
  }
  
  res.status(500).json({
    success: false,
    message: 'Internal Server Error'
  });
};
```

## 🔒 Security Implementation

### Authentication
- **JWT Tokens**: Stateless authentication
- **Password Hashing**: bcrypt with salt rounds
- **Token Expiration**: Configurable token lifetime
- **Refresh Tokens**: Secure token renewal

### Authorization
- **Role-Based Access Control**: 4-tier role system
- **Permission System**: Granular permissions
- **Resource Protection**: Route-level protection
- **API Rate Limiting**: Prevent abuse

### Data Security
- **Input Validation**: Server-side validation
- **SQL Injection Prevention**: Prisma ORM protection
- **XSS Protection**: Input sanitization
- **CSRF Protection**: Token-based protection

### File Security
- **Upload Validation**: File type and size limits
- **Path Traversal Prevention**: Secure file paths
- **Virus Scanning**: File content validation
- **Access Control**: User-based file access

## 🚀 Deployment Guide

### Production Environment

#### Server Requirements
- **OS**: Ubuntu 20.04+ or CentOS 8+
- **Node.js**: 18.x LTS
- **PostgreSQL**: 14+
- **Memory**: 4GB+ RAM
- **Storage**: 50GB+ SSD
- **CPU**: 2+ cores

#### Environment Setup
```bash
# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PostgreSQL
sudo apt-get install postgresql postgresql-contrib

# Install PM2 for process management
npm install -g pm2
```

#### Database Setup
```bash
# Create database
sudo -u postgres createdb quotation_system

# Run migrations
npx prisma migrate deploy

# Seed database
npx prisma db seed
```

#### Application Deployment
```bash
# Clone repository
git clone <repository-url>
cd quotation-management-system

# Install dependencies
npm install

# Build frontend
cd client
npm run build
cd ..

# Start application
pm2 start server.js --name "quotation-system"
pm2 save
pm2 startup
```

#### Nginx Configuration
```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
    
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 🛠️ Development Setup

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- Git
- Code editor (VS Code recommended)

### Local Development
```bash
# Clone repository
git clone <repository-url>
cd quotation-management-system

# Install dependencies
npm install
cd client && npm install && cd ..
cd server && npm install && cd ..

# Setup environment variables
cp server/.env.example server/.env
# Edit server/.env with your configuration

# Setup database
cd server
npx prisma migrate dev
npx prisma db seed
cd ..

# Start development servers
npm run dev
```

### Development Scripts
```json
{
  "scripts": {
    "dev": "concurrently \"npm run server\" \"npm run client\"",
    "server": "cd server && npm run dev",
    "client": "cd client && npm start",
    "build": "cd client && npm run build",
    "test": "npm run test:server && npm run test:client",
    "test:server": "cd server && npm test",
    "test:client": "cd client && npm test"
  }
}
```

## 🧪 Testing Strategy

### Frontend Testing
- **Unit Tests**: Component testing with Jest
- **Integration Tests**: API integration testing
- **E2E Tests**: End-to-end testing with Cypress
- **Visual Tests**: Component visual regression testing

### Backend Testing
- **Unit Tests**: Function and method testing
- **Integration Tests**: API endpoint testing
- **Database Tests**: Database operation testing
- **Security Tests**: Authentication and authorization testing

### Test Coverage
- **Target Coverage**: 80%+ code coverage
- **Critical Paths**: 100% coverage for critical functions
- **API Endpoints**: All endpoints tested
- **User Flows**: Complete user journey testing

## ⚡ Performance Optimization

### Frontend Optimization
- **Code Splitting**: Lazy loading of components
- **Bundle Optimization**: Webpack optimization
- **Image Optimization**: Compressed and optimized images
- **Caching**: Browser caching strategies

### Backend Optimization
- **Database Indexing**: Optimized database queries
- **Caching**: Redis for session and data caching
- **Compression**: Gzip compression for responses
- **Connection Pooling**: Database connection optimization

### Database Optimization
- **Query Optimization**: Efficient database queries
- **Indexing Strategy**: Strategic database indexes
- **Connection Pooling**: Optimized database connections
- **Backup Strategy**: Regular automated backups

---

*This technical documentation is maintained by the development team. For updates or questions, contact the technical lead.*
