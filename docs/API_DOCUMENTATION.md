# API Documentation - Quotation Management System

## 📋 Table of Contents
1. [Authentication API](#authentication-api)
2. [User Management API](#user-management-api)
3. [Client Management API](#client-management-api)
4. [Quotation Management API](#quotation-management-api)
5. [Invoice Management API](#invoice-management-api)
6. [System Settings API](#system-settings-api)
7. [Email Templates API](#email-templates-api)
8. [File Upload API](#file-upload-api)
9. [Error Handling](#error-handling)
10. [Rate Limiting](#rate-limiting)

## 🔐 Authentication API

### Base URL
```
https://your-domain.com/api
```

### Authentication Headers
```http
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

### POST /auth/login
Authenticate user and return JWT token.

**Request Body:**
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
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "USER",
      "isActive": true
    }
  }
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "Invalid credentials"
}
```

### POST /auth/register
Register a new user account.

**Request Body:**
```json
{
  "email": "newuser@example.com",
  "password": "password123",
  "firstName": "Jane",
  "lastName": "Smith",
  "role": "USER"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "newuser@example.com",
      "firstName": "Jane",
      "lastName": "Smith",
      "role": "USER"
    }
  }
}
```

### POST /auth/forgot-password
Request password reset email.

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Password reset email sent"
}
```

### POST /auth/reset-password
Reset password with token.

**Request Body:**
```json
{
  "token": "reset_token_here",
  "password": "newpassword123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Password reset successfully"
}
```

### POST /auth/logout
Logout user and invalidate token.

**Response:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

## 👤 User Management API

### GET /users
Get list of users with pagination.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `search` (optional): Search term
- `role` (optional): Filter by role
- `status` (optional): Filter by status (active/inactive)

**Response:**
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": "uuid",
        "email": "user@example.com",
        "firstName": "John",
        "lastName": "Doe",
        "role": "USER",
        "isActive": true,
        "createdAt": "2024-01-01T00:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 50,
      "pages": 5
    }
  }
}
```

### GET /users/:id
Get specific user details.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "USER",
    "customPermissions": ["clients:create", "quotations:read"],
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  }
}
```

### POST /users
Create a new user.

**Request Body:**
```json
{
  "email": "newuser@example.com",
  "password": "password123",
  "firstName": "Jane",
  "lastName": "Smith",
  "role": "USER",
  "customPermissions": ["clients:create"]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "newuser@example.com",
    "firstName": "Jane",
    "lastName": "Smith",
    "role": "USER",
    "isActive": true
  }
}
```

### PUT /users/:id
Update user information.

**Request Body:**
```json
{
  "firstName": "Updated Name",
  "lastName": "Updated Last Name",
  "role": "MANAGER",
  "customPermissions": ["clients:create", "quotations:approve"]
}
```

### DELETE /users/:id
Delete a user account.

**Response:**
```json
{
  "success": true,
  "message": "User deleted successfully"
}
```

## 👥 Client Management API

### GET /clients
Get list of clients with pagination and filtering.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `search` (optional): Search term
- `status` (optional): Filter by status (active/inactive)
- `city` (optional): Filter by city
- `country` (optional): Filter by country

**Response:**
```json
{
  "success": true,
  "data": {
    "clients": [
      {
        "id": "uuid",
        "companyName": "Acme Corp",
        "contactPerson": "John Doe",
        "email": "contact@acme.com",
        "phone": "+1234567890",
        "address": "123 Main St",
        "city": "New York",
        "state": "NY",
        "zipCode": "10001",
        "country": "USA",
        "taxId": "TAX123456",
        "isActive": true,
        "createdAt": "2024-01-01T00:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 100,
      "pages": 10
    }
  }
}
```

### GET /clients/:id
Get specific client details.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "companyName": "Acme Corp",
    "contactPerson": "John Doe",
    "email": "contact@acme.com",
    "phone": "+1234567890",
    "address": "123 Main St",
    "city": "New York",
    "state": "NY",
    "zipCode": "10001",
    "country": "USA",
    "taxId": "TAX123456",
    "customFields": {},
    "isActive": true,
    "quotations": [...],
    "invoices": [...],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  }
}
```

### POST /clients
Create a new client.

**Request Body:**
```json
{
  "companyName": "New Company",
  "contactPerson": "Jane Smith",
  "email": "contact@newcompany.com",
  "phone": "+1987654321",
  "address": "456 Oak Ave",
  "city": "Los Angeles",
  "state": "CA",
  "zipCode": "90210",
  "country": "USA",
  "taxId": "TAX789012",
  "customFields": {
    "industry": "Technology",
    "size": "Medium"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "companyName": "New Company",
    "contactPerson": "Jane Smith",
    "email": "contact@newcompany.com",
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

### PUT /clients/:id
Update client information.

**Request Body:**
```json
{
  "companyName": "Updated Company Name",
  "contactPerson": "Updated Contact",
  "phone": "+1555123456"
}
```

### DELETE /clients/:id
Delete a client.

**Response:**
```json
{
  "success": true,
  "message": "Client deleted successfully"
}
```

## 📋 Quotation Management API

### GET /quotations
Get list of quotations with pagination and filtering.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `search` (optional): Search term
- `status` (optional): Filter by status (DRAFT, PENDING, APPROVED, REJECTED, EXPIRED)
- `clientId` (optional): Filter by client
- `userId` (optional): Filter by user
- `dateFrom` (optional): Filter from date
- `dateTo` (optional): Filter to date

**Response:**
```json
{
  "success": true,
  "data": {
    "quotations": [
      {
        "id": "uuid",
        "quotationNumber": "Q-2024-001",
        "title": "Website Development",
        "description": "Complete website development project",
        "clientId": "client-uuid",
        "userId": "user-uuid",
        "status": "PENDING",
        "subtotal": 5000.00,
        "taxPercentage": 10.00,
        "taxAmount": 500.00,
        "totalAmount": 5500.00,
        "validUntil": "2024-12-31T23:59:59Z",
        "emailSent": true,
        "emailSentAt": "2024-01-01T10:00:00Z",
        "createdAt": "2024-01-01T00:00:00Z",
        "client": {
          "id": "client-uuid",
          "companyName": "Acme Corp",
          "contactPerson": "John Doe"
        },
        "user": {
          "id": "user-uuid",
          "firstName": "Jane",
          "lastName": "Smith"
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 50,
      "pages": 5
    }
  }
}
```

### GET /quotations/:id
Get specific quotation details.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "quotationNumber": "Q-2024-001",
    "title": "Website Development",
    "description": "Complete website development project",
    "clientId": "client-uuid",
    "userId": "user-uuid",
    "status": "PENDING",
    "formData": {
      "items": [
        {
          "name": "Frontend Development",
          "description": "React frontend development",
          "quantity": 1,
          "unitPrice": 3000,
          "taxRate": 10,
          "total": 3300
        },
        {
          "name": "Backend Development",
          "description": "Node.js backend development",
          "quantity": 1,
          "unitPrice": 2000,
          "taxRate": 10,
          "total": 2200
        }
      ]
    },
    "subtotal": 5000.00,
    "taxPercentage": 10.00,
    "taxAmount": 500.00,
    "gstPercentage": 5.00,
    "gstAmount": 250.00,
    "pstPercentage": 3.00,
    "pstAmount": 150.00,
    "combinedTaxAmount": 900.00,
    "totalAmount": 5900.00,
    "validUntil": "2024-12-31T23:59:59Z",
    "notes": "Additional project notes",
    "emailSent": true,
    "emailSentAt": "2024-01-01T10:00:00Z",
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z",
    "client": {
      "id": "client-uuid",
      "companyName": "Acme Corp",
      "contactPerson": "John Doe",
      "email": "contact@acme.com"
    },
    "user": {
      "id": "user-uuid",
      "firstName": "Jane",
      "lastName": "Smith"
    },
    "invoices": []
  }
}
```

### POST /quotations
Create a new quotation.

**Request Body:**
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
        "unitPrice": 3000,
        "taxRate": 10
      }
    ]
  },
  "validUntil": "2024-12-31T23:59:59Z",
  "notes": "Additional project notes"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "quotationNumber": "Q-2024-001",
    "title": "Website Development",
    "status": "DRAFT",
    "totalAmount": 3300.00,
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

### PUT /quotations/:id
Update quotation details.

**Request Body:**
```json
{
  "title": "Updated Website Development",
  "description": "Updated project description",
  "formData": {
    "items": [
      {
        "name": "Updated Frontend Development",
        "description": "Updated description",
        "quantity": 2,
        "unitPrice": 3000,
        "taxRate": 10
      }
    ]
  },
  "notes": "Updated notes"
}
```

### PATCH /quotations/:id/status
Update quotation status.

**Request Body:**
```json
{
  "status": "APPROVED"
}
```

### POST /quotations/:id/send-email
Send quotation via email.

**Request Body:**
```json
{
  "to": "client@example.com",
  "subject": "Your Quotation - Q-2024-001",
  "message": "Please find your quotation attached."
}
```

**Response:**
```json
{
  "success": true,
  "message": "Quotation sent successfully",
  "data": {
    "emailSent": true,
    "emailSentAt": "2024-01-01T10:00:00Z"
  }
}
```

### GET /quotations/:id/pdf
Download quotation PDF.

**Response:**
- Content-Type: application/pdf
- File download

### POST /quotations/:id/duplicate
Duplicate an existing quotation.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "new-uuid",
    "quotationNumber": "Q-2024-002",
    "title": "Website Development (Copy)",
    "status": "DRAFT"
  }
}
```

## 🧾 Invoice Management API

### GET /invoices
Get list of invoices with pagination and filtering.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `search` (optional): Search term
- `status` (optional): Filter by status (PENDING, APPROVED, SENT, PAID, OVERDUE, CANCELLED)
- `clientId` (optional): Filter by client
- `userId` (optional): Filter by user
- `type` (optional): Filter by invoice type

**Response:**
```json
{
  "success": true,
  "data": {
    "invoices": [
      {
        "id": "uuid",
        "invoiceNumber": "INV-2024-001",
        "quotationId": "quotation-uuid",
        "clientId": "client-uuid",
        "userId": "user-uuid",
        "type": "TAX_INVOICE_1",
        "subtotal": 5000.00,
        "taxAmount": 500.00,
        "totalAmount": 5500.00,
        "status": "SENT",
        "dueDate": "2024-12-31T23:59:59Z",
        "paidDate": null,
        "emailSent": true,
        "emailSentAt": "2024-01-01T10:00:00Z",
        "createdAt": "2024-01-01T00:00:00Z",
        "client": {
          "id": "client-uuid",
          "companyName": "Acme Corp",
          "contactPerson": "John Doe"
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 25,
      "pages": 3
    }
  }
}
```

### GET /invoices/:id
Get specific invoice details.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "invoiceNumber": "INV-2024-001",
    "quotationId": "quotation-uuid",
    "clientId": "client-uuid",
    "userId": "user-uuid",
    "type": "TAX_INVOICE_1",
    "subtotal": 5000.00,
    "taxPercentage": 10.00,
    "taxAmount": 500.00,
    "gstPercentage": 5.00,
    "gstAmount": 250.00,
    "pstPercentage": 3.00,
    "pstAmount": 150.00,
    "combinedTaxAmount": 900.00,
    "totalAmount": 5900.00,
    "status": "SENT",
    "dueDate": "2024-12-31T23:59:59Z",
    "paidDate": null,
    "emailSent": true,
    "emailSentAt": "2024-01-01T10:00:00Z",
    "pdfPath": "/uploads/invoices/inv-2024-001.pdf",
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z",
    "quotation": {
      "id": "quotation-uuid",
      "quotationNumber": "Q-2024-001",
      "title": "Website Development"
    },
    "client": {
      "id": "client-uuid",
      "companyName": "Acme Corp",
      "contactPerson": "John Doe",
      "email": "contact@acme.com"
    }
  }
}
```

### POST /invoices
Create a new invoice from quotation.

**Request Body:**
```json
{
  "quotationId": "quotation-uuid",
  "type": "TAX_INVOICE_1",
  "dueDate": "2024-12-31T23:59:59Z"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "invoiceNumber": "INV-2024-001",
    "quotationId": "quotation-uuid",
    "type": "TAX_INVOICE_1",
    "totalAmount": 5500.00,
    "status": "PENDING",
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

### POST /invoices/:id/send-email
Send invoice via email.

**Request Body:**
```json
{
  "to": "client@example.com",
  "subject": "Your Invoice - INV-2024-001",
  "message": "Please find your invoice attached."
}
```

### PATCH /invoices/:id/mark-paid
Mark invoice as paid.

**Request Body:**
```json
{
  "paidDate": "2024-01-15T00:00:00Z",
  "paymentMethod": "Bank Transfer",
  "notes": "Payment received via bank transfer"
}
```

### GET /invoices/:id/pdf
Download invoice PDF.

**Response:**
- Content-Type: application/pdf
- File download

## ⚙️ System Settings API

### GET /settings
Get all system settings.

**Response:**
```json
{
  "success": true,
  "data": {
    "company": {
      "name": "Your Company",
      "address": "123 Main St",
      "city": "New York",
      "state": "NY",
      "zipCode": "10001",
      "country": "USA",
      "phone": "+1234567890",
      "email": "info@company.com",
      "website": "https://company.com",
      "taxId": "TAX123456",
      "logo": "/uploads/logos/logo.png"
    },
    "email": {
      "host": "smtp.gmail.com",
      "port": 587,
      "secure": false,
      "username": "email@company.com",
      "password": "encrypted_password"
    },
    "tax": {
      "gstRate": 10.00,
      "pstRate": 5.00,
      "defaultTaxRate": 10.00
    },
    "invoice": {
      "prefix": "INV",
      "numberFormat": "INV-YYYY-###",
      "dueDays": 30
    },
    "quotation": {
      "prefix": "Q",
      "numberFormat": "Q-YYYY-###",
      "validDays": 30
    }
  }
}
```

### PUT /settings
Update system settings.

**Request Body:**
```json
{
  "category": "company",
  "settings": {
    "name": "Updated Company Name",
    "address": "456 Oak Ave",
    "phone": "+1987654321"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Settings updated successfully"
}
```

## 📧 Email Templates API

### GET /email-templates
Get list of email templates.

**Query Parameters:**
- `category` (optional): Filter by category
- `type` (optional): Filter by type
- `enabled` (optional): Filter by enabled status

**Response:**
```json
{
  "success": true,
  "data": {
    "templates": [
      {
        "id": "uuid",
        "templateKey": "quotation_sent",
        "name": "Quotation Sent",
        "description": "Email sent when quotation is sent to client",
        "category": "QUOTATION",
        "type": "QUOTATION_SENT",
        "enabled": true,
        "isSystem": true,
        "subject": "Your Quotation - {{quotationNumber}}",
        "variables": ["clientName", "quotationNumber", "totalAmount"],
        "createdAt": "2024-01-01T00:00:00Z"
      }
    ]
  }
}
```

### GET /email-templates/:id
Get specific email template.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "templateKey": "quotation_sent",
    "name": "Quotation Sent",
    "description": "Email sent when quotation is sent to client",
    "category": "QUOTATION",
    "type": "QUOTATION_SENT",
    "enabled": true,
    "isSystem": true,
    "subject": "Your Quotation - {{quotationNumber}}",
    "htmlContent": "<html>...</html>",
    "textContent": "Plain text version",
    "variables": ["clientName", "quotationNumber", "totalAmount"],
    "sections": {},
    "metadata": {},
    "version": 1,
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  }
}
```

### POST /email-templates
Create a new email template.

**Request Body:**
```json
{
  "templateKey": "custom_welcome",
  "name": "Custom Welcome Email",
  "description": "Welcome email for new clients",
  "category": "CUSTOM",
  "type": "CUSTOM",
  "subject": "Welcome to {{companyName}}",
  "htmlContent": "<html><body><h1>Welcome {{clientName}}!</h1></body></html>",
  "textContent": "Welcome {{clientName}}!",
  "variables": ["clientName", "companyName"],
  "sections": {},
  "metadata": {}
}
```

### PUT /email-templates/:id
Update email template.

**Request Body:**
```json
{
  "name": "Updated Template Name",
  "subject": "Updated Subject - {{quotationNumber}}",
  "htmlContent": "<html>Updated content</html>"
}
```

### DELETE /email-templates/:id
Delete email template (non-system templates only).

**Response:**
```json
{
  "success": true,
  "message": "Template deleted successfully"
}
```

## 📁 File Upload API

### POST /upload/logo
Upload company logo.

**Request:**
- Content-Type: multipart/form-data
- Field: `logo` (file)

**Response:**
```json
{
  "success": true,
  "data": {
    "filename": "logo_1234567890.png",
    "path": "/uploads/logos/logo_1234567890.png",
    "url": "https://your-domain.com/uploads/logos/logo_1234567890.png"
  }
}
```

### POST /upload/document
Upload document (quotations, invoices).

**Request:**
- Content-Type: multipart/form-data
- Field: `document` (file)

**Response:**
```json
{
  "success": true,
  "data": {
    "filename": "document_1234567890.pdf",
    "path": "/uploads/documents/document_1234567890.pdf",
    "url": "https://your-domain.com/uploads/documents/document_1234567890.pdf"
  }
}
```

## ❌ Error Handling

### Standard Error Response Format
```json
{
  "success": false,
  "message": "Error description",
  "errors": [
    {
      "field": "email",
      "message": "Email is required"
    }
  ],
  "code": "VALIDATION_ERROR"
}
```

### HTTP Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `422` - Unprocessable Entity
- `500` - Internal Server Error

### Common Error Codes
- `VALIDATION_ERROR` - Input validation failed
- `AUTHENTICATION_ERROR` - Authentication failed
- `AUTHORIZATION_ERROR` - Insufficient permissions
- `NOT_FOUND` - Resource not found
- `DUPLICATE_ERROR` - Resource already exists
- `SERVER_ERROR` - Internal server error

## 🚦 Rate Limiting

### Rate Limits
- **Authentication**: 5 requests per minute
- **API Endpoints**: 100 requests per minute
- **File Upload**: 10 requests per minute
- **Email Sending**: 20 requests per hour

### Rate Limit Headers
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

### Rate Limit Exceeded Response
```json
{
  "success": false,
  "message": "Rate limit exceeded",
  "retryAfter": 60
}
```

---

*This API documentation is maintained by the development team. For updates or questions, contact the technical lead.*
