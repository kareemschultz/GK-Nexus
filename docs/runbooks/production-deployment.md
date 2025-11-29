# Production Deployment Runbook
# ==============================

## Overview

This runbook provides step-by-step procedures for deploying the GK-Nexus application to production. It covers both regular deployments and emergency rollbacks.

## Prerequisites

### Access Requirements
- AWS CLI configured with production account access
- kubectl configured for production cluster
- Docker registry access (GHCR)
- Kubernetes namespace: `production`

### Pre-deployment Checklist
- [ ] All tests passing in CI/CD pipeline
- [ ] Security scans completed successfully
- [ ] Database migrations reviewed and tested
- [ ] Backup completed within last 4 hours
- [ ] Deployment window approved
- [ ] Rollback plan prepared

## Standard Deployment Process

### 1. Pre-deployment Verification

```bash
# Verify cluster health
kubectl get nodes
kubectl get pods -n production --field-selector=status.phase!=Running

# Check current application version
kubectl get deployment gk-nexus-server -n production -o jsonpath='{.spec.template.spec.containers[0].image}'

# Verify monitoring systems
kubectl get pods -n monitoring

# Check database health
kubectl exec -n production deployment/gk-nexus-postgres -- pg_isready -U postgres
```

### 2. Database Migration (if required)

```bash
# Create database backup before migration
kubectl exec -n production deployment/gk-nexus-postgres -- \
  pg_dump -U postgres -h localhost -d gk_nexus_prod > /tmp/pre-migration-backup.sql

# Run migrations
kubectl exec -n production deployment/gk-nexus-server -- \
  bun run db:migrate

# Verify migration success
kubectl logs -n production deployment/gk-nexus-server --tail=50
```

### 3. Application Deployment

```bash
# Update deployment with new image
kubectl set image deployment/gk-nexus-server server=ghcr.io/gk-nexus/server:v1.2.3 -n production
kubectl set image deployment/gk-nexus-web web=ghcr.io/gk-nexus/web:v1.2.3 -n production

# Monitor rollout
kubectl rollout status deployment/gk-nexus-server -n production --timeout=300s
kubectl rollout status deployment/gk-nexus-web -n production --timeout=300s

# Verify new pods are running
kubectl get pods -n production -l app=gk-nexus-server
kubectl get pods -n production -l app=gk-nexus-web
```

### 4. Post-deployment Verification

```bash
# Health check endpoints
kubectl port-forward service/gk-nexus-server 8080:3000 -n production &
curl -f http://localhost:8080/ || echo "Health check failed"

# Test critical endpoints
curl -f http://localhost:8080/api/health
curl -f http://localhost:8080/rpc/ping

# Check application logs for errors
kubectl logs -n production deployment/gk-nexus-server --tail=100 | grep -i error

# Verify database connectivity
kubectl exec -n production deployment/gk-nexus-server -- \
  psql $DATABASE_URL -c "SELECT COUNT(*) FROM users;"
```

### 5. Monitoring and Alerts

```bash
# Check Grafana dashboards
open https://grafana.gknexus.com/d/gk-nexus-overview

# Verify Prometheus targets
kubectl port-forward service/prometheus 9090:9090 -n monitoring &
open http://localhost:9090/targets

# Test alerting
curl -X POST http://localhost:9093/api/v1/alerts \
  -H "Content-Type: application/json" \
  -d '{"status":"firing","alerts":[{"labels":{"alertname":"TestAlert"}}]}'
```

## Blue-Green Deployment

### Setup Blue-Green Environment

```bash
# Create blue environment (current production)
kubectl label namespace production environment=blue

# Create green environment
kubectl create namespace production-green
kubectl label namespace production-green environment=green

# Copy secrets and configs to green environment
kubectl get secret gk-nexus-secrets -n production -o yaml | \
  sed 's/namespace: production/namespace: production-green/' | \
  kubectl apply -f -

kubectl get configmap gk-nexus-config -n production -o yaml | \
  sed 's/namespace: production/namespace: production-green/' | \
  kubectl apply -f -
```

