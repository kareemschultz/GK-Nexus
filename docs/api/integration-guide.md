# GK-Nexus Suite API Integration Guide

## Overview

The GK-Nexus Suite provides comprehensive APIs for tax calculation, client management, immigration workflows, OCR processing, and GRA eServices integration. This guide covers everything you need to integrate with our platform.

## Quick Start

### 1. Authentication

All API requests require authentication using JWT Bearer tokens.

```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  https://api.gk-nexus.com/v1/health
```

### 2. Base URLs

| Environment | Base URL |
|------------|----------|
| Production | `https://api.gk-nexus.com/v1` |
| Staging | `https://staging-api.gk-nexus.com/v1` |
| Development | `http://localhost:3001/v1` |

### 3. Content Type

All requests should use `Content-Type: application/json` unless otherwise specified.

## Core Integration Patterns

### Tax Calculations

#### Calculate PAYE Tax

```javascript
const response = await fetch('/tax/calculate-paye', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    monthlyGrossSalary: 150000,
    personalAllowances: 10000,
    dependentAllowances: 5000,
    pensionContributions: 2000
  })
});

const result = await response.json();
console.log('PAYE Tax:', result.data.payeTax);
```

#### Calculate VAT

```javascript
const response = await fetch('/tax/calculate-vat', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    netAmount: 100000,
    category: 'STANDARD',
    vatInclusive: false
  })
});

const result = await response.json();
console.log('VAT Amount:', result.data.vatAmount); // 14000 (14%)
```

### Client Management

#### Create a New Client

```javascript
const newClient = {
  name: 'ABC Company Ltd.',
  entityType: 'LIMITED_LIABILITY',
  email: 'contact@abc-company.com',
  phoneNumber: '+592-123-4567',
  taxIdNumber: 'TIN123456789',
  address: {
    street: '123 Main Street',
    city: 'Georgetown',
    region: 'Demerara-Mahaica',
    postalCode: '00001',
    country: 'Guyana'
  }
};

const response = await fetch('/clients', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(newClient)
});

const client = await response.json();
console.log('New Client ID:', client.id);
```

#### List Clients with Filtering

```javascript
const params = new URLSearchParams({
  page: '1',
  limit: '20',
  entityType: 'LIMITED_LIABILITY',
  status: 'ACTIVE',
  search: 'ABC'
});

const response = await fetch(`/clients?${params}`, {
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN'
  }
});

const result = await response.json();
console.log('Clients:', result.data.items);
console.log('Pagination:', result.data.pagination);
```

### GRA eServices Integration

#### Authenticate with GRA

```javascript
const graAuth = {
  clientId: 'client-uuid',
  tin: 'TIN123456789',
  username: 'gra_username',
  password: 'gra_password'
};

const response = await fetch('/gra/authenticate', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(graAuth)
});

const result = await response.json();
if (result.data.authenticated) {
  console.log('GRA session expires:', result.data.sessionExpiry);
}
```

#### Submit VAT Return to GRA

```javascript
const vatReturn = {
  clientId: 'client-uuid',
  period: '2024-Q1',
  vatTransactions: [
    {
      invoiceNumber: 'INV-2024-001',
      customerName: 'Customer ABC',
      customerTin: 'TIN987654321',
      date: '2024-01-15T10:00:00Z',
      netAmount: 100000,
      vatAmount: 14000,
      grossAmount: 114000,
      category: 'STANDARD',
      description: 'Sale of goods'
    }
  ],
  declarationDate: '2024-04-20T14:30:00Z'
};

const response = await fetch('/tax/submit-vat-return', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(vatReturn)
});

const result = await response.json();
console.log('GRA Reference:', result.data.graReference);
console.log('Status:', result.data.status);
```

### Immigration Workflow Management

#### Get Immigration Status

```javascript
const response = await fetch('/clients/client-uuid/immigration-status', {
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN'
  }
});

const result = await response.json();
if (result.data) {
  console.log('Current Status:', result.data.currentStatus);
  console.log('Visa Type:', result.data.visaType);
  console.log('Days Until Expiry:', result.data.daysUntilExpiry);
}
```

