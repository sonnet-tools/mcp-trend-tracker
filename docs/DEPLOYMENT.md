# Deployment Guide

This guide covers different deployment options for the MCP Trend Tracker.

## Prerequisites

- Node.js 18+ and npm 9+
- Git
- API keys for data sources (see Configuration section)

## Local Development

### 1. Clone and Setup
```bash
git clone https://github.com/username/mcp-trend-tracker.git
cd mcp-trend-tracker
npm install
```

### 2. Configuration
```bash
cp .env.example .env
# Edit .env with your API keys
```

### 3. Run Application
```bash
# Development mode with hot reload
npm run dev

# Production mode
npm start

# Run tests
npm test

# Generate analytics report
npm run analyze
```

---

## Docker Deployment

### 1. Create Dockerfile
```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application code
COPY . .

# Create necessary directories
RUN mkdir -p data logs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node healthcheck.js

# Start application
CMD ["npm", "start"]
```

### 2. Docker Compose
```yaml
version: '3.8'

services:
  mcp-tracker:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - LOG_LEVEL=info
    env_file:
      - .env
    volumes:
      - ./data:/app/data
      - ./logs:/app/logs
    restart: unless-stopped
    
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - mcp-tracker
    restart: unless-stopped
```

### 3. Build and Run
```bash
docker-compose up -d
```

---

## Cloud Deployment

### AWS (EC2 + RDS)

#### 1. EC2 Instance Setup
```bash
# Launch Ubuntu 20.04 instance
# Install Node.js and PM2
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
sudo npm install -g pm2

# Clone and setup application
git clone https://github.com/username/mcp-trend-tracker.git
cd mcp-trend-tracker
npm install
```

#### 2. PM2 Configuration
```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'mcp-tracker',
    script: 'src/index.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'development'
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    log_file: 'logs/combined.log',
    error_file: 'logs/error.log',
    out_file: 'logs/out.log',
    time: true,
    max_memory_restart: '1G'
  }]
}
```

#### 3. Deploy with PM2
```bash
# Start application
pm2 start ecosystem.config.js --env production

# Save PM2 configuration
pm2 save
pm2 startup

# Monitor application
pm2 monit
```

### Google Cloud Platform (Cloud Run)

#### 1. Create cloudbuild.yaml
```yaml
steps:
  # Build container image
  - name: 'gcr.io/cloud-builders/docker'
    args: ['build', '-t', 'gcr.io/$PROJECT_ID/mcp-tracker', '.']
  
  # Push to Container Registry
  - name: 'gcr.io/cloud-builders/docker'
    args: ['push', 'gcr.io/$PROJECT_ID/mcp-tracker']
    
  # Deploy to Cloud Run
  - name: 'gcr.io/cloud-builders/gcloud'
    args:
    - 'run'
    - 'deploy'
    - 'mcp-tracker'
    - '--image'
    - 'gcr.io/$PROJECT_ID/mcp-tracker'
    - '--region'
    - 'us-central1'
    - '--platform'
    - 'managed'
    - '--allow-unauthenticated'
```

#### 2. Deploy
```bash
gcloud builds submit --config cloudbuild.yaml
```

### Heroku

#### 1. Create Procfile
```
web: npm start
worker: node src/scrapers/index.js
```

#### 2. Deploy
```bash
heroku create mcp-trend-tracker
heroku config:set NODE_ENV=production
heroku config:set GITHUB_TOKEN=your_token_here
git push heroku main
```

---

## Environment Configuration

### Production Environment Variables
```bash
# Application
NODE_ENV=production
PORT=3000
LOG_LEVEL=info

# Database
DATABASE_URL=/app/data/mcp-trends.db

# API Keys (required)
GITHUB_TOKEN=ghp_xxxxxxxxxxxx
TWITTER_BEARER_TOKEN=AAAAAAAAAx...

# Optional API Keys
REDDIT_CLIENT_ID=your_reddit_id
REDDIT_CLIENT_SECRET=your_reddit_secret

# Scraping Configuration
SCRAPE_INTERVAL_HOURS=6
ENABLE_GITHUB_SCRAPING=true
ENABLE_NPM_SCRAPING=true
ENABLE_REDDIT_SCRAPING=true
ENABLE_TWITTER_SCRAPING=false

# Performance
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_WINDOW_MS=900000
```

### Security Configuration
```bash
# CORS
CORS_ORIGIN=https://yourdomain.com

# API Security
API_KEY_REQUIRED=false
JWT_SECRET=your_jwt_secret_here

# SSL/TLS
SSL_CERT_PATH=/etc/ssl/cert.pem
SSL_KEY_PATH=/etc/ssl/private/key.pem
FORCE_HTTPS=true
```

