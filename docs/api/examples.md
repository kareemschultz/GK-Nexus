# GK-Nexus API Examples

This document provides comprehensive examples for all GK-Nexus API endpoints with real-world use cases.

## Table of Contents

- [Tax Calculations](#tax-calculations)
- [Client Management](#client-management)
- [Immigration Workflow](#immigration-workflow)
- [OCR Processing](#ocr-processing)
- [GRA Integration](#gra-integration)
- [Notifications](#notifications)
- [Error Handling](#error-handling)

## Tax Calculations

### PAYE Tax Calculation

#### Basic Salary Calculation

```bash
curl -X POST "https://api.gk-nexus.com/v1/tax/calculate-paye" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "monthlyGrossSalary": 150000,
    "personalAllowances": 10000,
    "dependentAllowances": 5000
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "grossSalary": 150000,
    "totalAllowances": 15000,
    "taxableIncome": 135000,
    "payeTax": 22500,
    "netSalary": 127500,
    "breakdown": [
      {
        "bracket": "0 - 35,000",
        "taxableAmount": 35000,
        "rate": 0,
        "tax": 0
      },
      {
        "bracket": "35,001 - 70,000",
        "taxableAmount": 35000,
        "rate": 0.25,
        "tax": 8750
      },
      {
        "bracket": "70,001 - 135,000",
        "taxableAmount": 65000,
        "rate": 0.30,
        "tax": 19500
      }
    ]
  }
}
```

#### Executive Salary with Benefits

```javascript
const executivePayeCalculation = {
  monthlyGrossSalary: 500000,
  personalAllowances: 25000,
  dependentAllowances: 15000,
  pensionContributions: 50000,
  insurancePremiums: 12000
};

const response = await fetch('/tax/calculate-paye', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(executivePayeCalculation)
});

const result = await response.json();
// Expected PAYE tax: ~98,000 GYD
```

### VAT Calculations

#### Standard VAT on Services

```bash
curl -X POST "https://api.gk-nexus.com/v1/tax/calculate-vat" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "netAmount": 100000,
    "category": "STANDARD",
    "vatInclusive": false
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "netAmount": 100000,
    "vatAmount": 14000,
    "grossAmount": 114000,
    "vatRate": 0.14,
    "category": "STANDARD",
    "isExempt": false,
    "isZeroRated": false
  }
}
```

#### Zero-Rated Export Transaction

```javascript
const exportVAT = {
  netAmount: 250000,
  category: "ZERO_RATED",
  isExport: true,
  vatInclusive: false
};

const response = await fetch('/tax/calculate-vat', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(exportVAT)
});

// Expected VAT amount: 0 (zero-rated for exports)
```

### Complete Payroll Calculation

```javascript
const payrollData = {
  monthlyGrossSalary: 200000,
  personalAllowances: 12000,
  dependentAllowances: 8000,
  pensionContributions: 20000
};

const response = await fetch('/tax/calculate-payroll', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(payrollData)
});

const result = await response.json();
/*
Expected structure:
{
  gross: 200000,
  paye: { ... PAYE calculation details ... },
  nis: { ... NIS calculation details ... },
  totalDeductions: 45000,
  netPay: 155000,
  employerCosts: {
    salary: 200000,
    nisContribution: 15600,
    total: 215600
  }
}
*/
```

## Client Management

### Create Individual Client

```bash
curl -X POST "https://api.gk-nexus.com/v1/clients" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Smith",
    "entityType": "INDIVIDUAL",
    "email": "john.smith@example.com",
    "phoneNumber": "+592-123-4567",
    "taxIdNumber": "NIS123456789",
    "address": {
      "street": "123 Main Street",
      "city": "Georgetown",
      "region": "Demerara-Mahaica",
      "postalCode": "00001",
      "country": "Guyana"
    }
  }'
```

### Create Corporate Client

```javascript
const corporateClient = {
  name: "ABC Manufacturing Ltd.",
  entityType: "LIMITED_LIABILITY",
  email: "info@abcmanufacturing.gy",
  phoneNumber: "+592-987-6543",
  taxIdNumber: "TIN987654321",
  address: {
    street: "45 Industrial Estate",
    city: "Georgetown",
    region: "Demerara-Mahaica",
    postalCode: "00002",
    country: "Guyana"
  },
  complianceStatus: "GOOD",
  riskLevel: "MEDIUM",
  tags: ["manufacturing", "export", "large-business"]
};

const response = await fetch('/clients', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(corporateClient)
});
```

### Client Search and Filtering

```javascript
// Search for manufacturing companies
const searchParams = new URLSearchParams({
  search: 'manufacturing',
  entityType: 'LIMITED_LIABILITY',
  status: 'ACTIVE',
  complianceStatus: 'GOOD',
  page: '1',
  limit: '10'
});

const response = await fetch(`/clients?${searchParams}`, {
  headers: { 'Authorization': 'Bearer YOUR_TOKEN' }
});

const clients = await response.json();
```

### Client Wizard Workflow

```javascript
// Step 1: Basic Information
const step1Data = {
  name: "XYZ Services Inc.",
  entityType: "CORPORATION",
  email: "contact@xyzservices.gy"
};

let step1Response = await fetch('/clients/wizard/step1', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(step1Data)
});

// Step 2: Contact Information
const step2Data = {
  phoneNumber: "+592-555-1234",
  address: {
    street: "789 Business Park",
    city: "Georgetown",
    region: "Demerara-Mahaica"
  }
};

// Step 3: Tax Information
const step3Data = {
  taxIdNumber: "TIN555123456",
  vatRegistered: true,
  payeRegistered: true
};

// Step 4: Additional Details
const step4Data = {
  assignedAccountant: "accountant-uuid",
  tags: ["services", "technology"],
  customFields: {
    industry: "Information Technology",
    employeeCount: "25-50"
  }
};

// Complete wizard
const completeWizard = await fetch('/clients/wizard/complete', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    step1: step1Data,
    step2: step2Data,
    step3: step3Data,
    step4: step4Data
  })
});
```

## Immigration Workflow

### Check Immigration Status

```bash
curl -X GET "https://api.gk-nexus.com/v1/clients/CLIENT_UUID/immigration-status" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "immigration-status-id",
    "currentStatus": "UNDER_REVIEW",
    "visaType": "WORK_PERMIT",
    "applicationDate": "2024-01-15",
    "expiryDate": "2025-01-15",
    "documents": [
      {
        "documentType": "PASSPORT",
        "documentId": "doc-uuid-1",
        "isRequired": true,
        "submittedAt": "2024-01-16T10:00:00Z"
      },
      {
        "documentType": "EMPLOYMENT_LETTER",
        "documentId": "doc-uuid-2",
        "isRequired": true,
        "submittedAt": "2024-01-16T10:30:00Z"
      }
    ],
    "timeline": [
      {
        "status": "APPLICATION_SUBMITTED",
        "changedAt": "2024-01-15T14:00:00Z",
        "changedBy": "user-uuid",
        "notes": "Initial application submitted"
      },
      {
        "status": "UNDER_REVIEW",
        "changedAt": "2024-01-16T09:00:00Z",
        "changedBy": "immigration-officer-uuid",
        "notes": "Application under review by immigration office"
      }
    ],
    "daysUntilExpiry": 365
  }
}
```

### Update Immigration Status

```javascript
const statusUpdate = {
  status: "INTERVIEW_SCHEDULED",
  nextAction: "Attend immigration interview",
  nextActionDate: "2024-02-15T10:00:00Z",
  notes: "Interview scheduled at Immigration Office, bring all original documents"
};

const response = await fetch('/clients/client-uuid/immigration-status', {
  method: 'PUT',
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(statusUpdate)
});
```

### Submit Immigration Documents

```javascript
const documentsSubmission = {
  clientId: "client-uuid",
  documents: [
    {
      documentId: "doc-uuid-1",
      documentType: "MEDICAL_EXAMINATION",
      isRequired: true,
      submittedAt: "2024-01-20T14:00:00Z",
      notes: "Medical examination completed at approved facility"
    },
    {
      documentId: "doc-uuid-2",
      documentType: "POLICE_CLEARANCE",
      isRequired: true,
      submittedAt: "2024-01-20T14:30:00Z",
      notes: "Police clearance from country of origin"
    }
  ]
};

const response = await fetch('/clients/immigration-documents', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(documentsSubmission)
});
```

### Get Workflow Templates

```javascript
const response = await fetch('/clients/immigration-templates?visaType=WORK_PERMIT', {
  headers: { 'Authorization': 'Bearer YOUR_TOKEN' }
});

const template = await response.json();
/*
Expected response includes:
- Required documents list
- Workflow steps with estimated timeframes
- Associated fees
- Success rates and statistics
*/
```

## OCR Processing

### Process Invoice Document

```javascript
const invoiceOCR = {
  documentId: "invoice-doc-uuid",
  documentType: "INVOICE",
  clientId: "client-uuid",
  priority: "HIGH",
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
  body: JSON.stringify(invoiceOCR)
});

const result = await response.json();
/*
{
  "processingId": "ocr_1642345678_abc123",
  "status": "QUEUED",
  "estimatedCompletion": "2024-01-15T10:03:00Z"
}
*/
```

### Check Processing Status and Get Results

```javascript
const statusResponse = await fetch('/ocr/status/ocr_1642345678_abc123?includeResults=true', {
  headers: { 'Authorization': 'Bearer YOUR_TOKEN' }
});

const status = await statusResponse.json();

if (status.data.status === 'COMPLETED') {
  const extractedData = status.data.results[0].extractedData;

  // For invoice documents, structured data might include:
  console.log('Invoice Number:', extractedData.invoiceNumber);
  console.log('Total Amount:', extractedData.total);
  console.log('VAT Amount:', extractedData.vat);
  console.log('Confidence Score:', status.data.results[0].confidenceScore);
}
```

### Batch Process Multiple Documents

```javascript
const batchProcessing = {
  documents: [
    { documentId: "receipt-1-uuid", documentType: "RECEIPT" },
    { documentId: "receipt-2-uuid", documentType: "RECEIPT" },
    { documentId: "invoice-1-uuid", documentType: "INVOICE" },
    { documentId: "bank-stmt-uuid", documentType: "BANK_STATEMENT" }
  ],
  clientId: "client-uuid",
  priority: "NORMAL",
  extractionOptions: {
    extractText: true,
    extractTables: true,
    confidenceThreshold: 0.85
  }
};

const response = await fetch('/ocr/batch', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(batchProcessing)
});

const batchResult = await response.json();
console.log('Batch ID:', batchResult.data.batchId);

// Check batch status
const batchStatusResponse = await fetch(`/ocr/batch/${batchResult.data.batchId}/status`, {
  headers: { 'Authorization': 'Bearer YOUR_TOKEN' }
});
```

### Validate OCR Results

```javascript
const corrections = {
  processingId: "ocr_1642345678_abc123",
  corrections: {
    text: "Corrected extracted text if needed",
    structuredData: {
      invoiceNumber: "INV-2024-001", // Corrected value
      total: 114000, // Corrected amount
      vat: 14000
    },
    confidence: 0.98 // Updated confidence after manual review
  },
  notes: "Manual review completed, corrected invoice number format"
};

const response = await fetch('/ocr/validate', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(corrections)
});
```

## GRA Integration

### Authenticate with GRA eServices

```javascript
const graAuth = {
  clientId: "client-uuid",
  tin: "TIN123456789",
  username: "gra_username",
  password: "gra_password"
};

const response = await fetch('/gra/authenticate', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(graAuth)
});

const authResult = await response.json();
if (authResult.data.authenticated) {
  console.log('GRA session active until:', authResult.data.sessionExpiry);
  console.log('Available forms:', authResult.data.supportedForms);
}
```

### Submit VAT Return to GRA

```javascript
const vatReturn = {
  clientId: "client-uuid",
  period: "2024-Q1",
  vatTransactions: [
    {
      invoiceNumber: "INV-2024-001",
      customerName: "ABC Company Ltd.",
      customerTin: "TIN987654321",
      date: "2024-01-15T10:00:00Z",
      netAmount: 100000,
      vatAmount: 14000,
      grossAmount: 114000,
      category: "STANDARD",
      description: "Consulting services provided"
    },
    {
      invoiceNumber: "INV-2024-002",
      customerName: "XYZ Industries",
      customerTin: "TIN555666777",
      date: "2024-02-01T14:30:00Z",
      netAmount: 250000,
      vatAmount: 35000,
      grossAmount: 285000,
      category: "STANDARD",
      description: "Software development services"
    }
  ],
  vatInputCredit: 5000,
  adjustments: [
    {
      type: "CORRECTION",
      amount: -1000,
      reason: "Correction for previous period error"
    }
  ],
  declarationDate: "2024-04-20T16:00:00Z"
};

const response = await fetch('/tax/submit-vat-return', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(vatReturn)
});

const submission = await response.json();
console.log('GRA Reference:', submission.data.graReference);
console.log('VAT Payable:', submission.data.vatSummary.finalVatPayable);
```

### Submit PAYE Return to GRA

```javascript
const payeReturn = {
  clientId: "client-uuid",
  period: "2024-01",
  employees: [
    {
      employeeId: "emp-1-uuid",
      nrc: "NRC123456789",
      fullName: "John Doe",
      grossSalary: 150000,
      allowances: 15000,
      payeTax: 22500,
      nisEmployee: 5850,
      nisEmployer: 5850,
      netSalary: 121650
    },
    {
      employeeId: "emp-2-uuid",
      nrc: "NRC987654321",
      fullName: "Jane Smith",
      grossSalary: 200000,
      allowances: 20000,
      payeTax: 36000,
      nisEmployee: 7800,
      nisEmployer: 7800,
      netSalary: 156200
    }
  ],
  declarationDate: "2024-02-15T10:00:00Z"
};

const response = await fetch('/gra/submit-paye-return', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(payeReturn)
});
```

### Check GRA Submission Status

```javascript
const statusResponse = await fetch('/gra/submission-status?graReference=GRA1234567890', {
  headers: { 'Authorization': 'Bearer YOUR_TOKEN' }
});

const status = await statusResponse.json();
console.log('Current Status:', status.data.status);
console.log('Processing Notes:', status.data.processingNotes);
```

### Get GRA Filing Calendar

```javascript
const calendarResponse = await fetch('/gra/filing-calendar?year=2024', {
  headers: { 'Authorization': 'Bearer YOUR_TOKEN' }
});

const calendar = await calendarResponse.json();

// Filter for upcoming critical deadlines
const criticalDeadlines = calendar.data.calendar.filter(
  deadline => deadline.priority === 'CRITICAL' && deadline.daysUntilDue <= 30
);

console.log('Upcoming Critical Deadlines:', criticalDeadlines);
```

## Notifications

### Send Tax Deadline Reminder

```javascript
const taxReminder = {
  recipients: [
    {
      userId: "user-uuid",
      email: "client@example.com",
      phone: "+592-123-4567",
      name: "John Smith"
    }
  ],
  channels: ["EMAIL", "SMS"],
  template: "TAX_DEADLINE_REMINDER",
  subject: "VAT Return Due in 7 Days",
  message: `Dear John,

This is a friendly reminder that your VAT return for Q1 2024 is due on April 21st, 2024 (7 days from now).

To avoid late filing penalties of $10,000, please submit your return before the deadline.

You can submit your return through:
- GRA eServices portal
- Our automated filing system
- Visit our office for assistance

If you need help, please don't hesitate to contact us.

Best regards,
GK-Nexus Tax Team`,
  templateData: {
    clientName: "John Smith",
    dueDate: "April 21st, 2024",
    daysRemaining: 7,
    returnType: "VAT Return Q1 2024",
    penalty: "$10,000"
  },
  priority: "HIGH",
  clientId: "client-uuid",
  relatedEntityType: "TAX_DEADLINE",
  relatedEntityId: "vat-q1-2024"
};

const response = await fetch('/notifications/send', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(taxReminder)
});

const notification = await response.json();
console.log('Notification ID:', notification.data.notificationId);
```

### Send Immigration Status Update

```javascript
const immigrationUpdate = {
  recipients: [
    {
      email: "applicant@example.com",
      name: "Maria Rodriguez"
    }
  ],
  channels: ["EMAIL", "IN_APP"],
  template: "IMMIGRATION_STATUS_CHANGE",
  subject: "Work Permit Application Approved",
  message: `Dear Maria,

Great news! Your work permit application has been APPROVED.

Application Details:
- Application ID: WP-2024-001234
- Visa Type: Work Permit
- Valid From: February 15, 2024
- Valid Until: February 14, 2025

Next Steps:
1. Schedule an appointment to collect your visa
2. Bring original passport and approval letter
3. Pay the visa issuance fee ($150)

You can schedule your appointment through our client portal or call our office.

Congratulations on your successful application!

Best regards,
GK-Nexus Immigration Team`,
  templateData: {
    applicantName: "Maria Rodriguez",
    applicationId: "WP-2024-001234",
    visaType: "Work Permit",
    validFrom: "February 15, 2024",
    validUntil: "February 14, 2025",
    newStatus: "APPROVED"
  },
  priority: "HIGH"
};

const response = await fetch('/notifications/send', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(immigrationUpdate)
});
```

### Scheduled Batch Notification

```javascript
const batchNotification = {
  recipients: [
    { email: "client1@example.com", name: "Client One" },
    { email: "client2@example.com", name: "Client Two" },
    { email: "client3@example.com", name: "Client Three" }
  ],
  channels: ["EMAIL"],
  template: "COMPLIANCE_ALERT",
  subject: "Monthly Compliance Report Available",
  message: "Your monthly compliance report is now available for download.",
  priority: "NORMAL",
  scheduledFor: "2024-02-01T09:00:00Z" // Send on first day of month at 9 AM
};

const response = await fetch('/notifications/send', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(batchNotification)
});
```

### Check Notification Delivery Status

```javascript
const statusResponse = await fetch('/notifications/notif_123456789/status', {
  headers: { 'Authorization': 'Bearer YOUR_TOKEN' }
});

const status = await statusResponse.json();

console.log('Overall Status:', status.data.overallStatus);
console.log('Delivery Breakdown:', status.data.statusBreakdown);

// Check individual notification details
status.data.notifications.forEach(notif => {
  console.log(`${notif.channel} to ${notif.recipientEmail}: ${notif.status}`);
  if (notif.status === 'DELIVERED') {
    console.log(`Delivered at: ${notif.deliveredAt}`);
  } else if (notif.status === 'FAILED') {
    console.log(`Failed: ${notif.failureReason}`);
  }
});
```

## Error Handling

### Validation Errors

```javascript
try {
  const response = await fetch('/tax/calculate-paye', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer YOUR_TOKEN',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      monthlyGrossSalary: -1000 // Invalid negative salary
    })
  });

  if (!response.ok) {
    const error = await response.json();

    if (error.status === 400) {
      console.log('Validation errors:');
      error.errors?.forEach(err => {
        console.log(`- ${err.field}: ${err.message}`);
      });
    }
  }
} catch (error) {
  console.error('Request failed:', error);
}
```

### Rate Limit Handling

```javascript
async function makeRequestWithRetry(url, options, maxRetries = 3) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);

      if (response.status === 429) {
        const retryAfter = parseInt(response.headers.get('Retry-After') || '60');
        console.log(`Rate limited. Waiting ${retryAfter} seconds...`);
        await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
        continue;
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return response;
    } catch (error) {
      if (attempt === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt)));
    }
  }
}

// Usage
const response = await makeRequestWithRetry('/tax/calculate-paye', {
  method: 'POST',
  headers: { 'Authorization': 'Bearer YOUR_TOKEN', 'Content-Type': 'application/json' },
  body: JSON.stringify(payeData)
});
```

### GRA Integration Error Handling

```javascript
try {
  const vatSubmission = await fetch('/tax/submit-vat-return', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer YOUR_TOKEN',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(vatReturnData)
  });

  if (!vatSubmission.ok) {
    const error = await vatSubmission.json();

    switch (error.status) {
      case 401:
        console.log('GRA authentication expired. Re-authenticate required.');
        // Trigger re-authentication flow
        break;
      case 422:
        console.log('GRA validation failed:', error.detail);
        // Show GRA-specific validation errors to user
        break;
      case 503:
        console.log('GRA services temporarily unavailable');
        // Queue submission for retry later
        break;
      default:
        console.log('Submission failed:', error.detail);
    }
  }
} catch (error) {
  console.error('Network error during GRA submission:', error);
}
```

## Complete Workflow Examples

### New Client Onboarding with Tax Setup

```javascript
async function onboardNewClient() {
  // 1. Create client
  const clientData = {
    name: "TechStart Inc.",
    entityType: "LIMITED_LIABILITY",
    email: "info@techstart.gy",
    phoneNumber: "+592-555-0123",
    taxIdNumber: "TIN123456789"
  };

  const clientResponse = await fetch('/clients', {
    method: 'POST',
    headers: { 'Authorization': 'Bearer YOUR_TOKEN', 'Content-Type': 'application/json' },
    body: JSON.stringify(clientData)
  });

  const client = (await clientResponse.json()).data;
  console.log('Client created:', client.id);

  // 2. Set up GRA authentication
  const graAuth = {
    clientId: client.id,
    tin: client.taxIdNumber,
    username: "gra_username",
    password: "gra_password"
  };

  await fetch('/gra/authenticate', {
    method: 'POST',
    headers: { 'Authorization': 'Bearer YOUR_TOKEN', 'Content-Type': 'application/json' },
    body: JSON.stringify(graAuth)
  });

  // 3. Sync with GRA records
  const syncResponse = await fetch(`/gra/sync/${client.id}`, {
    method: 'POST',
    headers: { 'Authorization': 'Bearer YOUR_TOKEN', 'Content-Type': 'application/json' },
    body: JSON.stringify({
      tin: client.taxIdNumber,
      syncType: "BASIC_INFO"
    })
  });

  // 4. Send welcome notification
  const welcomeNotification = {
    recipients: [{ email: client.email, name: client.name }],
    channels: ["EMAIL"],
    template: "WELCOME_MESSAGE",
    subject: "Welcome to GK-Nexus",
    message: "Welcome to GK-Nexus! Your account has been set up successfully.",
    clientId: client.id
  };

  await fetch('/notifications/send', {
    method: 'POST',
    headers: { 'Authorization': 'Bearer YOUR_TOKEN', 'Content-Type': 'application/json' },
    body: JSON.stringify(welcomeNotification)
  });

  console.log('Client onboarding completed successfully');
}
```

### Monthly Tax Processing Workflow

```javascript
async function processMonthlyTaxes(clientId, period) {
  // 1. Calculate payroll taxes for all employees
  const employees = await getClientEmployees(clientId);
  const payrollResults = [];

  for (const employee of employees) {
    const payrollCalc = await fetch('/tax/calculate-payroll', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer YOUR_TOKEN', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        monthlyGrossSalary: employee.salary,
        personalAllowances: employee.allowances,
        dependentAllowances: employee.dependents * 5000
      })
    });

    payrollResults.push(await payrollCalc.json());
  }

  // 2. Submit PAYE return to GRA
  const payeSubmission = {
    clientId,
    period,
    employees: employees.map((emp, i) => ({
      employeeId: emp.id,
      nrc: emp.nrc,
      fullName: emp.fullName,
      ...payrollResults[i].data
    }))
  };

  const payeResponse = await fetch('/gra/submit-paye-return', {
    method: 'POST',
    headers: { 'Authorization': 'Bearer YOUR_TOKEN', 'Content-Type': 'application/json' },
    body: JSON.stringify(payeSubmission)
  });

  // 3. Send confirmation notification
  const confirmation = {
    recipients: [{ email: client.email }],
    channels: ["EMAIL"],
    template: "FILING_STATUS_UPDATE",
    subject: "PAYE Return Submitted Successfully",
    message: `Your PAYE return for ${period} has been submitted to GRA.`,
    clientId
  };

  await fetch('/notifications/send', {
    method: 'POST',
    headers: { 'Authorization': 'Bearer YOUR_TOKEN', 'Content-Type': 'application/json' },
    body: JSON.stringify(confirmation)
  });

  console.log('Monthly tax processing completed');
}
```

This comprehensive collection provides real-world examples for every major API endpoint and common integration patterns. Use these examples as a starting point for your integration and modify them according to your specific requirements.