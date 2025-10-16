# Deployment Guide - Quotation Management System

## 📋 Table of Contents
1. [Prerequisites](#prerequisites)
2. [Server Requirements](#server-requirements)
3. [Environment Setup](#environment-setup)
4. [Database Setup](#database-setup)
5. [Application Deployment](#application-deployment)
6. [Web Server Configuration](#web-server-configuration)
7. [SSL Certificate Setup](#ssl-certificate-setup)
8. [Monitoring & Logging](#monitoring--logging)
9. [Backup Strategy](#backup-strategy)
10. [Security Configuration](#security-configuration)
11. [Troubleshooting](#troubleshooting)

## 🔧 Prerequisites

### System Requirements
- **Operating System**: Ubuntu 20.04+ LTS or CentOS 8+
- **Memory**: 4GB+ RAM (8GB recommended for production)
- **Storage**: 50GB+ SSD storage
- **CPU**: 2+ cores (4+ cores recommended for production)
- **Network**: Stable internet connection

### Software Requirements
- **Node.js**: 18.x LTS or higher
- **PostgreSQL**: 14+ or higher
- **Nginx**: 1.18+ (recommended web server)
- **PM2**: Process manager for Node.js
- **Git**: Version control system

## 🖥️ Server Requirements

### Minimum Requirements
- **CPU**: 2 cores @ 2.0GHz
- **RAM**: 4GB
- **Storage**: 50GB SSD
- **Network**: 100Mbps

### Recommended Requirements
- **CPU**: 4 cores @ 2.5GHz
- **RAM**: 8GB
- **Storage**: 100GB SSD
- **Network**: 1Gbps

### Production Requirements
- **CPU**: 8 cores @ 3.0GHz
- **RAM**: 16GB
- **Storage**: 200GB SSD
- **Network**: 10Gbps
- **Load Balancer**: For high availability

## 🌐 Environment Setup

### 1. Update System Packages
```bash
# Ubuntu/Debian
sudo apt update && sudo apt upgrade -y

# CentOS/RHEL
sudo yum update -y
```

### 2. Install Node.js
```bash
# Using NodeSource repository
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version
npm --version
```

### 3. Install PostgreSQL
```bash
# Ubuntu/Debian
sudo apt install postgresql postgresql-contrib -y

# CentOS/RHEL
sudo yum install postgresql-server postgresql-contrib -y
sudo postgresql-setup initdb
sudo systemctl enable postgresql
sudo systemctl start postgresql
```

### 4. Install Nginx
```bash
# Ubuntu/Debian
sudo apt install nginx -y

# CentOS/RHEL
sudo yum install nginx -y
sudo systemctl enable nginx
sudo systemctl start nginx
```

### 5. Install PM2
```bash
sudo npm install -g pm2
```

### 6. Install Git
```bash
# Ubuntu/Debian
sudo apt install git -y

# CentOS/RHEL
sudo yum install git -y
```

## 🗄️ Database Setup

### 1. Configure PostgreSQL
```bash
# Switch to postgres user
sudo -u postgres psql

# Create database
CREATE DATABASE quotation_system;

# Create user
CREATE USER quotation_user WITH PASSWORD 'secure_password';

# Grant privileges
GRANT ALL PRIVILEGES ON DATABASE quotation_system TO quotation_user;

# Exit psql
\q
```

### 2. Configure PostgreSQL for Remote Access
```bash
# Edit postgresql.conf
sudo nano /etc/postgresql/14/main/postgresql.conf

# Uncomment and modify
listen_addresses = '*'
port = 5432

# Edit pg_hba.conf
sudo nano /etc/postgresql/14/main/pg_hba.conf

# Add line for remote access
host    all             all             0.0.0.0/0               md5

# Restart PostgreSQL
sudo systemctl restart postgresql
```

### 3. Create Database Schema
```bash
# Clone repository
git clone <repository-url>
cd quotation-management-system

# Install dependencies
npm install
cd server && npm install && cd ..

# Run migrations
cd server
npx prisma migrate deploy

# Seed database (optional)
npx prisma db seed
```

## 🚀 Application Deployment

### 1. Environment Configuration
```bash
# Create environment file
cd server
cp .env.example .env

# Edit environment variables
nano .env
```

**Environment Variables:**
```env
# Database
DATABASE_URL="postgresql://quotation_user:secure_password@localhost:5432/quotation_system"

# JWT
JWT_SECRET="your-super-secret-jwt-key-here"

# Email Configuration
EMAIL_HOST="smtp.gmail.com"
EMAIL_PORT=587
EMAIL_USER="your-email@gmail.com"
EMAIL_PASS="your-app-password"
EMAIL_SECURE=false

# Server Configuration
PORT=5000
NODE_ENV="production"
FRONTEND_URL="https://your-domain.com"

# File Upload
UPLOAD_PATH="/var/www/quotation-system/uploads"
MAX_FILE_SIZE=10485760

# Security
BCRYPT_ROUNDS=12
SESSION_SECRET="your-session-secret"
```

### 2. Build Frontend
```bash
# Install frontend dependencies
cd client
npm install

# Build for production
npm run build

# The build files will be in client/build/
```

### 3. Configure PM2
```bash
# Create PM2 ecosystem file
nano ecosystem.config.js
```

**ecosystem.config.js:**
```javascript
module.exports = {
  apps: [{
    name: 'quotation-system',
    script: 'server/server.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
};
```

### 4. Start Application
```bash
# Start with PM2
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u $USER --hp $HOME
```

### 5. Create Upload Directories
```bash
# Create upload directories
sudo mkdir -p /var/www/quotation-system/uploads/logos
sudo mkdir -p /var/www/quotation-system/uploads/documents
sudo mkdir -p /var/www/quotation-system/logs

# Set permissions
sudo chown -R $USER:$USER /var/www/quotation-system
sudo chmod -R 755 /var/www/quotation-system
```

## 🌐 Web Server Configuration

### 1. Configure Nginx
```bash
# Create Nginx configuration
sudo nano /etc/nginx/sites-available/quotation-system
```

**Nginx Configuration:**
```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com www.your-domain.com;
    
    # SSL Configuration
    ssl_certificate /etc/ssl/certs/your-domain.crt;
    ssl_certificate_key /etc/ssl/private/your-domain.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    
    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
    
    # Frontend (React App)
    location / {
        root /var/www/quotation-system/client/build;
        index index.html;
        try_files $uri $uri/ /index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
    
    # Backend API
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Rate limiting
        limit_req zone=api burst=20 nodelay;
    }
    
    # File uploads
    location /uploads {
        alias /var/www/quotation-system/uploads;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Security
    location ~ /\. {
        deny all;
    }
}

# Rate limiting
http {
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
}
```

### 2. Enable Site
```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/quotation-system /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

## 🔒 SSL Certificate Setup

### 1. Install Certbot
```bash
# Ubuntu/Debian
sudo apt install certbot python3-certbot-nginx -y

# CentOS/RHEL
sudo yum install certbot python3-certbot-nginx -y
```

### 2. Obtain SSL Certificate
```bash
# Get certificate
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Test auto-renewal
sudo certbot renew --dry-run
```

### 3. Setup Auto-Renewal
```bash
# Add to crontab
sudo crontab -e

# Add line
0 12 * * * /usr/bin/certbot renew --quiet
```

## 📊 Monitoring & Logging

### 1. Setup Log Rotation
```bash
# Create logrotate configuration
sudo nano /etc/logrotate.d/quotation-system
```

**Logrotate Configuration:**
```
/var/www/quotation-system/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 $USER $USER
    postrotate
        pm2 reload quotation-system
    endscript
}
```

### 2. Setup Monitoring
```bash
# Install monitoring tools
sudo apt install htop iotop nethogs -y

# Monitor application
pm2 monit
```

### 3. Setup Health Checks
```bash
# Create health check script
nano /var/www/quotation-system/health-check.sh
```

**Health Check Script:**
```bash
#!/bin/bash

# Check if application is running
if ! pm2 list | grep -q "quotation-system.*online"; then
    echo "Application is not running"
    exit 1
fi

# Check database connection
if ! psql -h localhost -U quotation_user -d quotation_system -c "SELECT 1;" > /dev/null 2>&1; then
    echo "Database connection failed"
    exit 1
fi

# Check if port is listening
if ! netstat -tlnp | grep -q ":5000"; then
    echo "Port 5000 is not listening"
    exit 1
fi

echo "All checks passed"
exit 0
```

```bash
# Make executable
chmod +x /var/www/quotation-system/health-check.sh

# Add to crontab for regular checks
crontab -e

# Add line (check every 5 minutes)
*/5 * * * * /var/www/quotation-system/health-check.sh
```

## 💾 Backup Strategy

### 1. Database Backup
```bash
# Create backup script
nano /var/www/quotation-system/backup-db.sh
```

**Database Backup Script:**
```bash
#!/bin/bash

BACKUP_DIR="/var/backups/quotation-system"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="quotation_system"
DB_USER="quotation_user"

# Create backup directory
mkdir -p $BACKUP_DIR

# Create database backup
pg_dump -h localhost -U $DB_USER $DB_NAME > $BACKUP_DIR/db_backup_$DATE.sql

# Compress backup
gzip $BACKUP_DIR/db_backup_$DATE.sql

# Keep only last 30 days of backups
find $BACKUP_DIR -name "db_backup_*.sql.gz" -mtime +30 -delete

echo "Database backup completed: db_backup_$DATE.sql.gz"
```

### 2. File Backup
```bash
# Create file backup script
nano /var/www/quotation-system/backup-files.sh
```

**File Backup Script:**
```bash
#!/bin/bash

BACKUP_DIR="/var/backups/quotation-system"
DATE=$(date +%Y%m%d_%H%M%S)
UPLOAD_DIR="/var/www/quotation-system/uploads"

# Create backup directory
mkdir -p $BACKUP_DIR

# Create file backup
tar -czf $BACKUP_DIR/files_backup_$DATE.tar.gz -C $UPLOAD_DIR .

# Keep only last 30 days of backups
find $BACKUP_DIR -name "files_backup_*.tar.gz" -mtime +30 -delete

echo "File backup completed: files_backup_$DATE.tar.gz"
```

### 3. Automated Backups
```bash
# Make scripts executable
chmod +x /var/www/quotation-system/backup-*.sh

# Add to crontab
crontab -e

# Add lines (daily backups at 2 AM)
0 2 * * * /var/www/quotation-system/backup-db.sh
0 2 * * * /var/www/quotation-system/backup-files.sh
```

## 🔐 Security Configuration

### 1. Firewall Configuration
```bash
# Install UFW
sudo apt install ufw -y

# Configure firewall
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

### 2. Fail2Ban Setup
```bash
# Install Fail2Ban
sudo apt install fail2ban -y

# Create configuration
sudo nano /etc/fail2ban/jail.local
```

**Fail2Ban Configuration:**
```ini
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 3

[sshd]
enabled = true
port = ssh
logpath = /var/log/auth.log

[nginx-http-auth]
enabled = true
filter = nginx-http-auth
port = http,https
logpath = /var/log/nginx/error.log

[nginx-limit-req]
enabled = true
filter = nginx-limit-req
port = http,https
logpath = /var/log/nginx/error.log
```

### 3. Security Headers
```bash
# Install security headers module
sudo apt install nginx-module-headers-more -y

# Add to Nginx configuration
sudo nano /etc/nginx/sites-available/quotation-system
```

## 🔧 Troubleshooting

### Common Issues

#### 1. Application Won't Start
```bash
# Check PM2 status
pm2 status

# Check logs
pm2 logs quotation-system

# Restart application
pm2 restart quotation-system
```

#### 2. Database Connection Issues
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Check database connection
psql -h localhost -U quotation_user -d quotation_system

# Check firewall
sudo ufw status
```

#### 3. Nginx Issues
```bash
# Check Nginx status
sudo systemctl status nginx

# Test configuration
sudo nginx -t

# Check error logs
sudo tail -f /var/log/nginx/error.log
```

#### 4. SSL Certificate Issues
```bash
# Check certificate status
sudo certbot certificates

# Renew certificate
sudo certbot renew

# Check certificate expiration
openssl x509 -in /etc/ssl/certs/your-domain.crt -text -noout | grep "Not After"
```

#### 5. Performance Issues
```bash
# Check system resources
htop
iotop
nethogs

# Check PM2 metrics
pm2 monit

# Check database performance
sudo -u postgres psql -c "SELECT * FROM pg_stat_activity;"
```

### Log Locations
- **Application Logs**: `/var/www/quotation-system/logs/`
- **Nginx Logs**: `/var/log/nginx/`
- **PostgreSQL Logs**: `/var/log/postgresql/`
- **System Logs**: `/var/log/syslog`

### Performance Optimization
```bash
# Optimize PostgreSQL
sudo nano /etc/postgresql/14/main/postgresql.conf

# Key settings
shared_buffers = 256MB
effective_cache_size = 1GB
work_mem = 4MB
maintenance_work_mem = 64MB
```

---

*This deployment guide is maintained by the development team. For updates or questions, contact the technical lead.*
