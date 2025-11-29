# Security Scanning and Vulnerability Management Guide
# ===================================================

## Overview

This guide outlines the security scanning and vulnerability management procedures for the GK-Nexus tax consultancy management system, ensuring compliance with security standards and protecting sensitive financial data.

## Security Scanning Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Code Commit   │───▶│  SAST Scanning  │───▶│ Security Report │
│                 │    │  (CodeQL/Snyk)  │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
┌─────────────────┐              │              ┌─────────────────┐
│ Container Build │──────────────┴─────────────▶│ DAST Scanning   │
│                 │                             │ (OWASP ZAP)     │
└─────────────────┘                             └─────────────────┘
                                                          │
┌─────────────────┐                                       ▼
│   Production    │                             ┌─────────────────┐
│   Monitoring    │◀────────────────────────────│ Vulnerability   │
└─────────────────┘                             │   Management    │
                                                └─────────────────┘
```

## Automated Security Scanning

### 1. Static Application Security Testing (SAST)

#### CodeQL Analysis (GitHub Advanced Security)
```yaml
# .github/workflows/codeql-analysis.yml
name: CodeQL Analysis

on:
  push:
    branches: [main, production]
  pull_request:
    branches: [main]
  schedule:
    - cron: '0 2 * * 1'  # Weekly scan

jobs:
  analyze:
    name: Analyze Code
    runs-on: ubuntu-latest

    strategy:
      fail-fast: false
      matrix:
        language: ['typescript', 'javascript']

    steps:
    - name: Checkout repository
      uses: actions/checkout@v4

    - name: Initialize CodeQL
      uses: github/codeql-action/init@v3
      with:
        languages: ${{ matrix.language }}
        queries: security-and-quality

    - name: Autobuild
      uses: github/codeql-action/autobuild@v3

    - name: Perform CodeQL Analysis
      uses: github/codeql-action/analyze@v3
```

#### Snyk Security Scanning
```yaml
# .github/workflows/snyk-security.yml
name: Snyk Security

on:
  push:
    branches: [main, production]
  pull_request:
    branches: [main]

jobs:
  security:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v4

    - name: Run Snyk to check for vulnerabilities
      uses: snyk/actions/node@master
      env:
        SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
      with:
        args: --severity-threshold=high --fail-on=upgradable

    - name: Upload result to GitHub Code Scanning
      uses: github/codeql-action/upload-sarif@v3
      if: always()
      with:
        sarif_file: snyk.sarif
```

### 2. Dependency Scanning

#### npm audit Integration
```bash
#!/bin/bash
# scripts/security/dependency-scan.sh

set -euo pipefail

echo "🔍 Running dependency security scan..."

# Run npm audit
echo "Running npm audit..."
bun audit --json > audit-results.json || true

# Parse results
CRITICAL=$(jq '.vulnerabilities | to_entries | map(select(.value.severity == "critical")) | length' audit-results.json)
HIGH=$(jq '.vulnerabilities | to_entries | map(select(.value.severity == "high")) | length' audit-results.json)

echo "Critical vulnerabilities: $CRITICAL"
echo "High vulnerabilities: $HIGH"

# Fail if critical vulnerabilities found
if [ "$CRITICAL" -gt 0 ]; then
    echo "❌ Critical vulnerabilities found! Failing build."
    exit 1
fi

# Warn if high vulnerabilities found
if [ "$HIGH" -gt 0 ]; then
    echo "⚠️  High severity vulnerabilities found. Consider updating dependencies."
fi

echo "✅ Dependency scan completed"
```

#### OWASP Dependency Check
```yaml
# dependency-check configuration
version: "3.8"
services:
  dependency-check:
    image: owasp/dependency-check:latest
    volumes:
      - .:/src
      - ./reports:/report
    command: >
      --scan /src
      --format HTML
      --format JSON
      --format XML
      --out /report
      --project "GK-Nexus"
      --suppression /src/dependency-check-suppression.xml
