# Deployment Guide

This guide covers deploying the Video Conference API Gateway to production.

## 📋 Pre-deployment Checklist

- [ ] Environment variables configured
- [ ] Database created and migrated
- [ ] LiveKit server configured
- [ ] SSL certificates ready (for HTTPS)
- [ ] Domain/subdomain configured
- [ ] Firewall rules configured
- [ ] Monitoring tools set up

## 🚀 Deployment Options

### Option 1: Docker Deployment (Recommended)

#### Prerequisites
- Docker Engine 20.10+
- Docker Compose 2.0+

#### Steps

1. **Clone the repository**
```bash
git clone <repository-url>
cd ts-api-gateway-backend
```

2. **Configure environment**
```bash
cp .env.example .env
# Edit .env with production values
```

3. **Build and start services**
```bash
docker-compose up -d
```

4. **Verify deployment**
```bash
# Check container status
docker-compose ps

# Check logs
docker-compose logs -f api

# Test health endpoint
curl http://localhost:3000/health
```

5. **Stop services**
```bash
docker-compose down
```

#### Production Docker Compose

For production, use a separate `docker-compose.prod.yml`:

```yaml
version: '3.8'

services:
  api:
    image: your-registry/video-api-gateway:latest
    restart: always
    environment:
      - NODE_ENV=production
    deploy:
      replicas: 2
      resources:
        limits:
          cpus: '1'
          memory: 1G
        reservations:
          cpus: '0.5'
          memory: 512M
```

### Option 2: PM2 Deployment

#### Prerequisites
- Node.js 18+
- PM2 installed globally

#### Steps

1. **Install PM2**
```bash
npm install -g pm2
```

2. **Build application**
```bash
npm run build:production
```

3. **Create PM2 ecosystem file**

Create `ecosystem.config.js`:
```javascript
module.exports = {
  apps: [{
    name: 'video-api-gateway',
    script: './dist/index.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    max_memory_restart: '1G',
    watch: false
  }]
};
```

4. **Start with PM2**
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

5. **Monitor**
```bash
pm2 monit
pm2 logs video-api-gateway
pm2 status
```

### Option 3: Kubernetes Deployment

#### Prerequisites
- Kubernetes cluster
- kubectl configured
- Helm (optional)

#### Kubernetes Manifests

**Deployment:**
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: video-api-gateway
spec:
  replicas: 3
  selector:
    matchLabels:
      app: video-api-gateway
  template:
    metadata:
      labels:
        app: video-api-gateway
    spec:
      containers:
      - name: api
        image: your-registry/video-api-gateway:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        - name: MYSQL_HOST
          valueFrom:
            secretKeyRef:
              name: db-secret
              key: host
        resources:
          requests:
            memory: "512Mi"
            cpu: "500m"
          limits:
            memory: "1Gi"
            cpu: "1000m"
        livenessProbe:
          httpGet:
            path: /health/live
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health/ready
            port: 3000
          initialDelaySeconds: 10
          periodSeconds: 5
```

**Service:**
```yaml
apiVersion: v1
kind: Service
metadata:
  name: video-api-gateway
spec:
  type: LoadBalancer
  ports:
  - port: 80
    targetPort: 3000
    protocol: TCP
  selector:
    app: video-api-gateway
```

## 🔒 Security Hardening

### 1. Environment Variables
- Never commit `.env` files
- Use secrets management (AWS Secrets Manager, HashiCorp Vault)
- Rotate JWT secrets regularly

### 2. HTTPS/SSL
```bash
# Using Let's Encrypt with Certbot
certbot certonly --standalone -d api.yourdomain.com
```

### 3. Firewall Rules
```bash
# Allow only necessary ports
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw enable
```

### 4. Rate Limiting
Configure rate limiting in production:
```typescript
// Add to middlewares
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use('/api/', limiter);
```

## 📊 Monitoring

### Application Monitoring

**Health Checks:**
- `/health` - Basic health
- `/health/ready` - Readiness probe
- `/health/live` - Liveness probe

**Logging:**
```bash
# View logs
docker-compose logs -f api

# PM2 logs
pm2 logs video-api-gateway

# Kubernetes logs
kubectl logs -f deployment/video-api-gateway
```

### Metrics Collection

**Prometheus Integration:**
```typescript
// Add prometheus metrics
import promClient from 'prom-client';

const register = new promClient.Registry();
promClient.collectDefaultMetrics({ register });

app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});
```

## 🔄 CI/CD Pipeline

### GitHub Actions Example

`.github/workflows/deploy.yml`:
```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Build Docker image
        run: docker build -t video-api-gateway .
      
      - name: Push to registry
        run: |
          docker tag video-api-gateway ${{ secrets.REGISTRY }}/video-api-gateway:latest
          docker push ${{ secrets.REGISTRY }}/video-api-gateway:latest
      
      - name: Deploy to server
        run: |
          ssh ${{ secrets.SSH_USER }}@${{ secrets.SSH_HOST }} \
            "cd /app && docker-compose pull && docker-compose up -d"
```

## 🗄️ Database Management

### Backup
```bash
# MySQL backup
docker exec video-mysql mysqldump -u root -p$MYSQL_PASSWORD video_conference > backup.sql

# Restore
docker exec -i video-mysql mysql -u root -p$MYSQL_PASSWORD video_conference < backup.sql
```

### Migrations
```bash
# Run migrations
npm run db:migrate

# Rollback
npm run db:rollback
```

## 🔧 Troubleshooting

### Common Issues

**1. Database Connection Failed**
```bash
# Check database is running
docker-compose ps mysql

# Check logs
docker-compose logs mysql

# Test connection
mysql -h localhost -u root -p
```

**2. Port Already in Use**
```bash
# Find process using port
lsof -i :3000

# Kill process
kill -9 <PID>
```

**3. Out of Memory**
```bash
# Check memory usage
docker stats

# Increase memory limit in docker-compose.yml
deploy:
  resources:
    limits:
      memory: 2G
```

## 📈 Scaling

### Horizontal Scaling

**Docker Swarm:**
```bash
docker service scale video-api-gateway=5
```

**Kubernetes:**
```bash
kubectl scale deployment video-api-gateway --replicas=5
```

### Load Balancing

**Nginx Configuration:**
```nginx
upstream api_backend {
    least_conn;
    server api1:3000;
    server api2:3000;
    server api3:3000;
}

server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://api_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 🎯 Performance Optimization

### 1. Enable Compression
```typescript
import compression from 'compression';
app.use(compression());
```

### 2. Connection Pooling
Already configured in `connection.ts`:
- Pool size: 20 connections
- Keep-alive enabled

### 3. Caching
```typescript
// Add Redis caching
import Redis from 'ioredis';
const redis = new Redis(process.env.REDIS_URL);
```

## 📞 Support

For deployment issues:
- Check logs first
- Review health endpoints
- Contact DevOps team

---

**Deployment Checklist:**
- [ ] Environment configured
- [ ] Database migrated
- [ ] SSL certificates installed
- [ ] Monitoring set up
- [ ] Backups configured
- [ ] Load balancer configured
- [ ] Health checks passing
- [ ] Logs accessible
- [ ] Alerts configured