---

## Monitoring and Logging

### Application Monitoring

#### PM2 Monitoring
```bash
# View logs
pm2 logs mcp-tracker

# Monitor performance
pm2 monit

# Restart application
pm2 restart mcp-tracker
```

#### Docker Health Checks
```javascript
// healthcheck.js
const http = require('http');

const options = {
  host: 'localhost',
  port: 3000,
  path: '/api/health',
  timeout: 2000
};

const request = http.request(options, (res) => {
  if (res.statusCode === 200) {
    process.exit(0);
  } else {
    process.exit(1);
  }
});

request.on('error', () => process.exit(1));
request.end();
```

### Log Aggregation

#### ELK Stack Integration
```javascript
// Add to winston logger configuration
const { ElasticsearchTransport } = require('winston-elasticsearch');

logger.add(new ElasticsearchTransport({
  level: 'info',
  clientOpts: { node: 'http://elasticsearch:9200' },
  index: 'mcp-tracker-logs'
}));
```

#### Cloud Logging (GCP)
```javascript
const { LoggingWinston } = require('@google-cloud/logging-winston');

logger.add(new LoggingWinston({
  projectId: 'your-project-id',
  keyFilename: 'path/to/service-account.json'
}));
```

---

## Performance Optimization

### Database Optimization
```sql
-- Create indexes for common queries
CREATE INDEX idx_repos_stars ON repositories(stars DESC);
CREATE INDEX idx_repos_updated ON repositories(updated_at DESC);
CREATE INDEX idx_packages_score ON npm_packages(score_final DESC);
CREATE INDEX idx_metrics_date ON trend_metrics(date DESC, metric_type);
```

### Caching Strategy
```javascript
// Redis caching
const redis = require('redis');
const client = redis.createClient(process.env.REDIS_URL);

// Cache API responses
app.use('/api', (req, res, next) => {
  const key = `api:${req.url}`;
  client.get(key, (err, cached) => {
    if (cached) {
      return res.json(JSON.parse(cached));
    }
    
    const originalSend = res.json;
    res.json = function(data) {
      client.setex(key, 300, JSON.stringify(data)); // 5 min cache
      return originalSend.call(this, data);
    };
    
    next();
  });
});
```

### CDN Configuration (Cloudflare)
```javascript
// Cache static assets
app.use(express.static('public', {
  maxAge: '1d',
  setHeaders: (res, path) => {
    if (path.endsWith('.html')) {
      res.set('Cache-Control', 'public, max-age=3600'); // 1 hour
    }
  }
}));
```

---

## Backup and Recovery

### Database Backup
```bash
#!/bin/bash
# backup.sh
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/app/backups"
DB_PATH="/app/data/mcp-trends.db"

# Create backup directory
mkdir -p $BACKUP_DIR

# Create database backup
cp $DB_PATH $BACKUP_DIR/mcp-trends_$DATE.db

# Compress backup
gzip $BACKUP_DIR/mcp-trends_$DATE.db

# Keep only last 7 days of backups
find $BACKUP_DIR -name "*.db.gz" -mtime +7 -delete

# Upload to cloud storage (optional)
# aws s3 cp $BACKUP_DIR/mcp-trends_$DATE.db.gz s3://your-bucket/backups/
```

### Automated Backups
```bash
# Add to crontab
0 2 * * * /app/backup.sh >> /app/logs/backup.log 2>&1
```

---

## SSL/TLS Configuration

### Let's Encrypt with Certbot
```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d yourdomain.com

# Auto-renewal
sudo certbot renew --dry-run
```

### Nginx SSL Configuration
```nginx
server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;
    ssl_prefer_server_ciphers off;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## Troubleshooting

### Common Issues

#### 1. Database Lock Errors
```bash
# Check for running processes
lsof /app/data/mcp-trends.db

# Restart application
pm2 restart mcp-tracker
```

#### 2. API Rate Limiting
```bash
# Check logs for rate limit errors
grep "rate limit" logs/error.log

# Increase delays in scraper configuration
```

#### 3. Memory Issues
```bash
# Monitor memory usage
pm2 monit

# Restart application if memory usage is high
pm2 restart mcp-tracker
```

### Log Analysis
```bash
# View recent errors
tail -f logs/error.log

# Search for specific errors
grep "GitHub scraper" logs/combined.log

# View application performance
pm2 logs --lines 100
```