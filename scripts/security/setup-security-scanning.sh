#!/bin/bash
# =============================================================================
# GK-Nexus Security Scanning Setup Script
# =============================================================================
#
# This script sets up comprehensive security scanning for the GK-Nexus
# production environment, including vulnerability scanning, compliance
# monitoring, and security automation.

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
NAMESPACE_PRODUCTION="production"
NAMESPACE_MONITORING="monitoring"
NAMESPACE_SECURITY="security"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    local level="$1"
    shift
    local message="$*"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')

    case "$level" in
        ERROR)
            echo -e "${RED}${timestamp} [${level}] ${message}${NC}" >&2
            ;;
        WARN)
            echo -e "${YELLOW}${timestamp} [${level}] ${message}${NC}"
            ;;
        INFO)
            echo -e "${GREEN}${timestamp} [${level}] ${message}${NC}"
            ;;
        DEBUG)
            echo -e "${BLUE}${timestamp} [${level}] ${message}${NC}"
            ;;
    esac
}

# Error handler
error_exit() {
    log "ERROR" "$1"
    exit 1
}

# Check prerequisites
check_prerequisites() {
    log "INFO" "Checking prerequisites..."

    # Check if kubectl is available and configured
    if ! command -v kubectl &> /dev/null; then
        error_exit "kubectl is not installed or not in PATH"
    fi

    # Check cluster connectivity
    if ! kubectl cluster-info &> /dev/null; then
        error_exit "Cannot connect to Kubernetes cluster"
    fi

    # Check if required tools are available
    local tools=("helm" "docker" "curl" "jq")
    for tool in "${tools[@]}"; do
        if ! command -v "$tool" &> /dev/null; then
            log "WARN" "$tool is not installed - some features may not work"
        fi
    done

    log "INFO" "Prerequisites check completed"
}

# Create security namespace
create_security_namespace() {
    log "INFO" "Creating security namespace..."

    kubectl create namespace "$NAMESPACE_SECURITY" --dry-run=client -o yaml | kubectl apply -f -

    # Label namespace for security tools
    kubectl label namespace "$NAMESPACE_SECURITY" \
        security=enabled \
        monitoring=enabled \
        --overwrite

    log "INFO" "Security namespace created and configured"
}

# Setup Falco for runtime security monitoring
setup_falco() {
    log "INFO" "Setting up Falco runtime security monitoring..."

    # Add Falco Helm repository
    helm repo add falcosecurity https://falcosecurity.github.io/charts
    helm repo update

    # Create Falco configuration
    cat > /tmp/falco-values.yaml << 'EOF'
falco:
  grpc:
    enabled: true
    bind_address: "0.0.0.0"
    listen_port: 5060

  json_output: true
  json_include_output_property: true

  syscall_event_drops:
    actions:
      - log
      - alert

  priority: debug

  rules_file:
    - /etc/falco/falco_rules.yaml
    - /etc/falco/falco_rules.local.yaml
    - /etc/falco/k8s_audit_rules.yaml

falcoctl:
  config:
    artifact:
      install:
        enabled: true
      follow:
        enabled: true
    indexes:
      - name: falcosecurity
        url: https://falcosecurity.github.io/falcoctl/index.yaml

driver:
  kind: ebpf

tty: true

falcosidekick:
  enabled: true
  config:
    webhook:
      address: http://webhook-receiver:8080/falco
    slack:
      webhookurl: "${SLACK_WEBHOOK_URL:-}"
      channel: "#security-alerts"
      username: "Falco"
      iconurl: "https://falco.org/img/favicon.ico"
    elasticsearch:
      hostport: "http://elasticsearch:9200"

resources:
  requests:
    memory: "512Mi"
    cpu: "100m"
  limits:
    memory: "1Gi"
    cpu: "200m"
EOF

    # Install Falco
    helm upgrade --install falco falcosecurity/falco \
        --namespace "$NAMESPACE_SECURITY" \
        --values /tmp/falco-values.yaml

    # Wait for Falco to be ready
    kubectl wait --for=condition=ready pod -l app.kubernetes.io/name=falco -n "$NAMESPACE_SECURITY" --timeout=300s

    log "INFO" "Falco runtime security monitoring configured"
}