### Deploy to Green Environment

```bash
# Deploy new version to green environment
kubectl apply -f k8s/production/ -n production-green

# Update image tags for green deployment
kubectl set image deployment/gk-nexus-server server=ghcr.io/gk-nexus/server:v1.2.3 -n production-green
kubectl set image deployment/gk-nexus-web web=ghcr.io/gk-nexus/web:v1.2.3 -n production-green

# Wait for green environment to be ready
kubectl rollout status deployment/gk-nexus-server -n production-green
kubectl rollout status deployment/gk-nexus-web -n production-green
```

### Switch Traffic to Green

```bash
# Test green environment
kubectl port-forward service/gk-nexus-server 8081:3000 -n production-green &
curl -f http://localhost:8081/

# Switch ingress to green environment
kubectl patch ingress gk-nexus-ingress -n production \
  -p '{"spec":{"rules":[{"host":"gknexus.com","http":{"paths":[{"path":"/","pathType":"Prefix","backend":{"service":{"name":"gk-nexus-web","port":{"number":80}},"namespace":"production-green"}}]}}]}}'

# Monitor for issues
kubectl logs -n production-green deployment/gk-nexus-server --tail=100 -f
```

## Emergency Rollback

### Quick Rollback (Kubernetes)

```bash
# Rollback to previous deployment
kubectl rollout undo deployment/gk-nexus-server -n production
kubectl rollout undo deployment/gk-nexus-web -n production

# Verify rollback
kubectl rollout status deployment/gk-nexus-server -n production
kubectl get pods -n production
```

### Database Rollback

```bash
# If database changes need to be reverted
kubectl exec -n production deployment/gk-nexus-postgres -- \
  psql -U postgres -d gk_nexus_prod -c "
  -- Run specific rollback commands
  DROP TABLE IF EXISTS new_table;
  ALTER TABLE existing_table DROP COLUMN IF EXISTS new_column;
  "

# Or restore from backup if major changes
./scripts/backup/restore-database.sh \
  --backup-file /backups/pre-deployment-backup.sql \
  --target-db gk_nexus_prod \
  --force
```

### Full Environment Rollback

```bash
# Switch back to blue environment
kubectl patch ingress gk-nexus-ingress -n production \
  -p '{"spec":{"rules":[{"host":"gknexus.com","http":{"paths":[{"path":"/","pathType":"Prefix","backend":{"service":{"name":"gk-nexus-web","port":{"number":80}}}}]}}]}}'

# Clean up green environment
kubectl delete namespace production-green

# Verify blue environment health
kubectl get pods -n production
```

## Troubleshooting Common Issues

### Deployment Stuck

```bash
# Check deployment status
kubectl describe deployment gk-nexus-server -n production

# Check pod events
kubectl get events -n production --sort-by='.lastTimestamp' | tail -20

# Check resource limits
kubectl top pods -n production
kubectl describe nodes
```

### Image Pull Errors

```bash
# Check image availability
docker manifest inspect ghcr.io/gk-nexus/server:v1.2.3

# Verify image pull secrets
kubectl get secrets -n production | grep regcred
kubectl describe secret regcred -n production

# Update image pull secret if needed
kubectl create secret docker-registry regcred \
  --docker-server=ghcr.io \
  --docker-username=$GITHUB_USERNAME \
  --docker-password=$GITHUB_TOKEN \
  --namespace=production
```

### Database Connection Issues

```bash
# Check database pod status
kubectl get pods -n production | grep postgres

# Test database connectivity
kubectl exec -n production deployment/gk-nexus-postgres -- \
  pg_isready -U postgres

# Check database logs
kubectl logs -n production deployment/gk-nexus-postgres --tail=50

# Verify connection string
kubectl get secret gk-nexus-secrets -n production -o yaml | \
  grep DATABASE_URL | base64 -d
```

