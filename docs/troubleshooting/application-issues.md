# Application Troubleshooting Guide
# =================================

## Common Issues and Solutions

### Database Connection Issues

#### Symptoms
- Application returns 500 errors
- "Cannot connect to database" messages in logs
- Slow response times or timeouts

#### Diagnosis
```bash
# Check database pod status
kubectl get pods -n production | grep postgres

# Test database connectivity
kubectl exec -n production deployment/gk-nexus-postgres -- pg_isready -U postgres

# Check connection pool status
kubectl exec -n production deployment/gk-nexus-server -- \
  psql $DATABASE_URL -c "
  SELECT state, COUNT(*)
  FROM pg_stat_activity
  WHERE application_name = 'gk-nexus-server'
  GROUP BY state;
  "

# Check database logs
kubectl logs -n production deployment/gk-nexus-postgres --tail=50
```

#### Solutions
1. **Connection Pool Exhaustion**
   ```bash
   # Increase connection pool size
   kubectl patch deployment gk-nexus-server -n production \
     -p '{"spec":{"template":{"spec":{"containers":[{"name":"server","env":[{"name":"DATABASE_POOL_MAX","value":"20"}]}]}}}}'

   # Restart application to apply changes
   kubectl rollout restart deployment/gk-nexus-server -n production
   ```

2. **Database Pod Restart**
   ```bash
   # Check if database pod is stuck
   kubectl describe pod -n production -l app=gk-nexus-postgres

   # Restart database pod if needed
   kubectl delete pod -n production -l app=gk-nexus-postgres

   # Wait for pod to come back online
   kubectl wait --for=condition=ready pod -l app=gk-nexus-postgres -n production --timeout=300s
   ```

3. **Database Storage Issues**
   ```bash
   # Check storage usage
   kubectl exec -n production deployment/gk-nexus-postgres -- df -h /var/lib/postgresql/data

   # Check for disk space issues
   kubectl describe pv | grep -A 5 -B 5 "postgres"

   # Increase storage if needed
   kubectl patch pvc postgres-pvc -n production \
     -p '{"spec":{"resources":{"requests":{"storage":"50Gi"}}}}'
   ```

### Application Performance Issues

#### Symptoms
- Slow API responses
- High CPU/memory usage
- User complaints about lag

#### Diagnosis
```bash
# Check resource usage
kubectl top pods -n production

# Check application metrics
kubectl port-forward service/prometheus 9090:9090 -n monitoring &
# Visit http://localhost:9090 and query: rate(http_request_duration_seconds[5m])

# Check application logs for slow queries
kubectl logs -n production deployment/gk-nexus-server --tail=500 | grep -i "slow"

# Database performance analysis
kubectl exec -n production deployment/gk-nexus-postgres -- \
  psql -U postgres -d gk_nexus_prod -c "
  SELECT query, calls, total_time, mean_time, stddev_time
  FROM pg_stat_statements
  ORDER BY total_time DESC
  LIMIT 10;
  "
```

#### Solutions
1. **Scale Application Horizontally**
   ```bash
   # Increase replica count
   kubectl scale deployment gk-nexus-server --replicas=5 -n production

   # Verify scaling
   kubectl get pods -n production -l app=gk-nexus-server
   ```

2. **Database Query Optimization**
   ```bash
   # Analyze slow queries
   kubectl exec -n production deployment/gk-nexus-postgres -- \
     psql -U postgres -d gk_nexus_prod -c "
     EXPLAIN ANALYZE SELECT * FROM slow_query_here;
     "

   # Add missing indexes
   kubectl exec -n production deployment/gk-nexus-postgres -- \
     psql -U postgres -d gk_nexus_prod -c "
     CREATE INDEX CONCURRENTLY idx_table_column ON table_name(column_name);
     "
   ```

3. **Cache Issues**
   ```bash
   # Check Redis status
   kubectl get pods -n production | grep redis

   # Clear cache if corrupted
   kubectl exec -n production deployment/gk-nexus-redis -- redis-cli FLUSHALL

   # Check cache hit rates
   kubectl exec -n production deployment/gk-nexus-redis -- \
     redis-cli INFO stats | grep keyspace
   ```

### Authentication and Authorization Issues

#### Symptoms
- Users cannot log in
- "Unauthorized" errors
- Token expiration issues

