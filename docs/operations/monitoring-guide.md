# Monitoring and Observability Guide
# ==================================

## Overview

This guide covers the monitoring and observability setup for GK-Nexus, including metrics collection, alerting, logging, and performance monitoring for the tax consultancy management system.

## Monitoring Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Application   │───▶│   Prometheus    │───▶│    Grafana      │
│     Metrics     │    │   (Metrics)     │    │  (Dashboards)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
┌─────────────────┐              │              ┌─────────────────┐
│  Infrastructure │──────────────┴─────────────▶│  AlertManager   │
│     Metrics     │                             │   (Alerting)    │
└─────────────────┘                             └─────────────────┘
                                                          │
┌─────────────────┐                                       ▼
│      Logs       │                             ┌─────────────────┐
│   (ELK Stack)   │                             │ Slack/Email/PD  │
└─────────────────┘                             │ (Notifications) │
                                                └─────────────────┘
```

## Accessing Monitoring Systems

### Grafana Dashboards
```bash
# Access Grafana (port-forward for development)
kubectl port-forward service/grafana 3000:3000 -n monitoring
# Visit: http://localhost:3000
# Default credentials: admin / (check secret)

# Production access
# Visit: https://grafana.gknexus.com
```

### Prometheus Metrics
```bash
# Access Prometheus directly
kubectl port-forward service/prometheus 9090:9090 -n monitoring
# Visit: http://localhost:9090

# Check targets health
curl http://localhost:9090/api/v1/targets | jq '.data.activeTargets[] | select(.health != "up")'
```

### AlertManager
```bash
# Access AlertManager
kubectl port-forward service/alertmanager 9093:9093 -n monitoring
# Visit: http://localhost:9093

# Check active alerts
curl http://localhost:9093/api/v1/alerts | jq '.data[]'
```

## Key Dashboards

### 1. Application Overview Dashboard
**Panels:**
- Request rate and response time
- Error rate and success rate
- Active users and sessions
- Database connection pool status

**Key Metrics:**
```promql
# Request rate
rate(http_requests_total[5m])

# Average response time
rate(http_request_duration_seconds_sum[5m]) / rate(http_request_duration_seconds_count[5m])

# Error rate
rate(http_requests_total{status=~"5.."}[5m]) / rate(http_requests_total[5m])

# Active database connections
pg_stat_database_numbackends
```

### 2. Infrastructure Dashboard
**Panels:**
- CPU and memory usage
- Disk space and I/O
- Network traffic
- Pod status and restarts

**Key Metrics:**
```promql
# CPU usage
rate(container_cpu_usage_seconds_total[5m])

# Memory usage
container_memory_working_set_bytes / container_spec_memory_limit_bytes

# Disk usage
(node_filesystem_size_bytes - node_filesystem_free_bytes) / node_filesystem_size_bytes

# Pod restarts
kube_pod_container_status_restarts_total
```

### 3. Database Performance Dashboard
**Panels:**
- Query performance
- Connection metrics
- Lock information
- Storage usage

**Key Metrics:**
```promql
# Query execution time
pg_stat_statements_mean_time_seconds

# Active connections
pg_stat_activity_count

# Database size
pg_database_size_bytes

# Lock waits
pg_stat_database_conflicts_total
```

### 4. Business Metrics Dashboard
**Panels:**
- User registrations
- Tax calculations processed
- Document uploads
- GRA API integration status

**Key Metrics:**
```promql
# User registrations
increase(user_registrations_total[1h])

# Tax calculations
rate(tax_calculations_total[5m])

# Document uploads
rate(document_uploads_total[5m])

# External API calls
rate(external_api_calls_total[5m])
```

## Alert Configuration

### Critical Alerts

#### Application Down
```yaml
- alert: ApplicationDown
  expr: up{job="gk-nexus-server"} == 0
  for: 1m
  labels:
    severity: critical
    team: devops
  annotations:
    summary: "GK-Nexus application is down"
    description: "Application instance {{ $labels.instance }} has been down for more than 1 minute"
    runbook: "https://docs.gknexus.com/runbooks/application-down"
```

#### High Error Rate
```yaml
- alert: HighErrorRate
  expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.1
  for: 5m
  labels:
    severity: critical
    team: engineering
  annotations:
    summary: "High error rate detected"
    description: "Error rate is {{ $value }} errors per second over the last 5 minutes"
```

#### Database Issues
```yaml
- alert: DatabaseDown
  expr: up{job="postgres-exporter"} == 0
  for: 1m
  labels:
    severity: critical
    team: dba
  annotations:
    summary: "PostgreSQL database is down"
    description: "Database has been unreachable for more than 1 minute"