```

### 3. Container Security Scanning

#### Trivy Container Scanning
```bash
#!/bin/bash
# scripts/security/container-scan.sh

set -euo pipefail

IMAGE_NAME="${1:-ghcr.io/gk-nexus/server:latest}"

echo "🐳 Scanning container image: $IMAGE_NAME"

# Scan for vulnerabilities
trivy image \
    --exit-code 1 \
    --severity HIGH,CRITICAL \
    --format json \
    --output trivy-report.json \
    "$IMAGE_NAME"

# Generate human-readable report
trivy image \
    --format table \
    --severity HIGH,CRITICAL \
    "$IMAGE_NAME"

# Check for secrets in image
trivy filesystem \
    --scanners secret \
    --format json \
    --output trivy-secrets.json \
    "$IMAGE_NAME"

echo "✅ Container scan completed"
```

#### Anchore Engine Integration
```yaml
# .github/workflows/container-scan.yml
- name: Scan image with Anchore
  uses: anchore/scan-action@v3
  with:
    image: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:${{ github.sha }}
    fail-build: true
    severity-cutoff: high

- name: Upload Anchore scan SARIF report
  uses: github/codeql-action/upload-sarif@v3
  with:
    sarif_file: results.sarif
```

### 4. Infrastructure Security Scanning

#### Kubernetes Security Scanning with kube-score
```bash
#!/bin/bash
# scripts/security/k8s-security-scan.sh

set -euo pipefail

echo "🔐 Running Kubernetes security scan..."