#### Update Immigration Status

```javascript
const statusUpdate = {
  status: 'APPROVED',
  visaType: 'WORK_PERMIT',
  expiryDate: '2025-12-31T23:59:59Z',
  nextAction: 'Schedule visa issuance appointment',
  nextActionDate: '2024-02-15T10:00:00Z',
  notes: 'Application approved after interview. All documents verified.'
};

const response = await fetch('/clients/client-uuid/immigration-status', {
  method: 'PUT',
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(statusUpdate)
});

const result = await response.json();
console.log('Updated Status:', result.data.currentStatus);
```

### OCR Document Processing

#### Process Single Document

```javascript
const ocrRequest = {
  documentId: 'document-uuid',
  documentType: 'INVOICE',
  clientId: 'client-uuid',
  priority: 'HIGH',
  extractionOptions: {
    extractText: true,
    extractTables: true,
    extractSignatures: false,
    detectLanguage: true,
    confidenceThreshold: 0.90
  }
};

const response = await fetch('/ocr/process', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(ocrRequest)
});

const result = await response.json();
console.log('Processing ID:', result.data.processingId);
console.log('Estimated Completion:', result.data.estimatedCompletion);
```

#### Check OCR Status

```javascript
const response = await fetch('/ocr/status/processing-id?includeResults=true', {
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN'
  }
});

const result = await response.json();
console.log('Status:', result.data.status);
if (result.data.status === 'COMPLETED') {
  console.log('Extracted Text:', result.data.results[0].extractedText);
  console.log('Confidence Score:', result.data.results[0].confidenceScore);
}
```

#### Batch Process Documents

```javascript
const batchRequest = {
  documents: [
    {
      documentId: 'doc1-uuid',
      documentType: 'INVOICE'
    },
    {
      documentId: 'doc2-uuid',
      documentType: 'RECEIPT'
    },
    {
      documentId: 'doc3-uuid',
      documentType: 'BANK_STATEMENT'
    }
  ],
  clientId: 'client-uuid',
  priority: 'NORMAL'
};

const response = await fetch('/ocr/batch', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(batchRequest)
});

const result = await response.json();
console.log('Batch ID:', result.data.batchId);
console.log('Total Documents:', result.data.totalDocuments);
```

### Multi-Channel Notifications

#### Send Notification

```javascript
const notification = {
  recipients: [
    {
      userId: 'user-uuid',
      email: 'user@example.com',
      phone: '+592-123-4567',
      name: 'John Doe'
    }
  ],
  channels: ['EMAIL', 'SMS', 'IN_APP'],
  template: 'TAX_DEADLINE_REMINDER',
  subject: 'VAT Return Due Soon',
  message: 'Your VAT return for Q1 2024 is due on April 21st. Please submit before the deadline to avoid penalties.',
  priority: 'HIGH',
  scheduledFor: '2024-04-18T09:00:00Z'
};

const response = await fetch('/notifications/send', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(notification)
});

const result = await response.json();
console.log('Notification ID:', result.data.notificationId);
console.log('Status:', result.data.status);
```

#### Check Notification Status

```javascript
const response = await fetch('/notifications/notification-id/status', {
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN'
  }
});

const result = await response.json();
console.log('Overall Status:', result.data.overallStatus);
console.log('Total Notifications:', result.data.totalNotifications);
console.log('Status Breakdown:', result.data.statusBreakdown);
```

## Advanced Integration Patterns

### Webhooks

GK-Nexus supports webhooks for real-time notifications of important events:

```javascript
// Configure webhook endpoint
const webhookConfig = {
  url: 'https://your-app.com/webhooks/gk-nexus',
  events: [
    'tax.calculation.completed',
    'gra.submission.status_changed',
    'ocr.processing.completed',
    'immigration.status.updated',
    'notification.delivered'
  ],
  secret: 'webhook-secret-key'
};

// Verify webhook signature (Node.js example)
const crypto = require('crypto');

function verifyWebhookSignature(payload, signature, secret) {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(`sha256=${expectedSignature}`)
  );
}

// Handle webhook event
app.post('/webhooks/gk-nexus', (req, res) => {
  const signature = req.headers['x-gk-signature'];
  const payload = JSON.stringify(req.body);

  if (!verifyWebhookSignature(payload, signature, webhookConfig.secret)) {
    return res.status(401).send('Invalid signature');
  }

  const event = req.body;

  switch (event.type) {
    case 'tax.calculation.completed':
      handleTaxCalculationCompleted(event.data);
      break;
    case 'gra.submission.status_changed':
      handleGRAStatusChange(event.data);
      break;
    case 'ocr.processing.completed':
      handleOCRCompleted(event.data);
      break;
    default:
      console.log('Unhandled event type:', event.type);
  }

  res.status(200).send('OK');
});
```

### Rate Limiting

The API implements rate limiting to ensure fair usage:

| Endpoint Category | Limit | Window |
|------------------|-------|--------|
| Standard endpoints | 1000 requests | 1 hour |
| OCR processing | 100 requests | 1 hour |
| GRA integration | 50 requests | 1 hour |
| Webhook endpoints | 5000 requests | 1 hour |

Handle rate limits gracefully:

```javascript
async function makeAPICall(url, options, retries = 3) {
  try {
    const response = await fetch(url, options);

    if (response.status === 429) {
      const retryAfter = parseInt(response.headers.get('Retry-After') || '60');

      if (retries > 0) {
        console.log(`Rate limited. Retrying after ${retryAfter} seconds...`);
        await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
        return makeAPICall(url, options, retries - 1);
      } else {
        throw new Error('Rate limit exceeded and max retries reached');
      }
    }

    return response;
  } catch (error) {
    throw error;
  }
}
```

### Error Handling

The API returns structured errors following RFC 7807:

```javascript
async function handleAPIError(response) {
  if (!response.ok) {
    const error = await response.json();

    switch (error.status) {
      case 400:
        console.error('Validation errors:', error.errors);
        break;
      case 401:
        console.error('Authentication required');
        // Redirect to login
        break;
      case 403:
        console.error('Insufficient permissions');
        // Show permission error
        break;
      case 404:
        console.error('Resource not found');
        break;
      case 429:
        console.error('Rate limit exceeded');
        // Implement retry logic
        break;
      case 500:
        console.error('Server error:', error.detail);
        // Log error for monitoring
        break;
      default:
        console.error('Unexpected error:', error);
    }

    throw new Error(error.detail || 'API request failed');
  }

  return response;
}
```

### Bulk Operations

For efficient processing of large datasets:

```javascript
// Bulk client creation
const clients = [
  { name: 'Client 1', entityType: 'CORPORATION', email: 'client1@example.com' },
  { name: 'Client 2', entityType: 'PARTNERSHIP', email: 'client2@example.com' },
  // ... more clients
];

// Process in batches of 50
const batchSize = 50;
for (let i = 0; i < clients.length; i += batchSize) {
  const batch = clients.slice(i, i + batchSize);

  const promises = batch.map(client =>
    fetch('/clients', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer YOUR_TOKEN',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(client)
    })
  );

  const results = await Promise.allSettled(promises);
  console.log(`Processed batch ${Math.floor(i / batchSize) + 1}`);
}
```

## Testing and Development

### Postman Collection

Import our comprehensive Postman collection for easy testing:

```bash
curl -o gk-nexus-postman.json \
  https://docs.gk-nexus.com/postman/collection.json
```

### Environment Variables

Set up environment variables in Postman:

```json
{
  "baseUrl": "{{base_url}}",
  "authToken": "{{auth_token}}",
  "clientId": "{{test_client_id}}",
  "testTin": "{{test_tin}}"
}
```