- alert: HighDatabaseConnections
  expr: pg_stat_database_numbackends / pg_settings_max_connections > 0.8
  for: 5m
  labels:
    severity: warning
    team: dba
  annotations:
    summary: "Database connection usage is high"
    description: "Database connection usage is at {{ $value | humanizePercentage }}"
```

### Warning Alerts

#### Performance Issues
```yaml
- alert: HighResponseTime
  expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 2
  for: 10m
  labels:
    severity: warning
    team: engineering
  annotations:
    summary: "High response time detected"
    description: "95th percentile response time is {{ $value }}s"

- alert: HighCPUUsage
  expr: rate(container_cpu_usage_seconds_total[5m]) > 0.8
  for: 15m
  labels:
    severity: warning
    team: devops
  annotations:
    summary: "High CPU usage detected"
    description: "CPU usage is {{ $value | humanizePercentage }} on {{ $labels.pod }}"
```

#### Storage Issues
```yaml
- alert: LowDiskSpace
  expr: (node_filesystem_size_bytes - node_filesystem_free_bytes) / node_filesystem_size_bytes > 0.8
  for: 5m
  labels:
    severity: warning
    team: devops
  annotations:
    summary: "Low disk space"
    description: "Disk usage is {{ $value | humanizePercentage }} on {{ $labels.instance }}"

- alert: DatabaseStorageGrowth
  expr: increase(pg_database_size_bytes[1h]) > 1073741824  # 1GB
  for: 0m
  labels:
    severity: warning
    team: dba
  annotations:
    summary: "Rapid database growth detected"
    description: "Database has grown by {{ $value | humanize1024 }}B in the last hour"
```

### Business Alerts

#### User Experience
```yaml
- alert: LowLoginSuccessRate
  expr: rate(login_attempts_total{status="success"}[10m]) / rate(login_attempts_total[10m]) < 0.8
  for: 5m
  labels:
    severity: warning
    team: product
  annotations:
    summary: "Low login success rate"
    description: "Login success rate is {{ $value | humanizePercentage }}"

- alert: HighFailedLogins
  expr: rate(login_attempts_total{status="failed"}[5m]) > 5
  for: 2m
  labels:
    severity: warning
    team: security
  annotations:
    summary: "High failed login attempts"
    description: "Failed login rate is {{ $value }} attempts per second - possible brute force attack"
```

#### Integration Issues
```yaml
- alert: GRAIntegrationFailure
  expr: rate(gra_api_calls_total{status="error"}[5m]) > 0.1
  for: 3m
  labels:
    severity: warning
    team: integration
  annotations:
    summary: "GRA API integration issues"
    description: "GRA API error rate is {{ $value }} errors per second"

- alert: TaxCalculationErrors
  expr: rate(tax_calculations_total{status="error"}[5m]) > 0.05
  for: 5m
  labels:
    severity: critical
    team: business
  annotations:
    summary: "Tax calculation errors detected"
    description: "Tax calculation error rate is {{ $value }} errors per second"
```

## Log Monitoring

### Application Logs
```bash
# View real-time application logs
kubectl logs -f deployment/gk-nexus-server -n production

# Search for errors in logs
kubectl logs deployment/gk-nexus-server -n production --tail=1000 | grep -i error

# Check specific error patterns
kubectl logs deployment/gk-nexus-server -n production --since=1h | grep -E "(database|connection|timeout)"
```

### Structured Logging Queries
```bash
# Query logs using jq for JSON logs
kubectl logs deployment/gk-nexus-server -n production --tail=100 | \
  jq 'select(.level == "error") | {timestamp: .timestamp, message: .message, error: .error}'

# Count errors by type
kubectl logs deployment/gk-nexus-server -n production --since=1h | \
  jq -r '.error.type // "unknown"' | sort | uniq -c
```

### Log Aggregation with ELK Stack
```bash
# If ELK stack is deployed, query Elasticsearch
curl -X GET "elasticsearch:9200/gk-nexus-logs-*/_search" -H 'Content-Type: application/json' -d'
{
  "query": {
    "bool": {
      "must": [
        {"range": {"@timestamp": {"gte": "now-1h"}}},
        {"term": {"level": "error"}}
      ]
    }
  },
  "sort": [{"@timestamp": {"order": "desc"}}],
  "size": 100
}'
```

## Performance Monitoring

### Application Performance

#### Response Time Analysis
```promql
# Average response time by endpoint
avg(rate(http_request_duration_seconds_sum[5m])) by (method, route) /
avg(rate(http_request_duration_seconds_count[5m])) by (method, route)

# 95th percentile response time
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))

# Response time trend over time
avg_over_time(
  rate(http_request_duration_seconds_sum[5m])[1h:5m] /
  rate(http_request_duration_seconds_count[5m])[1h:5m]
)
```

#### Throughput Analysis
```promql
# Requests per second
rate(http_requests_total[5m])