#### Diagnosis
```bash
# Check authentication service logs
kubectl logs -n production deployment/gk-nexus-server --tail=100 | grep -i "auth"

# Test authentication endpoint
kubectl port-forward service/gk-nexus-server 8080:3000 -n production &
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"testpass"}'

# Check JWT token validation
kubectl exec -n production deployment/gk-nexus-server -- \
  node -e "console.log(require('jsonwebtoken').decode('$JWT_TOKEN'))"
```

#### Solutions
1. **JWT Secret Issues**
   ```bash
   # Verify JWT secret is set
   kubectl get secret gk-nexus-secrets -n production -o yaml | grep JWT_SECRET

   # Rotate JWT secret if compromised
   kubectl patch secret gk-nexus-secrets -n production \
     -p '{"data":{"JWT_SECRET":"'$(echo -n "new-jwt-secret" | base64)'"}}'

   # Restart application
   kubectl rollout restart deployment/gk-nexus-server -n production
   ```

2. **Session Storage Issues**
   ```bash
   # Check Redis session storage
   kubectl exec -n production deployment/gk-nexus-redis -- \
     redis-cli KEYS "session:*" | wc -l

   # Clear corrupted sessions
   kubectl exec -n production deployment/gk-nexus-redis -- \
     redis-cli EVAL "return redis.call('del', unpack(redis.call('keys', 'session:*')))" 0
   ```

### File Upload Issues

#### Symptoms
- Upload failures
- "File too large" errors
- Corrupt file uploads

#### Diagnosis
```bash
# Check upload directory permissions
kubectl exec -n production deployment/gk-nexus-server -- ls -la /tmp/uploads

# Check disk space for uploads
kubectl exec -n production deployment/gk-nexus-server -- df -h /tmp/uploads

# Check upload size limits
kubectl describe deployment gk-nexus-server -n production | grep -A 5 -B 5 FILE_UPLOAD_MAX_SIZE
```

#### Solutions
1. **Storage Space Issues**
   ```bash
   # Clean up old uploads
   kubectl exec -n production deployment/gk-nexus-server -- \
     find /tmp/uploads -type f -mtime +7 -delete

   # Increase storage allocation
   kubectl patch deployment gk-nexus-server -n production \
     -p '{"spec":{"template":{"spec":{"containers":[{"name":"server","volumeMounts":[{"name":"uploads","mountPath":"/tmp/uploads"}]}],"volumes":[{"name":"uploads","emptyDir":{"sizeLimit":"10Gi"}}]}}}}'
   ```

2. **File Size Limits**
   ```bash
   # Increase upload size limit
   kubectl patch deployment gk-nexus-server -n production \
     -p '{"spec":{"template":{"spec":{"containers":[{"name":"server","env":[{"name":"FILE_UPLOAD_MAX_SIZE","value":"52428800"}]}]}}}}'
   ```

### API Integration Issues (GRA/External Services)

#### Symptoms
- External API calls failing
- Timeout errors
- Authentication failures with GRA

#### Diagnosis
```bash
# Test external connectivity
kubectl exec -n production deployment/gk-nexus-server -- \
  curl -v https://api.gra.gov.gy/health

# Check API keys
kubectl get secret gk-nexus-secrets -n production -o yaml | grep GRA_API_KEY

# Check application logs for API errors
kubectl logs -n production deployment/gk-nexus-server --tail=100 | grep -i "gra\|api"
```

#### Solutions
1. **Network Connectivity Issues**
   ```bash
   # Check egress network policy
   kubectl describe networkpolicy gk-nexus-network-policy -n production

   # Test DNS resolution
   kubectl exec -n production deployment/gk-nexus-server -- \
     nslookup api.gra.gov.gy
   ```

2. **API Key Rotation**
   ```bash
   # Update API keys
   kubectl patch secret gk-nexus-secrets -n production \
     -p '{"data":{"GRA_API_KEY":"'$(echo -n "new-api-key" | base64)'"}}'

   # Restart to pick up new keys
   kubectl rollout restart deployment/gk-nexus-server -n production
   ```

## Emergency Procedures

### Application Unresponsive

```bash
# Immediate steps
1. Check if pods are running
kubectl get pods -n production

2. Check resource usage
kubectl top pods -n production

3. Check recent events
kubectl get events -n production --sort-by='.lastTimestamp' | tail -20

4. If pods are stuck, force restart
kubectl delete pod -n production -l app=gk-nexus-server --force --grace-period=0

5. Scale to ensure availability
kubectl scale deployment gk-nexus-server --replicas=3 -n production
```