### SDK Libraries

Official SDKs are available for popular programming languages:

#### JavaScript/TypeScript

```bash
npm install @gk-nexus/api-client
```

```javascript
import { GKNexusClient } from '@gk-nexus/api-client';

const client = new GKNexusClient({
  baseURL: 'https://api.gk-nexus.com/v1',
  authToken: 'YOUR_JWT_TOKEN'
});

// Type-safe API calls
const payeResult = await client.tax.calculatePaye({
  monthlyGrossSalary: 150000,
  personalAllowances: 10000
});
```

#### Python

```bash
pip install gk-nexus-api
```

```python
from gk_nexus_api import GKNexusClient

client = GKNexusClient(
    base_url='https://api.gk-nexus.com/v1',
    auth_token='YOUR_JWT_TOKEN'
)

# Calculate PAYE tax
paye_result = client.tax.calculate_paye(
    monthly_gross_salary=150000,
    personal_allowances=10000
)
```

#### PHP

```bash
composer require gk-nexus/api-client
```

```php
<?php
use GKNexus\ApiClient\Client;

$client = new Client([
    'base_url' => 'https://api.gk-nexus.com/v1',
    'auth_token' => 'YOUR_JWT_TOKEN'
]);

$payeResult = $client->tax->calculatePaye([
    'monthlyGrossSalary' => 150000,
    'personalAllowances' => 10000
]);
```

## Security Best Practices

### API Key Management

- Never expose API keys in client-side code
- Use environment variables for API keys
- Rotate API keys regularly
- Use different keys for different environments

### Request Signing

For enhanced security, sign requests with HMAC:

```javascript
const crypto = require('crypto');

function signRequest(method, path, body, timestamp, secret) {
  const payload = `${method}${path}${body}${timestamp}`;
  return crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
}

const timestamp = Date.now();
const signature = signRequest('POST', '/tax/calculate-paye', requestBody, timestamp, apiSecret);

const response = await fetch('/tax/calculate-paye', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN',
    'Content-Type': 'application/json',
    'X-Timestamp': timestamp,
    'X-Signature': signature
  },
  body: requestBody
});
```

### Data Privacy

- Use HTTPS for all requests
- Implement proper data encryption for sensitive information
- Follow GDPR and local data protection regulations
- Regularly audit API access logs

## Monitoring and Analytics

### API Usage Monitoring

Monitor your API usage with our dashboard or programmatically:

```javascript
const response = await fetch('/usage/analytics', {
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN'
  }
});

const analytics = await response.json();
console.log('Monthly API calls:', analytics.monthlyUsage);
console.log('Rate limit status:', analytics.rateLimitStatus);
```

### Performance Optimization

- Cache frequently used data (tax rates, client information)
- Use pagination for large datasets
- Implement request batching where possible
- Monitor response times and optimize accordingly

## Support and Resources

### Documentation

- [OpenAPI Specification](./openapi-spec.yaml)
- [SDK Documentation](https://docs.gk-nexus.com/sdks)
- [API Reference](https://docs.gk-nexus.com/api)

### Community

- [Developer Forum](https://community.gk-nexus.com)
- [Stack Overflow Tag](https://stackoverflow.com/questions/tagged/gk-nexus)
- [GitHub Discussions](https://github.com/gk-nexus/api-client/discussions)

### Support Channels

- Technical Support: [support@gk-nexus.com](mailto:support@gk-nexus.com)
- Sales Inquiries: [sales@gk-nexus.com](mailto:sales@gk-nexus.com)
- Emergency Support: +592-XXX-XXXX (24/7 for Enterprise customers)

### Service Level Agreements

| Tier | Response Time | Uptime SLA |
|------|---------------|------------|
| Enterprise | 1 hour | 99.9% |
| Professional | 4 hours | 99.5% |
| Standard | 24 hours | 99% |

---

For the most up-to-date information and additional examples, please visit our [developer documentation](https://docs.gk-nexus.com).