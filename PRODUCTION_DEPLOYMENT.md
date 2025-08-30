# HealthyWallet Backend - Production Deployment Guide

## 🚀 Production Checklist

### 1. Environment Configuration

Create a `.env` file with production values:

```env
# Server Configuration
NODE_ENV=production
PORT=8000
BASE_URL=https://api.yourdomain.com

# Database Configuration (MongoDB Atlas recommended)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/healthywallet?retryWrites=true&w=majority

# JWT Configuration
JWT_SECRET=your-super-secure-256-bit-secret-key-change-this
JWT_EXPIRE=24h

# Frontend Configuration (comma-separated for multiple domains)
FRONTEND_URL=https://yourdomain.com,https://www.yourdomain.com

# Rate Limiting Configuration
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Security Configuration
BCRYPT_SALT_ROUNDS=12

# Logging Configuration
ENABLE_REQUEST_LOGGING=true
ENABLE_ERROR_LOGGING=true
ENABLE_PERFORMANCE_MONITORING=false

# Production Flags
SKIP_RATE_LIMIT_FOR_LOCALHOST=false
ENABLE_DETAILED_ERRORS=false
```

### 2. Security Considerations

#### Environment Variables
- **Never commit `.env` files to version control**
- Use strong, unique JWT secrets (minimum 256 bits)
- Use MongoDB Atlas or secured MongoDB instances
- Set `NODE_ENV=production`

#### Database Security
- Enable MongoDB authentication
- Use MongoDB Atlas for managed security
- Configure IP whitelisting
- Enable SSL/TLS connections

#### API Security
- HTTPS only in production
- Proper CORS configuration
- Rate limiting enabled
- Input validation on all endpoints
- Authentication required for all protected routes

### 3. Database Setup

#### MongoDB Atlas (Recommended)
1. Create a MongoDB Atlas cluster
2. Create a database user with appropriate permissions
3. Configure IP whitelist (0.0.0.0/0 for dynamic IPs or specific IPs)
4. Get connection string and update `MONGODB_URI`

#### Self-hosted MongoDB
```bash
# Install MongoDB
sudo apt-get install mongodb

# Start MongoDB service
sudo systemctl start mongodb
sudo systemctl enable mongodb

# Create database and user
mongo
> use healthywallet
> db.createUser({
    user: "healthywallet_user",
    pwd: "secure_password",
    roles: ["readWrite"]
  })
```

### 4. Server Deployment Options

#### Option A: Traditional VPS/Server

```bash
# Clone repository
git clone https://github.com/yourusername/healthywallet_backend.git
cd healthywallet_backend

# Install dependencies
npm install --production

# Create .env file with production values
cp env.example .env
# Edit .env with your production values

# Install PM2 for process management
npm install -g pm2

# Start application with PM2
pm2 start src/server.js --name "healthywallet-api"

# Configure PM2 to start on boot
pm2 startup
pm2 save
```

#### Option B: Docker Deployment

Create `Dockerfile`:
```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY src/ ./src/

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Change ownership
RUN chown -R nodejs:nodejs /app
USER nodejs

EXPOSE 8000

CMD ["node", "src/server.js"]
```

Create `docker-compose.yml`:
```yaml
version: '3.8'
services:
  api:
    build: .
    ports:
      - "8000:8000"
    environment:
      - NODE_ENV=production
    env_file:
      - .env
    restart: unless-stopped
    depends_on:
      - mongo

  mongo:
    image: mongo:6
    restart: unless-stopped
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: password
    volumes:
      - mongo-data:/data/db
    ports:
      - "27017:27017"

volumes:
  mongo-data:
```

#### Option C: Cloud Platforms

**Heroku:**
```bash
# Install Heroku CLI
npm install -g heroku

# Login and create app
heroku login
heroku create healthywallet-api

# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set MONGODB_URI=mongodb+srv://...
heroku config:set JWT_SECRET=your-secret
heroku config:set FRONTEND_URL=https://yourdomain.com

# Deploy
git push heroku main
```