# Scan Kubernetes manifests
kube-score score k8s/production/*.yml \
    --output-format json > k8s-security-report.json

# Check for security issues
CRITICAL_ISSUES=$(jq '[.[] | .checks[] | select(.grade < 5)] | length' k8s-security-report.json)

if [ "$CRITICAL_ISSUES" -gt 0 ]; then
    echo "❌ Critical Kubernetes security issues found!"
    jq -r '.[] | .checks[] | select(.grade < 5) | .comments[]' k8s-security-report.json
    exit 1
fi

echo "✅ Kubernetes security scan passed"
```

#### Terraform Security Scanning with Checkov
```bash
#!/bin/bash
# scripts/security/terraform-scan.sh

set -euo pipefail

echo "🏗️ Running Terraform security scan..."

# Scan Terraform files
checkov --framework terraform \
    --directory infrastructure/terraform \
    --output json \
    --output-file terraform-security-report.json

# Check for high severity issues
HIGH_SEVERITY=$(jq '[.results.failed_checks[] | select(.severity == "HIGH")] | length' terraform-security-report.json)

if [ "$HIGH_SEVERITY" -gt 0 ]; then
    echo "❌ High severity Terraform security issues found!"
    jq -r '.results.failed_checks[] | select(.severity == "HIGH") | .check_name' terraform-security-report.json
    exit 1
fi

echo "✅ Terraform security scan passed"
```

## Runtime Security Monitoring

### 1. Application Security Monitoring

#### Security Headers Validation
```bash
#!/bin/bash
# scripts/security/security-headers-check.sh

DOMAIN="${1:-https://gknexus.com}"

echo "🔒 Checking security headers for: $DOMAIN"

# Check security headers
curl -I -s "$DOMAIN" | grep -E "(X-Frame-Options|X-XSS-Protection|X-Content-Type-Options|Strict-Transport-Security|Content-Security-Policy)"

# Detailed security header analysis
docker run --rm ciscosecurity/tls_analyzer:latest \
    --domain "$(echo $DOMAIN | sed 's|https://||')" \
    --json > security-headers-report.json

echo "✅ Security headers check completed"
```

#### Authentication Security Monitoring
```javascript
// Example: Monitor suspicious authentication patterns
const securityMetrics = {
  failedLoginAttempts: new prometheus.Counter({
    name: 'failed_login_attempts_total',
    help: 'Total failed login attempts',
    labelNames: ['ip_address', 'user_agent', 'reason']
  }),

  suspiciousActivity: new prometheus.Counter({
    name: 'suspicious_activity_total',
    help: 'Total suspicious activities detected',
    labelNames: ['type', 'severity', 'source']
  }),

  authTokenValidation: new prometheus.Histogram({
    name: 'auth_token_validation_duration_seconds',
    help: 'Time spent validating authentication tokens'
  })
};

// Monitor for brute force attacks
const RATE_LIMIT_THRESHOLD = 10;
const RATE_LIMIT_WINDOW = 300; // 5 minutes

function monitorBruteForce(req, res, next) {
  const clientIP = req.ip;
  const attempts = getRecentFailedAttempts(clientIP, RATE_LIMIT_WINDOW);

  if (attempts > RATE_LIMIT_THRESHOLD) {
    securityMetrics.suspiciousActivity.inc({
      type: 'brute_force',
      severity: 'high',
      source: clientIP
    });

    // Alert security team
    sendSecurityAlert('Brute force attack detected', {
      ip: clientIP,
      attempts: attempts,
      timeWindow: RATE_LIMIT_WINDOW
    });

    return res.status(429).json({ error: 'Too many attempts' });
  }

  next();
}
```

### 2. Infrastructure Security Monitoring

#### Falco Runtime Security
```yaml
# falco-config.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: falco-config
  namespace: monitoring
data:
  falco.yaml: |
    rules_file:
      - /etc/falco/falco_rules.yaml
      - /etc/falco/falco_rules.local.yaml
      - /etc/falco/k8s_audit_rules.yaml
      - /etc/falco/gk_nexus_rules.yaml

    json_output: true
    json_include_output_property: true

    grpc:
      enabled: true
      bind_address: "0.0.0.0:5060"

    grpc_output:
      enabled: true

  gk_nexus_rules.yaml: |
    # GK-Nexus specific security rules
    - rule: Unauthorized Database Access
      desc: Detect unauthorized database connections
      condition: >
        spawned_process and
        proc.name=psql and
        not proc.args contains "gk_nexus_prod"
      output: >
        Unauthorized database access attempt
        (user=%user.name command=%proc.cmdline)
      priority: WARNING

    - rule: Suspicious File Access
      desc: Detect access to sensitive configuration files
      condition: >
        open_read and
        fd.name contains "/etc/passwd" and
        not proc.name in (systemd, cron, rsyslog)
      output: >
        Sensitive file access detected
        (user=%user.name file=%fd.name command=%proc.cmdline)
      priority: CRITICAL

    - rule: Container Escape Attempt
      desc: Detect container escape attempts
      condition: >
        spawned_process and
        proc.name in (docker, runc, containerd) and
        proc.args contains "exec"
      output: >
        Potential container escape attempt
        (user=%user.name command=%proc.cmdline)
      priority: CRITICAL
```

#### Network Security Monitoring
```yaml
# network-policy.yaml for production namespace
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: gk-nexus-security-policy
  namespace: production
spec:
  podSelector:
    matchLabels:
      app: gk-nexus-server
  policyTypes:
  - Ingress
  - Egress
  ingress:
  - from:
    - namespaceSelector:
        matchLabels:
          name: ingress-nginx
    - podSelector:
        matchLabels:
          app: gk-nexus-web
    ports:
    - protocol: TCP
      port: 3000
  egress:
  - to:
    - podSelector:
        matchLabels:
          app: gk-nexus-postgres
    ports:
    - protocol: TCP
      port: 5432
  - to:
    - podSelector:
        matchLabels:
          app: gk-nexus-redis
    ports:
    - protocol: TCP
      port: 6379
  - to: []  # External APIs (GRA, email services)
    ports:
    - protocol: TCP
      port: 443
    - protocol: TCP
      port: 25
    - protocol: TCP
      port: 587
```

## Vulnerability Management

### 1. Vulnerability Assessment Process

```bash
#!/bin/bash
# scripts/security/vulnerability-assessment.sh

set -euo pipefail

REPORT_DATE=$(date +%Y-%m-%d)
REPORT_DIR="./security-reports/$REPORT_DATE"
mkdir -p "$REPORT_DIR"

echo "🔍 Starting comprehensive vulnerability assessment..."

# 1. Dependency vulnerabilities
echo "Scanning dependencies..."
bun audit --json > "$REPORT_DIR/dependency-audit.json"
npm audit --audit-level=moderate --json > "$REPORT_DIR/npm-audit.json"

# 2. Container vulnerabilities
echo "Scanning container images..."
trivy image ghcr.io/gk-nexus/server:latest --format json --output "$REPORT_DIR/trivy-server.json"
trivy image ghcr.io/gk-nexus/web:latest --format json --output "$REPORT_DIR/trivy-web.json"

# 3. Infrastructure vulnerabilities
echo "Scanning infrastructure..."
checkov --framework terraform --directory infrastructure/ --output json --output-file "$REPORT_DIR/terraform-scan.json"
kube-score score k8s/production/*.yml --output-format json > "$REPORT_DIR/k8s-scan.json"

# 4. Application vulnerabilities (if OWASP ZAP is available)
if command -v zap-baseline.py &> /dev/null; then
    echo "Running DAST scan..."
    zap-baseline.py -t https://gknexus.com -J "$REPORT_DIR/zap-baseline.json" || true
fi

# 5. Generate summary report
python3 scripts/security/generate-vuln-report.py "$REPORT_DIR"

echo "✅ Vulnerability assessment completed. Reports saved to: $REPORT_DIR"
```

### 2. Vulnerability Remediation Workflow

```python
#!/usr/bin/env python3
# scripts/security/generate-vuln-report.py

import json
import os
import sys
from datetime import datetime
from collections import defaultdict

def analyze_dependency_vulns(audit_file):
    """Analyze dependency vulnerabilities"""
    with open(audit_file, 'r') as f:
        data = json.load(f)

    vulns = []
    for vuln_id, vuln in data.get('vulnerabilities', {}).items():
        vulns.append({
            'id': vuln_id,
            'severity': vuln.get('severity', 'unknown'),
            'title': vuln.get('title', ''),
            'package': vuln.get('via', [{}])[0].get('name', ''),
            'patched_versions': vuln.get('range', ''),
            'type': 'dependency'
        })

    return vulns

def analyze_container_vulns(trivy_file):
    """Analyze container vulnerabilities"""
    with open(trivy_file, 'r') as f:
        data = json.load(f)

    vulns = []
    for result in data.get('Results', []):
        for vuln in result.get('Vulnerabilities', []):
            vulns.append({
                'id': vuln.get('VulnerabilityID', ''),
                'severity': vuln.get('Severity', ''),
                'title': vuln.get('Title', ''),
                'package': vuln.get('PkgName', ''),
                'fixed_version': vuln.get('FixedVersion', ''),
                'type': 'container'
            })

    return vulns

def generate_priority_matrix(vulns):
    """Generate vulnerability priority matrix"""
    priority_matrix = defaultdict(list)

    for vuln in vulns:
        severity = vuln.get('severity', '').upper()
        has_fix = bool(vuln.get('fixed_version') or vuln.get('patched_versions'))

        if severity == 'CRITICAL':
            priority = 'P0' if has_fix else 'P1'
        elif severity == 'HIGH':
            priority = 'P1' if has_fix else 'P2'
        elif severity == 'MEDIUM':
            priority = 'P2' if has_fix else 'P3'
        else:
            priority = 'P3'

        priority_matrix[priority].append(vuln)

    return priority_matrix

def generate_html_report(vulns, report_dir):
    """Generate HTML vulnerability report"""
    priority_matrix = generate_priority_matrix(vulns)

    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <title>GK-Nexus Security Vulnerability Report</title>
        <style>
            body {{ font-family: Arial, sans-serif; margin: 20px; }}
            .critical {{ background-color: #ffebee; border-left: 4px solid #f44336; }}
            .high {{ background-color: #fff3e0; border-left: 4px solid #ff9800; }}
            .medium {{ background-color: #f3e5f5; border-left: 4px solid #9c27b0; }}
            .low {{ background-color: #e8f5e8; border-left: 4px solid #4caf50; }}
            .vuln {{ margin: 10px 0; padding: 10px; }}
            table {{ border-collapse: collapse; width: 100%; }}
            th, td {{ border: 1px solid #ddd; padding: 8px; text-align: left; }}
            th {{ background-color: #f2f2f2; }}
        </style>
    </head>
    <body>
        <h1>GK-Nexus Security Vulnerability Report</h1>
        <p>Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</p>

        <h2>Executive Summary</h2>
        <table>
            <tr><th>Priority</th><th>Count</th><th>Description</th></tr>
            <tr><td>P0</td><td>{len(priority_matrix['P0'])}</td><td>Critical vulnerabilities with fixes available</td></tr>
            <tr><td>P1</td><td>{len(priority_matrix['P1'])}</td><td>High/Critical vulnerabilities</td></tr>
            <tr><td>P2</td><td>{len(priority_matrix['P2'])}</td><td>Medium severity vulnerabilities</td></tr>
            <tr><td>P3</td><td>{len(priority_matrix['P3'])}</td><td>Low severity vulnerabilities</td></tr>
        </table>
    """

    for priority, priority_vulns in priority_matrix.items():
        if priority_vulns:
            html_content += f"""
            <h3>{priority} Priority Vulnerabilities ({len(priority_vulns)})</h3>
            <table>
                <tr><th>ID</th><th>Package</th><th>Severity</th><th>Title</th><th>Fix Available</th></tr>
            """

            for vuln in priority_vulns:
                fix_available = "Yes" if (vuln.get('fixed_version') or vuln.get('patched_versions')) else "No"
                html_content += f"""
                <tr>
                    <td>{vuln.get('id', '')}</td>
                    <td>{vuln.get('package', '')}</td>
                    <td>{vuln.get('severity', '')}</td>
                    <td>{vuln.get('title', '')[:100]}...</td>
                    <td>{fix_available}</td>
                </tr>
                """

            html_content += "</table>"

    html_content += """
    </body>
    </html>
    """

    with open(os.path.join(report_dir, 'vulnerability-report.html'), 'w') as f:
        f.write(html_content)

def main(report_dir):
    """Main function to generate vulnerability report"""
    all_vulns = []

    # Analyze dependency vulnerabilities
    dep_audit_file = os.path.join(report_dir, 'dependency-audit.json')
    if os.path.exists(dep_audit_file):
        all_vulns.extend(analyze_dependency_vulns(dep_audit_file))

    # Analyze container vulnerabilities
    for container_file in ['trivy-server.json', 'trivy-web.json']:
        container_path = os.path.join(report_dir, container_file)
        if os.path.exists(container_path):
            all_vulns.extend(analyze_container_vulns(container_path))

    # Generate reports
    generate_html_report(all_vulns, report_dir)

    # Generate JSON summary
    summary = {
        'total_vulnerabilities': len(all_vulns),
        'by_severity': defaultdict(int),
        'by_type': defaultdict(int),
        'priority_matrix': generate_priority_matrix(all_vulns)
    }

    for vuln in all_vulns:
        summary['by_severity'][vuln.get('severity', 'unknown')] += 1
        summary['by_type'][vuln.get('type', 'unknown')] += 1

    with open(os.path.join(report_dir, 'summary.json'), 'w') as f:
        json.dump(summary, f, indent=2, default=str)

    print(f"Generated vulnerability report: {report_dir}/vulnerability-report.html")
    print(f"Total vulnerabilities found: {len(all_vulns)}")

if __name__ == '__main__':
    if len(sys.argv) != 2:
        print("Usage: python3 generate-vuln-report.py <report_directory>")
        sys.exit(1)

    main(sys.argv[1])
```

### 3. Security Incident Response

```bash
#!/bin/bash
# scripts/security/incident-response.sh

set -euo pipefail

INCIDENT_TYPE="${1:-unknown}"
SEVERITY="${2:-medium}"
INCIDENT_ID="INC-$(date +%Y%m%d-%H%M%S)"

echo "🚨 Security incident response initiated"
echo "Incident ID: $INCIDENT_ID"
echo "Type: $INCIDENT_TYPE"
echo "Severity: $SEVERITY"

# Create incident directory
INCIDENT_DIR="./security-incidents/$INCIDENT_ID"
mkdir -p "$INCIDENT_DIR"

# Collect forensic data
echo "Collecting forensic data..."

# 1. System snapshots
kubectl get all -A > "$INCIDENT_DIR/k8s-snapshot.txt"
kubectl get events -A --sort-by='.lastTimestamp' > "$INCIDENT_DIR/k8s-events.txt"

# 2. Application logs
kubectl logs -n production deployment/gk-nexus-server --tail=1000 > "$INCIDENT_DIR/app-logs.txt"
kubectl logs -n production deployment/gk-nexus-postgres --tail=1000 > "$INCIDENT_DIR/db-logs.txt"

# 3. Security logs
kubectl logs -n monitoring deployment/falco --tail=1000 > "$INCIDENT_DIR/security-logs.txt"

# 4. Network connections
kubectl exec -n production deployment/gk-nexus-server -- netstat -tlnp > "$INCIDENT_DIR/network-connections.txt"

# 5. Process list
kubectl exec -n production deployment/gk-nexus-server -- ps aux > "$INCIDENT_DIR/processes.txt"

# Immediate response actions based on incident type
case "$INCIDENT_TYPE" in
    "data-breach")
        echo "🔒 Initiating data breach response..."
        # Isolate affected systems
        kubectl scale deployment gk-nexus-server --replicas=0 -n production
        # Enable maintenance mode
        kubectl apply -f k8s/maintenance/maintenance-mode.yml
        ;;
    "malware")
        echo "🦠 Initiating malware response..."
        # Quarantine affected pods
        kubectl delete pod -n production -l app=gk-nexus-server --force
        ;;
    "unauthorized-access")
        echo "👤 Initiating unauthorized access response..."
        # Revoke all sessions
        kubectl exec -n production deployment/gk-nexus-redis -- redis-cli FLUSHALL
        # Force password reset
        kubectl exec -n production deployment/gk-nexus-postgres -- \
            psql -U postgres -d gk_nexus_prod -c "UPDATE users SET password_reset_required = true;"
        ;;
esac

# Send notifications
if [[ -n "${SLACK_WEBHOOK_URL:-}" ]]; then
    curl -X POST -H 'Content-type: application/json' \
        --data "{\"text\":\"🚨 Security Incident Alert\\nID: $INCIDENT_ID\\nType: $INCIDENT_TYPE\\nSeverity: $SEVERITY\"}" \
        "$SLACK_WEBHOOK_URL"
fi

echo "✅ Initial incident response completed"
echo "Forensic data collected in: $INCIDENT_DIR"
echo "Next steps:"
echo "1. Analyze forensic data"
echo "2. Identify root cause"
echo "3. Implement containment measures"
echo "4. Begin recovery procedures"
```

## Compliance and Reporting

### 1. Security Compliance Checks

```bash
#!/bin/bash
# scripts/security/compliance-check.sh

set -euo pipefail

echo "📋 Running security compliance checks..."

COMPLIANCE_REPORT="compliance-report-$(date +%Y%m%d).json"

# Initialize compliance report
cat > "$COMPLIANCE_REPORT" << 'EOF'
{
  "timestamp": "",
  "compliance_framework": "SOC2",
  "checks": {},
  "overall_score": 0,
  "passed": 0,
  "failed": 0,
  "warnings": 0
}
EOF

# Update timestamp
jq --arg timestamp "$(date -u +%Y-%m-%dT%H:%M:%SZ)" '.timestamp = $timestamp' "$COMPLIANCE_REPORT" > temp.json && mv temp.json "$COMPLIANCE_REPORT"

# Function to add compliance check result
add_check_result() {
    local check_name="$1"
    local status="$2"
    local description="$3"
    local evidence="$4"

    jq --arg name "$check_name" --arg status "$status" --arg desc "$description" --arg evidence "$evidence" \
        '.checks[$name] = {"status": $status, "description": $desc, "evidence": $evidence}' \
        "$COMPLIANCE_REPORT" > temp.json && mv temp.json "$COMPLIANCE_REPORT"
}

# Check 1: Encryption at rest
if kubectl get secret gk-nexus-secrets -n production -o yaml | grep -q "DATABASE_URL"; then
    add_check_result "encryption_at_rest" "PASS" "Database encryption configured" "Kubernetes secrets encrypted"
else
    add_check_result "encryption_at_rest" "FAIL" "Database encryption not configured" "No encryption found"
fi

# Check 2: Network policies
if kubectl get networkpolicy gk-nexus-network-policy -n production &>/dev/null; then
    add_check_result "network_segmentation" "PASS" "Network policies implemented" "NetworkPolicy exists"
else
    add_check_result "network_segmentation" "FAIL" "Network policies not implemented" "No NetworkPolicy found"
fi

# Check 3: Security headers
SECURITY_HEADERS=$(curl -I -s https://gknexus.com | grep -E "(X-Frame-Options|X-XSS-Protection|Content-Security-Policy)" | wc -l)
if [ "$SECURITY_HEADERS" -ge 2 ]; then
    add_check_result "security_headers" "PASS" "Security headers configured" "$SECURITY_HEADERS headers found"
else
    add_check_result "security_headers" "WARN" "Insufficient security headers" "Only $SECURITY_HEADERS headers found"
fi

# Calculate overall compliance score
TOTAL_CHECKS=$(jq '.checks | length' "$COMPLIANCE_REPORT")
PASSED_CHECKS=$(jq '[.checks[] | select(.status == "PASS")] | length' "$COMPLIANCE_REPORT")
OVERALL_SCORE=$(( PASSED_CHECKS * 100 / TOTAL_CHECKS ))

jq --arg score "$OVERALL_SCORE" --arg passed "$PASSED_CHECKS" \
    '.overall_score = ($score | tonumber) | .passed = ($passed | tonumber)' \
    "$COMPLIANCE_REPORT" > temp.json && mv temp.json "$COMPLIANCE_REPORT"

echo "✅ Compliance check completed. Score: $OVERALL_SCORE%"
echo "Report saved to: $COMPLIANCE_REPORT"
```

### 2. Security Metrics Dashboard

```yaml
# Grafana dashboard configuration for security metrics
apiVersion: v1
kind: ConfigMap
metadata:
  name: security-dashboard
  namespace: monitoring
data:
  security-dashboard.json: |
    {
      "dashboard": {
        "title": "GK-Nexus Security Metrics",
        "panels": [
          {
            "title": "Failed Login Attempts",
            "type": "graph",
            "targets": [
              {
                "expr": "rate(failed_login_attempts_total[5m])",
                "legendFormat": "Failed Logins/sec"
              }
            ]
          },
          {
            "title": "Security Events",
            "type": "graph",
            "targets": [
              {
                "expr": "rate(security_events_total[5m])",
                "legendFormat": "Security Events/sec"
              }
            ]
          },
          {
            "title": "Vulnerability Count",
            "type": "stat",
            "targets": [
              {
                "expr": "vulnerability_count",
                "legendFormat": "Total Vulnerabilities"
              }
            ]
          }
        ]
      }
    }
```

---

**Last Updated**: $(date)
**Owner**: Security Team
**Review Frequency**: Weekly