### Memory Leaks

```bash
# Identify memory-consuming pods
kubectl top pods -n production --sort-by=memory

# Check memory limits
kubectl describe pod -n production $(kubectl get pods -n production -l app=gk-nexus-server -o name | head -1)

# Restart high-memory pods
kubectl delete pod -n production -l app=gk-nexus-server --field-selector='status.phase=Running'

# Set memory limits if not present
kubectl patch deployment gk-nexus-server -n production \
  -p '{"spec":{"template":{"spec":{"containers":[{"name":"server","resources":{"limits":{"memory":"1Gi"},"requests":{"memory":"512Mi"}}}]}}}}'
```

### Database Locks

```bash
# Identify blocking queries
kubectl exec -n production deployment/gk-nexus-postgres -- \
  psql -U postgres -d gk_nexus_prod -c "
  SELECT blocked_locks.pid AS blocked_pid,
         blocked_activity.usename AS blocked_user,
         blocking_locks.pid AS blocking_pid,
         blocking_activity.usename AS blocking_user,
         blocked_activity.query AS blocked_statement,
         blocking_activity.query AS current_statement_in_blocking_process
  FROM pg_catalog.pg_locks blocked_locks
  JOIN pg_catalog.pg_stat_activity blocked_activity ON blocked_activity.pid = blocked_locks.pid
  JOIN pg_catalog.pg_locks blocking_locks ON(blocking_locks.locktype = blocked_locks.locktype
    AND blocking_locks.database IS NOT DISTINCT FROM blocked_locks.database
    AND blocking_locks.relation IS NOT DISTINCT FROM blocked_locks.relation
    AND blocking_locks.page IS NOT DISTINCT FROM blocked_locks.page
    AND blocking_locks.tuple IS NOT DISTINCT FROM blocked_locks.tuple
    AND blocking_locks.virtualxid IS NOT DISTINCT FROM blocked_locks.virtualxid
    AND blocking_locks.transactionid IS NOT DISTINCT FROM blocked_locks.transactionid
    AND blocking_locks.classid IS NOT DISTINCT FROM blocked_locks.classid
    AND blocking_locks.objid IS NOT DISTINCT FROM blocked_locks.objid
    AND blocking_locks.objsubid IS NOT DISTINCT FROM blocked_locks.objsubid
    AND blocking_locks.pid != blocked_locks.pid)
  JOIN pg_catalog.pg_stat_activity blocking_activity ON blocking_activity.pid = blocking_locks.pid
  WHERE NOT blocked_locks.granted;
  "

# Kill blocking queries if necessary (use carefully)
kubectl exec -n production deployment/gk-nexus-postgres -- \
  psql -U postgres -d gk_nexus_prod -c "SELECT pg_terminate_backend(PID);"
```

## Monitoring and Alerting

### Key Metrics to Monitor

1. **Application Health**
   - HTTP response times
   - Error rates
   - Request throughput

2. **Database Performance**
   - Query execution times
   - Connection pool usage
   - Lock waits

3. **Infrastructure**
   - CPU and memory usage
   - Disk space
   - Network connectivity

### Alert Configuration

```yaml
# Example alert rules
groups:
- name: gk-nexus-critical
  rules:
  - alert: ApplicationDown
    expr: up{job="gk-nexus-server"} == 0
    for: 1m
    labels:
      severity: critical
    annotations:
      summary: "Application is down"

  - alert: HighErrorRate
    expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.1
    for: 5m
    labels:
      severity: warning
    annotations:
      summary: "High error rate detected"
```

## Escalation Procedures

### Level 1: DevOps Engineer
- Response time: 15 minutes
- Actions: Basic troubleshooting, service restarts
- Escalate if: Issue not resolved in 30 minutes

### Level 2: Senior Engineer/Tech Lead
- Response time: 30 minutes
- Actions: Advanced troubleshooting, database issues
- Escalate if: Issue not resolved in 1 hour

### Level 3: Engineering Manager
- Response time: 1 hour
- Actions: Coordinate team response, customer communication
- Escalate if: Major outage or data loss

### Level 4: CTO/Executive
- Response time: 2 hours
- Actions: Executive decision making, external communication

---

**Last Updated**: $(date)
**Owner**: DevOps Team
**Review Frequency**: Monthly