# Setup Trivy Operator for vulnerability scanning
setup_trivy_operator() {
    log "INFO" "Setting up Trivy Operator for vulnerability scanning..."

    # Add Trivy Operator Helm repository
    helm repo add aqua https://aquasecurity.github.io/helm-charts/
    helm repo update

    # Create Trivy Operator configuration
    cat > /tmp/trivy-operator-values.yaml << 'EOF'
operator:
  replicas: 1
  resources:
    requests:
      memory: "256Mi"
      cpu: "100m"
    limits:
      memory: "512Mi"
      cpu: "200m"

trivy:
  ignoreUnfixed: false
  severity: CRITICAL,HIGH,MEDIUM
  slow: true
  resources:
    requests:
      memory: "512Mi"
      cpu: "200m"
    limits:
      memory: "1Gi"
      cpu: "500m"

compliance:
  cron: "0 2 * * *"  # Run compliance scans daily at 2 AM

serviceMonitor:
  enabled: true
  namespace: monitoring

nodeCollector:
  resources:
    requests:
      memory: "64Mi"
      cpu: "50m"
    limits:
      memory: "128Mi"
      cpu: "100m"
EOF

    # Install Trivy Operator
    helm upgrade --install trivy-operator aqua/trivy-operator \
        --namespace "$NAMESPACE_SECURITY" \
        --values /tmp/trivy-operator-values.yaml

    # Wait for Trivy Operator to be ready
    kubectl wait --for=condition=ready pod -l app.kubernetes.io/name=trivy-operator -n "$NAMESPACE_SECURITY" --timeout=300s

    log "INFO" "Trivy Operator vulnerability scanning configured"
}

# Setup Polaris for best practices validation
setup_polaris() {
    log "INFO" "Setting up Polaris for Kubernetes best practices validation..."

    # Add Polaris Helm repository
    helm repo add fairwinds-stable https://charts.fairwinds.com/stable
    helm repo update

    # Create Polaris configuration
    cat > /tmp/polaris-values.yaml << 'EOF'
dashboard:
  replicas: 1
  service:
    type: ClusterIP

webhook:
  enable: true
  replicas: 1

config:
  checks:
    # Security
    runAsNonRoot: warning
    runAsPrivileged: danger
    notReadOnlyRootFilesystem: warning
    privilegeEscalationAllowed: danger

    # Images
    tagNotSpecified: danger
    pullPolicyNotAlways: warning

    # Health checks
    readinessProbeMissing: warning
    livenessProbeMissing: warning

    # Resources
    cpuRequestsMissing: warning
    cpuLimitsMissing: warning
    memoryRequestsMissing: warning
    memoryLimitsMissing: warning

    # Networking
    hostNetworkSet: warning
    hostPortSet: warning

resources:
  limits:
    memory: 512Mi
    cpu: 500m
  requests:
    memory: 256Mi
    cpu: 100m
EOF

    # Install Polaris
    helm upgrade --install polaris fairwinds-stable/polaris \
        --namespace "$NAMESPACE_SECURITY" \
        --values /tmp/polaris-values.yaml

    # Wait for Polaris to be ready
    kubectl wait --for=condition=ready pod -l app.kubernetes.io/name=polaris -n "$NAMESPACE_SECURITY" --timeout=300s

    log "INFO" "Polaris best practices validation configured"
}

# Setup network policies for security
setup_network_policies() {
    log "INFO" "Setting up network security policies..."

    # Create security network policy
    cat > /tmp/security-network-policy.yaml << 'EOF'
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: security-namespace-policy
  namespace: security
spec:
  podSelector: {}
  policyTypes:
  - Ingress
  - Egress
  ingress:
  - from:
    - namespaceSelector:
        matchLabels:
          name: monitoring
    - namespaceSelector:
        matchLabels:
          name: production
  - from: []
    ports:
    - protocol: TCP
      port: 8080  # Webhook receiver
    - protocol: TCP
      port: 9090  # Metrics
  egress:
  - {}  # Allow all egress for security tools to function

---
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: production-security-policy
  namespace: production
spec:
  podSelector: {}
  policyTypes:
  - Ingress
  - Egress
  ingress:
  - from:
    - namespaceSelector:
        matchLabels:
          name: ingress-nginx
    - namespaceSelector:
        matchLabels:
          name: security
    - podSelector: {}
  egress:
  - {}  # Allow all egress initially, restrict as needed
EOF

    kubectl apply -f /tmp/security-network-policy.yaml

    log "INFO" "Network security policies applied"
}