# Peak throughput in the last 24 hours
max_over_time(rate(http_requests_total[5m])[24h])

# Throughput by status code
sum(rate(http_requests_total[5m])) by (status)
```

### Database Performance

#### Query Performance
```sql
-- Slow queries (run in PostgreSQL)
SELECT query, calls, total_time, mean_time, stddev_time
FROM pg_stat_statements
WHERE mean_time > 100  -- queries taking more than 100ms on average
ORDER BY total_time DESC
LIMIT 20;

-- Lock analysis
SELECT blocked_locks.pid AS blocked_pid,
       blocked_activity.usename AS blocked_user,
       blocking_locks.pid AS blocking_pid,
       blocking_activity.usename AS blocking_user,
       blocked_activity.query AS blocked_statement,
       blocking_activity.query AS current_statement_in_blocking_process
FROM pg_catalog.pg_locks blocked_locks
JOIN pg_catalog.pg_stat_activity blocked_activity ON blocked_activity.pid = blocked_locks.pid
JOIN pg_catalog.pg_locks blocking_locks ON blocking_locks.locktype = blocked_locks.locktype
WHERE NOT blocked_locks.granted;
```

#### Connection Monitoring
```promql
# Database connections
pg_stat_database_numbackends

# Connection pool utilization
(pg_stat_database_numbackends / pg_settings_max_connections) * 100

# Idle connections
pg_stat_activity_count{state="idle"}
```

## Custom Metrics

### Business Metrics Collection

#### User Activity
```typescript
// Example: Custom metrics in application code
import { Counter, Histogram, Gauge } from 'prom-client';

const userRegistrations = new Counter({
  name: 'user_registrations_total',
  help: 'Total number of user registrations',
  labelNames: ['source', 'user_type']
});

const taxCalculationDuration = new Histogram({
  name: 'tax_calculation_duration_seconds',
  help: 'Time spent on tax calculations',
  labelNames: ['calculation_type', 'complexity']
});

const activeUsers = new Gauge({
  name: 'active_users_count',
  help: 'Number of currently active users',
  labelNames: ['session_type']
});
```

#### Financial Metrics
```typescript
const documentUploads = new Counter({
  name: 'document_uploads_total',
  help: 'Total number of document uploads',
  labelNames: ['document_type', 'status']
});

const clientCount = new Gauge({
  name: 'client_count_total',
  help: 'Total number of clients in system',
  labelNames: ['client_type', 'status']
});

const revenueCalculated = new Counter({
  name: 'revenue_calculated_gyd',
  help: 'Total revenue calculated in GYD',
  labelNames: ['tax_type', 'period']
});
```

## Health Checks

### Application Health Endpoints
```bash
# Basic health check
curl -f http://localhost:3000/health

# Detailed health check with dependencies
curl http://localhost:3000/health/detailed

# Database health check
curl http://localhost:3000/health/database

# External dependencies health
curl http://localhost:3000/health/dependencies
```

### Kubernetes Health Checks
```yaml
# Liveness probe
livenessProbe:
  httpGet:
    path: /health
    port: 3000
  initialDelaySeconds: 30
  periodSeconds: 30
  timeoutSeconds: 10
  failureThreshold: 3

# Readiness probe
readinessProbe:
  httpGet:
    path: /health/ready
    port: 3000
  initialDelaySeconds: 5
  periodSeconds: 5
  timeoutSeconds: 3
  failureThreshold: 3
```

## Troubleshooting Monitoring Issues

### Prometheus Not Collecting Metrics
```bash
# Check Prometheus configuration
kubectl get configmap prometheus-config -n monitoring -o yaml

# Verify service discovery
kubectl get endpoints -n production

# Check if metrics endpoint is accessible
kubectl port-forward service/gk-nexus-server 8080:3000 -n production
curl http://localhost:8080/metrics
```

### Grafana Dashboard Issues
```bash
# Check Grafana logs
kubectl logs deployment/grafana -n monitoring --tail=50

# Verify data source configuration
kubectl port-forward service/grafana 3000:3000 -n monitoring
# Go to Configuration -> Data Sources

# Test Prometheus connectivity
curl http://prometheus:9090/api/v1/label/__name__/values
```

### Alert Not Firing
```bash
# Check alert rule syntax
kubectl get prometheusrule -n monitoring -o yaml

# Verify alertmanager configuration
kubectl get configmap alertmanager-config -n monitoring -o yaml

# Test alert rule manually in Prometheus UI
# Query: ALERTS{alertname="YourAlertName"}
```

---

**Last Updated**: $(date)
**Owner**: DevOps Team
**Review Frequency**: Monthly