**Railway:**
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and deploy
railway login
railway link
railway up
```

**DigitalOcean App Platform:**
- Connect GitHub repository
- Configure environment variables
- Set build and run commands

### 5. Reverse Proxy Setup (Nginx)

```nginx
server {
    listen 80;
    server_name api.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.yourdomain.com;

    ssl_certificate /path/to/certificate.crt;
    ssl_certificate_key /path/to/private.key;

    location / {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 6. SSL/HTTPS Setup

#### Let's Encrypt (Free SSL)
```bash
# Install Certbot
sudo apt-get install certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d api.yourdomain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

### 7. Monitoring and Logging

#### PM2 Monitoring
```bash
# Monitor processes
pm2 monit

# View logs
pm2 logs healthywallet-api

# Restart application
pm2 restart healthywallet-api
```

#### Log Management
```bash
# Setup log rotation
pm2 install pm2-logrotate

# Configure log rotation
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 30
pm2 set pm2-logrotate:compress true
```

### 8. Performance Optimization

#### Node.js Optimization
```env
# Add to .env
NODE_OPTIONS=--max-old-space-size=4096
UV_THREADPOOL_SIZE=128
```

#### Database Optimization
- Create indexes on frequently queried fields
- Enable MongoDB connection pooling
- Use read replicas for read-heavy operations

### 9. Backup Strategy

#### Database Backup
```bash
# MongoDB Atlas - automatic backups included
# Self-hosted MongoDB
mongodump --uri="mongodb://username:password@localhost:27017/healthywallet" --out=/backup/$(date +%Y%m%d)

# Automated backup script
#!/bin/bash
BACKUP_DIR="/backup/$(date +%Y%m%d)"
mkdir -p $BACKUP_DIR
mongodump --uri="$MONGODB_URI" --out=$BACKUP_DIR
tar -czf $BACKUP_DIR.tar.gz $BACKUP_DIR
rm -rf $BACKUP_DIR

# Upload to cloud storage (AWS S3, Google Cloud, etc.)
```

### 10. Health Checks and Monitoring

#### Health Check Endpoint
The API includes a health check endpoint at `/health`:

```bash
# Test health check
curl https://api.yourdomain.com/health
```

#### Monitoring Tools
- **Uptime monitoring:** UptimeRobot, Pingdom
- **Application monitoring:** New Relic, DataDog
- **Error tracking:** Sentry
- **Log aggregation:** Loggly, Papertrail

### 11. CI/CD Pipeline

#### GitHub Actions Example
```yaml
name: Deploy to Production

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v2
    
    - name: Setup Node.js
      uses: actions/setup-node@v2
      with:
        node-version: '18'
        
    - name: Install dependencies
      run: npm ci
      
    - name: Run tests
      run: npm test
      
    - name: Deploy to server
      uses: appleboy/ssh-action@v0.1.5
      with:
        host: ${{ secrets.HOST }}
        username: ${{ secrets.USERNAME }}
        key: ${{ secrets.KEY }}
        script: |
          cd /path/to/app
          git pull origin main
          npm install --production
          pm2 restart healthywallet-api
```

### 12. Testing Production Deployment

```bash
# Set production API URL
export API_BASE_URL="https://api.yourdomain.com"

# Test authentication
curl -X POST ${API_BASE_URL}/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "password123"}'

# Test health check
curl ${API_BASE_URL}/health

# Test rate limiting
for i in {1..10}; do curl ${API_BASE_URL}/health; done
```

### 13. Troubleshooting

#### Common Issues
1. **CORS errors:** Check `FRONTEND_URL` configuration
2. **Database connection:** Verify `MONGODB_URI` and network access
3. **JWT errors:** Ensure `JWT_SECRET` is set and consistent
4. **Rate limiting:** Check rate limit configuration for production
5. **SSL issues:** Verify certificate installation and nginx configuration

#### Debug Commands
```bash
# Check application logs
pm2 logs healthywallet-api

# Check nginx logs
sudo tail -f /var/log/nginx/error.log

# Test database connection
mongo "$MONGODB_URI"

# Check port availability
netstat -tlnp | grep :8000
```

### 14. Security Hardening

#### Server Security
```bash
# Update system packages
sudo apt-get update && sudo apt-get upgrade

# Configure firewall
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable

# Disable root login
sudo sed -i 's/PermitRootLogin yes/PermitRootLogin no/' /etc/ssh/sshd_config
sudo systemctl restart ssh
```

#### Application Security
- Keep dependencies updated: `npm audit fix`
- Use HTTPS only
- Implement proper input validation
- Enable security headers (Helmet.js)
- Use environment variables for secrets
- Implement proper error handling

---

## 📞 Support

For deployment issues or questions, please check:
- Application logs via `pm2 logs`
- Database connectivity
- Environment variable configuration
- Network and firewall settings

Remember to never expose sensitive information in logs or error messages in production!