# Setup webhook receiver for security alerts
setup_webhook_receiver() {
    log "INFO" "Setting up webhook receiver for security alerts..."

    cat > /tmp/webhook-receiver.yaml << 'EOF'
apiVersion: apps/v1
kind: Deployment
metadata:
  name: webhook-receiver
  namespace: security
  labels:
    app: webhook-receiver
spec:
  replicas: 2
  selector:
    matchLabels:
      app: webhook-receiver
  template:
    metadata:
      labels:
        app: webhook-receiver
    spec:
      containers:
      - name: webhook-receiver
        image: alpine/curl:latest
        command: ["sh", "-c"]
        args:
        - |
          apk add --no-cache python3 py3-pip
          pip3 install flask requests
          cat > /app/webhook_receiver.py << 'PYEOF'
          import json
          import requests
          from flask import Flask, request

          app = Flask(__name__)

          @app.route('/falco', methods=['POST'])
          def receive_falco():
              data = request.get_json()
              print(f"Falco Alert: {json.dumps(data, indent=2)}")
              return "OK"

          @app.route('/trivy', methods=['POST'])
          def receive_trivy():
              data = request.get_json()
              print(f"Trivy Alert: {json.dumps(data, indent=2)}")
              return "OK"

          @app.route('/health', methods=['GET'])
          def health():
              return "OK"

          if __name__ == '__main__':
              app.run(host='0.0.0.0', port=8080)
          PYEOF
          python3 /app/webhook_receiver.py
        ports:
        - containerPort: 8080
        resources:
          requests:
            memory: "64Mi"
            cpu: "50m"
          limits:
            memory: "128Mi"
            cpu: "100m"
        livenessProbe:
          httpGet:
            path: /health
            port: 8080
          initialDelaySeconds: 30
          periodSeconds: 30
        readinessProbe:
          httpGet:
            path: /health
            port: 8080
          initialDelaySeconds: 5
          periodSeconds: 10

---
apiVersion: v1
kind: Service
metadata:
  name: webhook-receiver
  namespace: security
  labels:
    app: webhook-receiver
spec:
  type: ClusterIP
  ports:
  - port: 8080
    targetPort: 8080
  selector:
    app: webhook-receiver
EOF

    kubectl apply -f /tmp/webhook-receiver.yaml

    # Wait for webhook receiver to be ready
    kubectl wait --for=condition=ready pod -l app=webhook-receiver -n "$NAMESPACE_SECURITY" --timeout=300s

    log "INFO" "Webhook receiver for security alerts configured"
}

# Setup RBAC for security tools
setup_security_rbac() {
    log "INFO" "Setting up RBAC for security tools..."

    cat > /tmp/security-rbac.yaml << 'EOF'
apiVersion: v1
kind: ServiceAccount
metadata:
  name: security-scanner
  namespace: security

---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: security-scanner
rules:
- apiGroups: [""]
  resources: ["pods", "nodes", "namespaces", "services", "configmaps", "secrets"]
  verbs: ["get", "list", "watch"]
- apiGroups: ["apps"]
  resources: ["deployments", "replicasets", "daemonsets", "statefulsets"]
  verbs: ["get", "list", "watch"]
- apiGroups: ["networking.k8s.io"]
  resources: ["networkpolicies"]
  verbs: ["get", "list", "watch"]
- apiGroups: ["policy"]
  resources: ["podsecuritypolicies"]
  verbs: ["get", "list", "watch"]
- apiGroups: ["aquasecurity.github.io"]
  resources: ["vulnerabilityreports", "configauditreports", "clusterconfigauditreports"]
  verbs: ["get", "list", "watch", "create", "update", "patch"]

---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: security-scanner
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: security-scanner
subjects:
- kind: ServiceAccount
  name: security-scanner
  namespace: security
EOF

    kubectl apply -f /tmp/security-rbac.yaml

    log "INFO" "RBAC for security tools configured"
}