## Performance Optimization

### Scaling Applications

```bash
# Scale server horizontally
kubectl scale deployment gk-nexus-server --replicas=5 -n production

# Scale web frontend
kubectl scale deployment gk-nexus-web --replicas=3 -n production

# Configure HPA if not already done
kubectl apply -f k8s/production/server-deployment.yml

# Monitor scaling
kubectl get hpa -n production -w
```

### Database Performance

```bash
# Check database performance
kubectl exec -n production deployment/gk-nexus-postgres -- \
  psql -U postgres -d gk_nexus_prod -c "
  SELECT query, calls, total_time, mean_time
  FROM pg_stat_statements
  ORDER BY total_time DESC
  LIMIT 10;
  "

# Check active connections
kubectl exec -n production deployment/gk-nexus-postgres -- \
  psql -U postgres -d gk_nexus_prod -c "
  SELECT state, COUNT(*)
  FROM pg_stat_activity
  WHERE state IS NOT NULL
  GROUP BY state;
  "

# Optimize if needed
kubectl exec -n production deployment/gk-nexus-postgres -- \
  psql -U postgres -d gk_nexus_prod -c "VACUUM ANALYZE;"
```

## Security Considerations

### Certificate Management

```bash
# Check certificate expiry
kubectl get certificate -n production
openssl x509 -in /etc/ssl/certs/gknexus.crt -text -noout | grep "Not After"

# Renew certificate if needed
kubectl delete certificate gk-nexus-tls -n production
kubectl apply -f k8s/production/certificate.yml
```

### Secret Rotation

```bash
# Rotate database password
kubectl patch secret gk-nexus-secrets -n production \
  -p '{"data":{"POSTGRES_PASSWORD":"'$(echo -n "new-password" | base64)'"}}'

# Restart pods to pick up new secret
kubectl rollout restart deployment/gk-nexus-server -n production
kubectl rollout restart deployment/gk-nexus-postgres -n production
```

## Maintenance Procedures

### Planned Maintenance

```bash
# Enable maintenance mode
kubectl apply -f k8s/maintenance/maintenance-mode.yml

# Perform maintenance tasks
# ... maintenance operations ...

# Disable maintenance mode
kubectl delete -f k8s/maintenance/maintenance-mode.yml
```

### Log Rotation

```bash
# Check log sizes
kubectl exec -n production deployment/gk-nexus-server -- \
  du -sh /app/logs/*

# Rotate logs if needed
kubectl exec -n production deployment/gk-nexus-server -- \
  logrotate /etc/logrotate.conf
```

## Documentation and Communication

### Deployment Notification

```bash
# Send Slack notification
curl -X POST -H 'Content-type: application/json' \
  --data '{"text":"🚀 GK-Nexus v1.2.3 deployed to production successfully"}' \
  $SLACK_WEBHOOK_URL

# Update status page
curl -X POST https://api.statuspage.io/v1/pages/PAGE_ID/incidents \
  -H "Authorization: OAuth $STATUSPAGE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"incident":{"name":"Scheduled Deployment","status":"resolved"}}'
```

### Post-deployment Report

```bash
# Generate deployment report
cat > deployment-report.md << EOF
# Deployment Report - $(date)

## Version
- Previous: $(kubectl get deployment gk-nexus-server -n production -o jsonpath='{.metadata.annotations.deployment\.kubernetes\.io/revision}')
- Current: v1.2.3

## Changes
- Feature: Enhanced tax calculation engine
- Fix: Improved error handling for GRA integration
- Performance: Optimized database queries

## Metrics
- Deployment time: 15 minutes
- Downtime: 0 seconds (zero-downtime deployment)
- Tests passed: 156/156
- Security scans: Clean

## Rollback Plan
- Available: Yes
- Estimated time: 5 minutes
- Database changes: Backward compatible
EOF
```

---

**Last Updated**: $(date)
**Owner**: DevOps Team
**Review Frequency**: Monthly