# Setup security monitoring cronjobs
setup_security_cronjobs() {
    log "INFO" "Setting up security monitoring cronjobs..."

    cat > /tmp/security-cronjobs.yaml << 'EOF'
apiVersion: batch/v1
kind: CronJob
metadata:
  name: vulnerability-scan
  namespace: security
spec:
  schedule: "0 2 * * *"  # Daily at 2 AM
  jobTemplate:
    spec:
      template:
        spec:
          serviceAccountName: security-scanner
          containers:
          - name: vulnerability-scanner
            image: aquasec/trivy:latest
            command: ["/bin/sh"]
            args:
            - -c
            - |
              # Scan all images in production namespace
              kubectl get pods -n production -o jsonpath='{.items[*].spec.containers[*].image}' | \
              tr ' ' '\n' | sort -u | while read image; do
                echo "Scanning image: $image"
                trivy image --exit-code 0 --severity HIGH,CRITICAL --format json "$image" > "/tmp/scan-$(echo $image | tr '/:' '-').json"
              done

              # Generate summary report
              echo "Vulnerability scan completed at $(date)"
            volumeMounts:
            - name: scan-results
              mountPath: /tmp
          volumes:
          - name: scan-results
            emptyDir: {}
          restartPolicy: OnFailure

---
apiVersion: batch/v1
kind: CronJob
metadata:
  name: compliance-check
  namespace: security
spec:
  schedule: "0 4 * * 0"  # Weekly on Sunday at 4 AM
  jobTemplate:
    spec:
      template:
        spec:
          serviceAccountName: security-scanner
          containers:
          - name: compliance-checker
            image: alpine/curl:latest
            command: ["/bin/sh"]
            args:
            - -c
            - |
              apk add --no-cache kubectl
              echo "Running compliance checks at $(date)"

              # Check network policies
              kubectl get networkpolicy -A --no-headers | wc -l > /tmp/compliance-metrics.txt

              # Check pod security contexts
              kubectl get pods -A -o jsonpath='{.items[*].spec.securityContext}' | grep -c runAsNonRoot >> /tmp/compliance-metrics.txt || echo "0" >> /tmp/compliance-metrics.txt

              echo "Compliance check completed at $(date)"
            volumeMounts:
            - name: compliance-results
              mountPath: /tmp
          volumes:
          - name: compliance-results
            emptyDir: {}
          restartPolicy: OnFailure
EOF

    kubectl apply -f /tmp/security-cronjobs.yaml

    log "INFO" "Security monitoring cronjobs configured"
}

# Setup security alerts and notifications
setup_security_alerts() {
    log "INFO" "Setting up security alerts and notifications..."

    # Create alert rules for security events
    cat > /tmp/security-alert-rules.yaml << 'EOF'
apiVersion: v1
kind: ConfigMap
metadata:
  name: security-alert-rules
  namespace: monitoring
data:
  security-rules.yml: |
    groups:
    - name: security.rules
      rules:
      # Falco security events
      - alert: SecurityViolation
        expr: increase(falco_events_total[5m]) > 0
        for: 0m
        labels:
          severity: warning
          team: security
        annotations:
          summary: "Security violation detected by Falco"
          description: "Falco has detected {{ $value }} security events in the last 5 minutes"

      # High vulnerability count
      - alert: HighVulnerabilityCount
        expr: trivy_vulnerability_count{severity="CRITICAL"} > 5
        for: 5m
        labels:
          severity: critical
          team: security
        annotations:
          summary: "High number of critical vulnerabilities detected"
          description: "{{ $value }} critical vulnerabilities found in {{ $labels.namespace }}/{{ $labels.pod }}"

      # Failed authentication attempts
      - alert: HighFailedAuthentication
        expr: rate(authentication_failures_total[5m]) > 10
        for: 2m
        labels:
          severity: warning
          team: security
        annotations:
          summary: "High number of failed authentication attempts"
          description: "{{ $value }} failed authentication attempts per second"

      # Suspicious network activity
      - alert: SuspiciousNetworkActivity
        expr: rate(network_connections_total{type="unexpected"}[5m]) > 5
        for: 1m
        labels:
          severity: critical
          team: security
        annotations:
          summary: "Suspicious network activity detected"
          description: "{{ $value }} unexpected network connections per second"
EOF

    kubectl apply -f /tmp/security-alert-rules.yaml

    log "INFO" "Security alerts and notifications configured"
}

# Generate security scanning report
generate_initial_report() {
    log "INFO" "Generating initial security scanning report..."

    REPORT_DATE=$(date +%Y-%m-%d)
    REPORT_FILE="security-setup-report-$REPORT_DATE.txt"

    cat > "$REPORT_FILE" << EOF
GK-Nexus Security Scanning Setup Report
=======================================
Date: $(date)
Cluster: $(kubectl config current-context)

Installed Components:
- ✅ Falco Runtime Security Monitoring
- ✅ Trivy Operator Vulnerability Scanning
- ✅ Polaris Best Practices Validation
- ✅ Security Network Policies
- ✅ Webhook Alert Receiver
- ✅ Security RBAC Configuration
- ✅ Automated Security Scans
- ✅ Security Alert Rules

Namespaces Created:
- security (security tools)
- monitoring (already exists)
- production (already exists)

Next Steps:
1. Configure Slack webhook URL for notifications
2. Set up external SIEM integration if required
3. Schedule regular security reviews
4. Train team on security alert response procedures
5. Configure compliance reporting

Access Points:
- Falco Logs: kubectl logs -n security deployment/falco
- Trivy Reports: kubectl get vulnerabilityreports -A
- Polaris Dashboard: kubectl port-forward -n security service/polaris-dashboard 8080:80
- Security Metrics: Available in Prometheus/Grafana

Monitoring Commands:
- View Security Events: kubectl logs -n security deployment/falco --tail=100
- Check Vulnerabilities: kubectl get vulnerabilityreports -A
- Review Network Policies: kubectl get networkpolicy -A
- Monitor Security Alerts: kubectl get alerts -n monitoring

EOF

    log "INFO" "Initial security scanning report generated: $REPORT_FILE"
}

# Main setup function
main() {
    log "INFO" "Starting GK-Nexus Security Scanning Setup"
    log "INFO" "Target cluster: $(kubectl config current-context)"

    # Setup steps
    check_prerequisites
    create_security_namespace
    setup_security_rbac
    setup_webhook_receiver
    setup_network_policies
    setup_falco
    setup_trivy_operator
    setup_polaris
    setup_security_cronjobs
    setup_security_alerts
    generate_initial_report

    log "INFO" "Security scanning setup completed successfully!"
    log "INFO" ""
    log "INFO" "🔐 Security Tools Status:"
    kubectl get pods -n "$NAMESPACE_SECURITY"
    log "INFO" ""
    log "INFO" "📊 To view security dashboards:"
    log "INFO" "  Polaris: kubectl port-forward -n security service/polaris-dashboard 8080:80"
    log "INFO" "  Falco Logs: kubectl logs -n security deployment/falco -f"
    log "INFO" ""
    log "INFO" "⚠️  Important: Configure your Slack webhook URL in Falco for notifications"
    log "INFO" "🔄 Security scans will run automatically on schedule"
    log "INFO" "📈 Security metrics are available in your monitoring stack"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            cat << EOF
GK-Nexus Security Scanning Setup

This script sets up comprehensive security scanning and monitoring for the
GK-Nexus production environment.

Usage: $0 [options]

Options:
    -h, --help          Show this help message

Environment Variables:
    SLACK_WEBHOOK_URL   Slack webhook URL for security notifications (optional)

Components Installed:
    - Falco             Runtime security monitoring
    - Trivy Operator    Vulnerability scanning
    - Polaris           Kubernetes best practices
    - Network Policies  Network security
    - Alert Rules       Security alerting
    - Cronjobs          Automated scanning

Prerequisites:
    - kubectl configured for target cluster
    - Helm 3.x installed
    - Appropriate cluster permissions

Examples:
    $0                  # Basic setup
    SLACK_WEBHOOK_URL=https://hooks.slack.com/... $0

EOF
            exit 0
            ;;
        *)
            error_exit "Unknown option: $1. Use -h for help."
            ;;
    esac
done

# Run main function
main